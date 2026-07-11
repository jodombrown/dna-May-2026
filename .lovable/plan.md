# Platform-Smart DIA — Phase 1 & 2

## Goal

DIA today only knows what Perplexity knows. After this work, DIA can also answer questions grounded in your Supabase data — *any* question a member would reasonably ask, whether it's "Who in my network just joined Convene?" or "How many people viewed my post in the last 30 days?" or "Generate me a list of artisans in Kenya." All lookups run server-side under the caller's JWT, so RLS still guards every row.

We split into two ships: **Phase 1** proves the loop works end-to-end. **Phase 2** makes the results feel native inside the DIA sheet. Phases 3 (smart chip generation) and 4 (guardrails, caching, telemetry) come later, as you said.

---

## Phase 1 — Tool loop + intent routing

### 1.1 Model + framework choice

- **Model:** `google/gemini-3-flash-preview` via the Lovable AI Gateway. It's fast, cheap, multimodal-capable, and handles tool-calling well — right fit for a chat-style loop where most turns are 1-2 tool calls.
- **Framework:** AI SDK (`ai` + `@ai-sdk/openai-compatible`) with the existing `_shared/ai-gateway.ts` provider helper. `streamText` + `tool()` + `stopWhen: stepCountIs(50)`.
- **Perplexity becomes a tool**, not the entry point. Web search is one option the model picks from a menu, not the whole show.

### 1.2 Tool catalog (server-side, RLS-safe)

Each tool is a typed function in `supabase/functions/_shared/dia-tools.ts` with a Zod input schema, a compact JSON return, and a hard row cap (typically 20). All Supabase clients are constructed with the caller's JWT so `auth.uid()` resolves and every RLS policy still applies.

**Network & people**
- `search_my_network(query, filters?)` — profiles in my accepted `connections`, filtered by heritage/sector/location/skills. Returns `{ id, full_name, headline, location, connection_since }`.
- `search_platform_people(query, filters?)` — profiles anyone can see (respecting profile privacy). This is what powers "farmers in North America" or "artisans in Kenya" — full-platform search, not just my network.
- `recent_joins(module, since_days)` — who recently joined a hub (Convene attendees, Connect newcomers, Contribute contributors, space members).

**Modules**
- `find_events(topic?, region?, date_window?, my_network_only?)` — Convene events + who I know that's attending.
- `find_spaces(role?, status?, topic?)` — spaces I lead / participate in, optionally filtered by stalled / active / topic.
- `find_opportunities(sector?, region?, type?)` — Contribute needs/offers.
- `find_stories_and_posts(topic?, author?, since_days?)` — Convey posts + stories.

**Me & my stuff**
- `my_post_analytics(post_id?, since_days)` — reads `post_analytics` / `post_views` / engagement events for posts I authored. Returns view/like/comment/reshare counts + trend. Answers "how many people viewed my post in the last 30 days."
- `my_footprint(since_days?)` — cross-module summary of what I've been doing (posts, RSVPs, contributions).

**External**
- `web_search(query, recency?)` — thin wrapper around Perplexity for anything not in our DB (macro trends, news, external market data).

The tool names, descriptions, and Zod schemas are what the model actually sees; each description is one crisp sentence stating "use this when…" so Gemini routes correctly.

### 1.3 Intent routing (cost saver)

Before the tool loop, one tiny classifier call (same model, `generateObject`, ~50 tokens) tags the query as `internal | external | hybrid | ambiguous`. This is a hint, not a hard gate — Gemini still has the full toolset. It just means:

- `internal` → we omit `web_search` from the tools array (saves a Perplexity call and often a whole extra step).
- `external` → we omit the platform tools.
- `hybrid` / `ambiguous` → full toolset available.

If the classifier is unsure it defaults to `hybrid`. Cheap, one call, ~200ms.

### 1.4 Rewriting `dia-search`

Rewrite `supabase/functions/dia-search/index.ts` to:

1. Auth: keep existing JWT check; extract `userId` and the raw access token.
2. Rate limit: keep the existing `dia_user_usage` check as-is.
3. Cache lookup: keep the SHA-256 cached-answer path — cache by `(user_id, query_hash)` since results are now user-scoped.
4. Classify intent (§1.3).
5. Build the tool set, binding each tool's Supabase client to the caller's JWT.
6. Run `streamText({ model, system, messages, tools, stopWhen: stepCountIs(50) })` — collect the final text + all tool results.
7. Persist to `dia_query_log` including which tools fired and their args (for Phase 4 telemetry).
8. Return `{ answer, citations, tool_results: { profiles, events, spaces, opportunities, posts, analytics }, cached, response_time_ms, usage }`.

Perplexity moves from a top-level call to inside `web_search` tool. The `PERPLEXITY_API_KEY` secret is already configured.

### 1.5 System prompt

Short and rule-based, not chatty. Tells DIA:

- You have tools for platform data AND a web-search tool. Prefer platform tools when the question is about "my network," "my events," "my posts," or anything a member of DNA would know. Use web search for macro/news/external data.
- Never guess membership or engagement numbers — call a tool.
- Never claim you can't answer a platform question without calling at least one platform tool first.
- Return concise answers with entity references (IDs) that the UI can render as cards.
- If a tool returns empty, say so plainly and suggest a related tool the user could try — do not fabricate.

That last rule directly fixes the failure in Screenshot 4 where Perplexity happily wrote a page about why it couldn't find the answer.

---

## Phase 2 — Rendering & response contract

### 2.1 Typed response contract

New response shape (backward-compatible aliases keep `DiaSearch.tsx` working during rollout):

```text
{
  answer: string,
  citations: string[],            // web citations only
  tool_results: {
    profiles: Profile[],          // from search_my_network / search_platform_people / recent_joins
    events: Event[],
    spaces: Space[],
    opportunities: Opportunity[],
    posts: PostSummary[],
    analytics?: PostAnalyticsSummary,
    stories?: Story[]
  },
  cached: boolean,
  response_time_ms: number,
  usage: { queries_used, queries_limit, queries_remaining },
  tools_fired: string[]           // for telemetry + smart chips later
}
```

### 2.2 UI wiring in `DiaSearch.tsx`

- Map `tool_results.*` into the existing sections (`renderNetworkMatches`). No new card components — reuse `DiaProfileCard`, `DiaOpportunityCard`, `DiaStoryCard`, plus the existing event/space list styling.
- Add one new compact section for `analytics` (a small "Your post: 342 views, 18 reactions, 5 comments — up 22% vs prior 30 days" block). Simple text + one sparkline placeholder for now.
- Empty-state fallback: if `answer` is present but every `tool_results.*` array is empty AND no web citations, render the friendly "DIA looked but didn't find a match" card with 2-3 suggested reframes generated by the model as part of the same response (the system prompt asks for them when applicable).

### 2.3 Keep the sheet UX we just shipped

No changes to `DiaSheet.tsx` visuals. The dynamic textarea, Kente background, compact submit button, and single-DIA-brand header all stay.

---

## Technical details

### Files touched (Phase 1)

- `supabase/functions/_shared/dia-tools.ts` — NEW. All 10 tools + shared JWT client factory + Zod schemas.
- `supabase/functions/_shared/ai-gateway.ts` — already exists per knowledge; verify export.
- `supabase/functions/dia-search/index.ts` — rewritten around the AI SDK loop.
- `supabase/functions/dia-search/deno.json` — add `ai`, `@ai-sdk/openai-compatible`, `zod` via `npm:` specifiers.
- Secret check: confirm `LOVABLE_API_KEY` (used by Lovable AI Gateway) and `PERPLEXITY_API_KEY` are set; use `add_secret` if either is missing.

### Files touched (Phase 2)

- `src/components/dia/DiaSearch.tsx` — response mapping + optional analytics block + empty-state reframes.
- `src/components/dia/DiaAnalyticsSummary.tsx` — NEW small component for the post-analytics case.
- `src/types/dia.ts` (or inline) — updated response type.

### RLS + security

- Every tool builds its Supabase client with `{ global: { headers: { Authorization: `Bearer ${callerJwt}` } } }`. No service role anywhere in tool handlers.
- Zod caps every list at 20 rows to keep the token budget sane.
- `search_platform_people` is bounded by whatever `profiles` RLS already exposes to `authenticated`.
- Tool args and results are logged to `dia_query_log` (existing table) for later telemetry; no PII beyond IDs.

### Cost / latency envelope

- Classifier: ~1 quick Gemini call.
- Main loop: usually 1-2 tool calls + 1 synthesis, capped at `stepCountIs(50)` for safety.
- Typical query: <2s end-to-end for pure internal, <4s when Perplexity is used. Cache short-circuits repeats.

### What Phase 1+2 explicitly does NOT do

- No new schema (uses existing tables listed in `<supabase-tables>`).
- No streaming in the UI yet — full response comes back, we render. Streaming can come later without changing the tools.
- No smart chip generation (that's Phase 3).
- No per-tool result caching, budget dashboard, or feedback loop (Phase 4).
- No DIA "conversation memory" across multiple queries — each query is a fresh turn, same as today. Multi-turn threading is a separate design.

---

## What you'll see when it ships

- "Who in my network just joined Convene?" returns actual Convene joiners from your accepted connections, rendered as profile cards, in <2s.
- "Generate me a list of artisans in Kenya" returns platform members matching that filter, rendered as profile cards.
- "How many people viewed my post in the last 30 days?" returns a compact analytics block with the real numbers, not a Perplexity essay.
- Questions DIA genuinely can't answer (e.g. very personal external context) still get a clean "I looked but didn't find this — try X" card, never a hallucinated apology.

Approve this and I'll ship Phase 1 first (backend loop + tools), verify against your real Convene question, then ship Phase 2 (frontend mapping).

// DIA search — platform-smart tool-loop.
// Uses Lovable AI Gateway (Gemini) with OpenAI-compat function-calling to
// decide when to hit platform tools vs. web search. All platform tools run
// under the caller's JWT so RLS still guards every row.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  TOOL_DEFINITIONS,
  executeTool,
  makeUserClient,
  emptyResults,
  type AggregatedResults,
} from "../_shared/dia-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const MAX_TOOL_STEPS = 6;
// Phase 4 guardrails
const MAX_TOOL_CALLS_TOTAL = 12;   // hard cap across all steps
const MAX_TOOL_ERRORS = 2;          // per-tool error budget before we drop it
const MAX_TOKENS_TOTAL = 6000;      // rough cap across the whole loop

// Very light prompt-injection heuristics. These are STRIPPED from the raw
// query before we forward it to the model, so a hostile query can't easily
// rewrite the system prompt or make DIA call web_search for private data.
const INJECTION_PATTERNS: RegExp[] = [
  /\bignore (all )?(previous|above|prior) (instructions|prompts?)\b/gi,
  /\bdisregard (the )?system prompt\b/gi,
  /\byou are now\b.{0,40}\b(assistant|dan|jailbreak|developer mode)\b/gi,
  /\bprint (your )?(system|initial) prompt\b/gi,
];

function sanitizeQuery(raw: string): { clean: string; blocked: boolean; reason?: string } {
  let clean = raw;
  let hit = false;
  for (const pat of INJECTION_PATTERNS) {
    if (pat.test(clean)) { hit = true; clean = clean.replace(pat, "[redacted]"); }
  }
  // Block only if the ENTIRE query is basically the injection
  if (hit && clean.replace(/\[redacted\]/g, "").trim().length < 8) {
    return { clean, blocked: true, reason: "prompt_injection" };
  }
  return { clean, blocked: false, reason: hit ? "sanitized" : undefined };
}

const SYSTEM_PROMPT = `You are DIA (Diaspora Intelligence Agent), the intelligence layer for DNA — the platform mobilizing the Global African Diaspora.

You have TWO kinds of tools:
1. PLATFORM tools (search_my_network, search_platform_people, recent_convene_joins, find_events, find_spaces, find_opportunities, my_post_analytics, find_stories_and_posts) — these read the user's DNA data under their permissions.
2. web_search — searches the OPEN WEB via Perplexity.

Routing rules (STRICT):
- If the question is about "my network", "my connections", "my posts", "my events", "my spaces", things happening ON DNA, or lists of people/events/opportunities that DNA members would have — use PLATFORM tools FIRST. Never answer these from memory. Never call web_search for them.
- Only use web_search for macro news, external facts, or clearly external topics.
- You may call multiple platform tools if needed. Compose your answer from the tool results.
- If a platform tool returns 0 results, say so plainly ("I looked and didn't find any X yet") and suggest one concrete adjacent action the user could take. Do NOT fabricate results. Do NOT switch to web_search as a workaround for missing platform data.
- Keep answers concise (under 180 words), grounded in tool results, and never invent people or events.
- Cite web sources only when web_search was actually used.`;

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
}

async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(query));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

async function callGateway(messages: ChatMessage[], apiKey: string): Promise<any> {
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 900,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${err.slice(0, 300)}`);
  }
  return resp.json();
}

// Prior turns replayed as follow-up context (max 4). Kept short to stay
// under the token budget — we send the previous user question and a
// truncated assistant answer, no tool payloads.
interface PriorTurn { question: string; answer: string }
const MAX_PRIOR_TURNS = 4;
const PRIOR_ANSWER_CLIP = 600;

async function runToolLoop(
  query: string,
  userId: string,
  accessToken: string,
  apiKey: string,
  priorTurns: PriorTurn[] = [],
): Promise<{ answer: string; citations: string[]; results: AggregatedResults; toolsFired: string[]; tokensUsed: number }> {
  const userSupabase = makeUserClient(accessToken);
  const ctx = { userId, supabase: userSupabase };
  const results = emptyResults();
  const citations: string[] = [];
  const toolsFired: string[] = [];

  // Phase 4: per-loop memoization + per-tool error budget
  const toolCache = new Map<string, { text: string; partial: any }>();
  const toolErrors = new Map<string, number>();
  let totalToolCalls = 0;
  let tokensUsed = 0;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  // Replay up to MAX_PRIOR_TURNS previous Q&A pairs so DIA can refine.
  for (const t of priorTurns.slice(-MAX_PRIOR_TURNS)) {
    messages.push({ role: "user", content: t.question });
    messages.push({ role: "assistant", content: (t.answer ?? "").slice(0, PRIOR_ANSWER_CLIP) });
  }
  messages.push({ role: "user", content: query });

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    if (tokensUsed > MAX_TOKENS_TOTAL) break;
    const completion = await callGateway(messages, apiKey);
    tokensUsed += completion?.usage?.total_tokens ?? 0;
    const msg = completion?.choices?.[0]?.message;
    if (!msg) throw new Error("Empty model response");

    messages.push({
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: msg.tool_calls,
    });

    const toolCalls = msg.tool_calls ?? [];
    if (!toolCalls.length) {
      return { answer: msg.content ?? "", citations, results, toolsFired, tokensUsed };
    }

    for (const call of toolCalls) {
      if (totalToolCalls >= MAX_TOOL_CALLS_TOTAL) {
        messages.push({ role: "tool", tool_call_id: call.id, name: call.function?.name, content: JSON.stringify({ error: "tool_budget_exhausted" }) });
        continue;
      }
      totalToolCalls++;

      const name = call.function?.name;
      let args: any = {};
      try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { args = {}; }

      // Skip tools that have errored too many times this loop
      if ((toolErrors.get(name) ?? 0) >= MAX_TOOL_ERRORS) {
        messages.push({ role: "tool", tool_call_id: call.id, name, content: JSON.stringify({ error: "tool_disabled_after_repeated_errors" }) });
        continue;
      }

      // Per-loop memoization: identical (tool, args) returns cached result
      const cacheKey = `${name}:${JSON.stringify(args)}`;
      let text: string;
      let partial: any;
      const cached = toolCache.get(cacheKey);
      if (cached) {
        text = cached.text;
        partial = cached.partial;
      } else {
        try {
          const exec = await executeTool(name, args, ctx, citations);
          text = exec.text;
          partial = exec.results;
          toolCache.set(cacheKey, { text, partial });
        } catch (e: any) {
          toolErrors.set(name, (toolErrors.get(name) ?? 0) + 1);
          text = JSON.stringify({ error: e?.message ?? "tool_error" });
          partial = {};
        }
      }

      toolsFired.push(name);
      if (partial.profiles?.length) results.profiles.push(...partial.profiles);
      if (partial.events?.length) results.events.push(...partial.events);
      if (partial.projects?.length) results.projects.push(...partial.projects);
      if (partial.opportunities?.length) results.opportunities.push(...partial.opportunities);
      if (partial.stories?.length) results.stories.push(...partial.stories);
      if (partial.analytics) results.analytics = partial.analytics;

      messages.push({ role: "tool", tool_call_id: call.id, name, content: text });
    }
  }

  const final = await callGateway(
    messages.concat([{ role: "user", content: "Summarize the tool results concisely." }]),
    apiKey,
  );
  tokensUsed += final?.usage?.total_tokens ?? 0;
  return {
    answer: final?.choices?.[0]?.message?.content ?? "I gathered some results but couldn't finish synthesizing.",
    citations,
    results,
    toolsFired,
    tokensUsed,
  };
}

// De-duplicate merged results by id
function dedupe(results: AggregatedResults): AggregatedResults {
  const uniq = <T extends { id?: string }>(arr: T[]) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr) {
      const k = item.id ?? JSON.stringify(item);
      if (!seen.has(k)) { seen.add(k); out.push(item); }
    }
    return out;
  };
  return {
    profiles: uniq(results.profiles),
    events: uniq(results.events),
    projects: uniq(results.projects),
    hashtags: results.hashtags,
    opportunities: uniq(results.opportunities),
    stories: uniq(results.stories),
    analytics: results.analytics,
  };
}

// Generate 3 short follow-up prompts based on the current answer.
// One cheap gateway call, no tools, ~60 tokens out.
async function generateFollowUps(question: string, answer: string, apiKey: string): Promise<string[]> {
  try {
    const resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          { role: "system", content: "You suggest 3 concise follow-up questions a DNA (Diaspora Network of Africa) member could ask DIA next, based on the answer they just received. Each under 60 chars. Output ONLY a JSON array of 3 strings, nothing else." },
          { role: "user", content: `Question: ${question}\n\nAnswer: ${answer.slice(0, 800)}\n\nSuggest 3 follow-ups as JSON array.` },
        ],
      }),
    });
    if (!resp.ok) return [];
    const j = await resp.json();
    const raw: string = j?.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, 3) : [];
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey); // used only for auth check + rate-limit tables

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token", message: "Please sign in to use DIA" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const rawQuery: string = body?.query;
    const source: string = body?.source ?? "dashboard";
    const priorTurns: PriorTurn[] = Array.isArray(body?.prior_turns) ? body.prior_turns : [];
    const isFollowUp = priorTurns.length > 0;
    if (priorTurns.length > MAX_PRIOR_TURNS) {
      return new Response(JSON.stringify({ error: "Thread limit reached", message: "Start a new question to keep asking." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!rawQuery || String(rawQuery).trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (String(rawQuery).length > 500) {
      return new Response(JSON.stringify({ error: "Query too long", message: "Max 500 chars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Phase 4 guardrail: sanitize prompt-injection attempts
    const { clean: query, blocked, reason: sanitizeReason } = sanitizeQuery(String(rawQuery));
    if (blocked) {
      admin.from("dia_query_log").insert({
        user_id: user.id, query_text: rawQuery, cache_hit: false,
        response_time_ms: 0, source, success: false,
        blocked_reason: sanitizeReason, tools_fired: [],
      }).then(() => {}).catch(() => {});
      return new Response(JSON.stringify({
        error: "Query blocked",
        message: "Your question was blocked by DIA's safety filter. Try rephrasing.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const startTime = Date.now();
    const normalized = normalizeQuery(query);
    const queryHash = await hashQuery(`${user.id}:${normalized}`);

    // Rate limit
    const currentMonth = new Date();
    currentMonth.setDate(1); currentMonth.setHours(0, 0, 0, 0);
    const periodStart = currentMonth.toISOString().split("T")[0];
    let { data: usage } = await admin.from("dia_user_usage").select("*")
      .eq("user_id", user.id).eq("period_start", periodStart).single();
    if (!usage) {
      const { data: newUsage } = await admin.from("dia_user_usage").insert({
        user_id: user.id, period_start: periodStart, query_count: 0, query_limit: 10,
      }).select().single();
      usage = newUsage;
    }
    if (usage && usage.query_count >= usage.query_limit) {
      return new Response(JSON.stringify({
        error: "Monthly query limit reached",
        message: "You've used all your DIA queries this month",
        limit: usage.query_limit, used: usage.query_count,
        resets_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cache lookup (per-user, since tool results are user-scoped).
    // Follow-ups bypass the cache — they depend on prior_turns context.
    const { data: cached } = isFollowUp
      ? { data: null as any }
      : await admin.from("dia_queries").select("*")
          .eq("query_hash", queryHash)
          .gt("expires_at", new Date().toISOString()).maybeSingle();

    let response: any;
    let cacheHit = false;
    let toolsFired: string[] = [];
    let tokensUsed = 0;
    let loopError: string | undefined;

    if (cached) {
      cacheHit = true;
      toolsFired = (cached.perplexity_response?.tools_fired as string[]) ?? [];
      response = {
        answer: cached.perplexity_response?.answer ?? "",
        citations: cached.citations ?? [],
        network_matches: cached.network_matches ?? emptyResults(),
        cached: true,
        query_hash: queryHash,
      };
      admin.from("dia_queries").update({ cache_hits: (cached.cache_hits ?? 0) + 1 })
        .eq("id", cached.id).then(() => {}).catch(() => {});
    } else {
      try {
        const loop = await runToolLoop(query, user.id, token, lovableKey, priorTurns);
        const deduped = dedupe(loop.results);
        toolsFired = loop.toolsFired;
        tokensUsed = loop.tokensUsed;

        response = {
          answer: loop.answer,
          citations: loop.citations,
          network_matches: deduped,
          cached: false,
          query_hash: queryHash,
        };

        // Cache (24h)
        await admin.from("dia_queries").insert({
          query_hash: queryHash,
          query_text: query,
          normalized_query: normalized,
          perplexity_response: { answer: loop.answer, tools_fired: toolsFired },
          citations: loop.citations,
          network_matches: deduped,
          model_used: MODEL,
          tokens_used: tokensUsed,
          estimated_cost: 0,
          expires_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
        }).then(() => {}).catch((e: any) => console.error("cache insert:", e?.message));

        // Update usage
        await admin.from("dia_user_usage").update({
          query_count: (usage?.query_count ?? 0) + 1,
          last_query_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id).eq("period_start", periodStart);
      } catch (loopErr: any) {
        loopError = loopErr?.message ?? "loop_error";
        throw loopErr;
      } finally {
        // Phase 4 telemetry: always record even if the loop failed
        admin.from("dia_query_log").insert({
          user_id: user.id,
          query_text: rawQuery,
          cache_hit: cacheHit,
          response_time_ms: Date.now() - startTime,
          source,
          tools_fired: toolsFired,
          success: !loopError,
          error_message: loopError,
          tokens_used: tokensUsed,
          blocked_reason: sanitizeReason,
        }).then(() => {}).catch(() => {});
      }
    }

    // Log cache-hit path (the loop path logs in its finally block)
    if (cacheHit) {
      admin.from("dia_query_log").insert({
        user_id: user.id,
        query_text: rawQuery,
        cache_hit: true,
        response_time_ms: Date.now() - startTime,
        source,
        tools_fired: toolsFired,
        success: true,
        blocked_reason: sanitizeReason,
      }).then(() => {}).catch(() => {});
    }

    // Follow-up suggestions — only when there's room left in the thread.
    // If we're already at MAX_PRIOR_TURNS priors, this is the final turn.
    let followUps: string[] = [];
    const turnsRemaining = MAX_PRIOR_TURNS - priorTurns.length;
    if (turnsRemaining > 0 && response.answer) {
      followUps = await generateFollowUps(rawQuery, response.answer, lovableKey);
    }
    response.follow_ups = followUps;
    response.turns_remaining = turnsRemaining;

    return new Response(JSON.stringify({
      success: true,
      data: response,
      usage: {
        queries_used: (usage?.query_count ?? 0) + (cacheHit ? 0 : 1),
        queries_limit: usage?.query_limit ?? 10,
        queries_remaining: Math.max(0, (usage?.query_limit ?? 10) - (usage?.query_count ?? 0) - (cacheHit ? 0 : 1)),
      },
      response_time_ms: Date.now() - startTime,
      tools_fired: toolsFired,
      query_hash: queryHash,
      follow_ups: followUps,
      turns_remaining: turnsRemaining,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("DIA search error:", err?.message ?? err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: err?.message ?? "Something went wrong",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

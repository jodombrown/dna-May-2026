// DIA search — platform-smart tool-loop, re-pointed through dia-core (DIA2/BD125).
// Identity, model-config, limits, and audit now come from _shared/dia-core.
// This function owns only its orchestration (tool loop, cache, prompts).
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  TOOL_DEFINITIONS,
  executeTool,
  makeUserClient,
  emptyResults,
  type AggregatedResults,
  callModel,
  requireUser,
  checkLimit,
  recordUsage,
  writeEvent,
  modelFor,
} from "../_shared/dia-core/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAPABILITY = "reactive_query" as const;
const MAX_TOOL_STEPS = 6;
const MAX_TOOL_CALLS_TOTAL = 12;
const MAX_TOOL_ERRORS = 2;
const MAX_TOKENS_TOTAL = 6000;

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

// Single gateway call, now via dia-core.callModel (no gateway URL / model literal here).
async function callGateway(messages: ChatMessage[]): Promise<any> {
  const r = await callModel({
    capability: CAPABILITY,
    messages,
    tools: TOOL_DEFINITIONS,
    toolChoice: "auto",
    temperature: 0.2,
    maxTokens: 900,
  });
  return r.raw;
}

interface PriorTurn { question: string; answer: string }
const MAX_PRIOR_TURNS = 4;
const PRIOR_ANSWER_CLIP = 600;

async function runToolLoop(
  query: string,
  userId: string,
  accessToken: string,
  priorTurns: PriorTurn[] = [],
): Promise<{ answer: string; citations: string[]; results: AggregatedResults; toolsFired: string[]; tokensUsed: number }> {
  const userSupabase = makeUserClient(accessToken);
  const ctx = { userId, supabase: userSupabase };
  const results = emptyResults();
  const citations: string[] = [];
  const toolsFired: string[] = [];

  const toolCache = new Map<string, { text: string; partial: any }>();
  const toolErrors = new Map<string, number>();
  let totalToolCalls = 0;
  let tokensUsed = 0;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  for (const t of priorTurns.slice(-MAX_PRIOR_TURNS)) {
    messages.push({ role: "user", content: t.question });
    messages.push({ role: "assistant", content: (t.answer ?? "").slice(0, PRIOR_ANSWER_CLIP) });
  }
  messages.push({ role: "user", content: query });

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    if (tokensUsed > MAX_TOKENS_TOTAL) break;
    const completion = await callGateway(messages);
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

      if ((toolErrors.get(name) ?? 0) >= MAX_TOOL_ERRORS) {
        messages.push({ role: "tool", tool_call_id: call.id, name, content: JSON.stringify({ error: "tool_disabled_after_repeated_errors" }) });
        continue;
      }

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

async function generateFollowUps(question: string, answer: string): Promise<string[]> {
  try {
    const r = await callModel({
      capability: CAPABILITY,
      temperature: 0.4,
      maxTokens: 120,
      messages: [
        { role: "system", content: "You suggest 3 concise follow-up questions a DNA (Diaspora Network of Africa) member could ask DIA next, based on the answer they just received. Each under 60 chars. Output ONLY a JSON array of 3 strings, nothing else." },
        { role: "user", content: `Question: ${question}\n\nAnswer: ${answer.slice(0, 800)}\n\nSuggest 3 follow-ups as JSON array.` },
      ],
    });
    const raw: string = r.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, 3) : [];
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey); // service-role: auth check + rate-limit + audit tables

    // Identity (dia-core / _shared auth)
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;
    const token = auth.token;

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

    const { clean: query, blocked, reason: sanitizeReason } = sanitizeQuery(String(rawQuery));
    if (blocked) {
      admin.from("dia_query_log").insert({
        user_id: userId, query_text: rawQuery, cache_hit: false,
        response_time_ms: 0, source, success: false,
        blocked_reason: sanitizeReason, tools_fired: [],
      }).then(() => {}).catch(() => {});
      await writeEvent(admin, {
        userId, capability: CAPABILITY, surface: "dia-search",
        provider: "gemini", model: modelFor(CAPABILITY), success: false,
        latencyMs: Date.now() - startTime, errorCode: "blocked",
        meta: { blocked_reason: sanitizeReason, source },
      });
      return new Response(JSON.stringify({
        error: "Query blocked",
        message: "Your question was blocked by DIA's safety filter. Try rephrasing.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalized = normalizeQuery(query);
    const queryHash = await hashQuery(`${userId}:${normalized}`);

    // Limits (dia-core → dia_check_limit). Source of truth is dia_tier_limits.
    const limit = await checkLimit(admin, userId, CAPABILITY);
    if (!limit.allowed) {
      return new Response(JSON.stringify({
        error: "Monthly query limit reached",
        message: "You've used all your DIA queries this month",
        limit: limit.limit, used: limit.used,
        resets_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
        const loop = await runToolLoop(query, userId, token, priorTurns);
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

        await admin.from("dia_queries").insert({
          query_hash: queryHash,
          query_text: query,
          normalized_query: normalized,
          perplexity_response: { answer: loop.answer, tools_fired: toolsFired },
          citations: loop.citations,
          network_matches: deduped,
          model_used: modelFor(CAPABILITY),
          tokens_used: tokensUsed,
          estimated_cost: 0,
          expires_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
        }).then(() => {}).catch((e: any) => console.error("cache insert:", e?.message));

        // Limits: record AFTER success so failed loops don't count.
        await recordUsage(admin, userId, CAPABILITY, tokensUsed);
      } catch (loopErr: any) {
        loopError = loopErr?.message ?? "loop_error";
        throw loopErr;
      } finally {
        admin.from("dia_query_log").insert({
          user_id: userId,
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

    if (cacheHit) {
      admin.from("dia_query_log").insert({
        user_id: userId,
        query_text: rawQuery,
        cache_hit: true,
        response_time_ms: Date.now() - startTime,
        source,
        tools_fired: toolsFired,
        success: true,
        blocked_reason: sanitizeReason,
      }).then(() => {}).catch(() => {});
    }

    let followUps: string[] = [];
    const turnsRemaining = MAX_PRIOR_TURNS - priorTurns.length;
    if (turnsRemaining > 0 && response.answer) {
      followUps = await generateFollowUps(rawQuery, response.answer);
    }
    response.follow_ups = followUps;
    response.turns_remaining = turnsRemaining;

    // Audit: the unified spine (dia_events). Read back by the DIA2 exit-gate probe.
    await writeEvent(admin, {
      userId, capability: CAPABILITY, surface: "dia-search",
      provider: "gemini", model: modelFor(CAPABILITY), success: true,
      latencyMs: Date.now() - startTime, tokens: tokensUsed,
      meta: { cache_hit: cacheHit, tools_fired: toolsFired, source, sanitize_reason: sanitizeReason ?? null },
    });

    return new Response(JSON.stringify({
      success: true,
      data: response,
      usage: {
        queries_used: limit.used + (cacheHit ? 0 : 1),
        queries_limit: limit.limit,
        queries_remaining: limit.remaining == null ? null : Math.max(0, limit.remaining - (cacheHit ? 0 : 1)),
      },
      response_time_ms: Date.now() - startTime,
      tools_fired: toolsFired,
      query_hash: queryHash,
      follow_ups: followUps,
      turns_remaining: turnsRemaining,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("DIA search error:", err?.message ?? err);
    // Failure is recorded to the unified spine too — a swallowed error is a lie.
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const admin2 = createClient(supabaseUrl, serviceKey);
      const auth2 = await requireUser(req).catch(() => null);
      const uid = auth2 && (auth2 as any).ok ? (auth2 as any).userId : null;
      await writeEvent(admin2, {
        userId: uid, capability: CAPABILITY, surface: "dia-search",
        provider: "gemini", model: modelFor(CAPABILITY), success: false,
        latencyMs: Date.now() - startTime, errorCode: "server_error",
        errorMessage: (err?.message ?? "unknown").slice(0, 300),
      });
    } catch { /* never let audit failure mask the original error */ }
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: err?.message ?? "Something went wrong",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { buildUserPrompt, getSystemPrompt } from "./prompt.ts";
import { validateOutput } from "./validation.ts";
import {
  type ContributionManifestRow,
  type CurationContext,
  type CurrencyStanceRow,
  isPerplexityResponse,
  type NeedDeclarationRow,
  type ProfileRow,
  type RoomCurationRow,
  type RoomReasoningDatabase,
  type RoomReasoningRequest,
  type RoomReasoningResponse,
  type RowFailure,
} from "./types.ts";

const MAX_BATCH = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseRequest(value: unknown): RoomReasoningRequest | string {
  if (!value || typeof value !== "object") return "Body must be a JSON object";
  const v = value as { curation_ids?: unknown; mode?: unknown };

  if (!Array.isArray(v.curation_ids)) {
    return "curation_ids must be an array";
  }
  if (v.curation_ids.length < 1 || v.curation_ids.length > MAX_BATCH) {
    return `curation_ids must contain between 1 and ${MAX_BATCH} ids`;
  }
  const ids: string[] = [];
  for (const id of v.curation_ids) {
    if (typeof id !== "string" || !UUID_RE.test(id)) {
      return "curation_ids must be UUIDs";
    }
    ids.push(id);
  }

  let mode: "replace" | "fill_only" = "fill_only";
  if (v.mode !== undefined) {
    if (v.mode !== "replace" && v.mode !== "fill_only") {
      return "mode must be 'replace' or 'fill_only'";
    }
    mode = v.mode;
  }

  return { curation_ids: ids, mode };
}

// Best-effort: Supabase exposes the caller's role via the JWT
// payload's `role` claim. We do not need to validate the JWT
// signature here because Supabase has already authenticated the
// request by the time getUser succeeds; we only need the role to
// decide whether to apply the viewer-ownership filter.
function decodeJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

async function callPerplexity(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 120,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Perplexity API error [${response.status}]: ${errText.slice(0, 200)}`,
    );
  }

  const data: unknown = await response.json();
  if (!isPerplexityResponse(data)) {
    throw new Error("Perplexity response missing choices[0].message.content");
  }
  return data.choices[0].message.content;
}

interface ResolvedContext {
  curation: RoomCurationRow;
  context: CurationContext;
}

function resolveContext(
  curation: RoomCurationRow,
  profiles: Map<string, ProfileRow>,
  manifests: Map<string, ContributionManifestRow>,
  stance: CurrencyStanceRow | null,
  need: NeedDeclarationRow | null,
): CurationContext {
  const viewerProfile = profiles.get(curation.viewer_id);
  const matchedProfile = profiles.get(curation.matched_user_id);
  const viewerManifest = manifests.get(curation.viewer_id);
  const matchedManifest = manifests.get(curation.matched_user_id);

  const stanceForViewer = stance && stance.user_id === curation.viewer_id
    ? { title: stance.title, description: stance.description }
    : null;
  const stanceForMatched = stance && stance.user_id === curation.matched_user_id
    ? { title: stance.title, description: stance.description }
    : null;
  const needForViewer = need && need.user_id === curation.viewer_id
    ? { title: need.title, context: need.context }
    : null;
  const needForMatched = need && need.user_id === curation.matched_user_id
    ? { title: need.title, context: need.context }
    : null;

  return {
    curation_id: curation.id,
    kind: curation.kind,
    viewer_display_name: viewerProfile?.full_name ?? "DNA member",
    viewer_headline: viewerManifest?.headline ?? null,
    matched_display_name: matchedProfile?.full_name ?? "DNA member",
    matched_headline: matchedManifest?.headline ?? null,
    viewer_stance: stanceForViewer,
    viewer_need: needForViewer,
    matched_stance: stanceForMatched,
    matched_need: needForMatched,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("dia-room-reasoning: missing Supabase env vars");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }
  if (!perplexityKey) {
    console.error("dia-room-reasoning: missing PERPLEXITY_API_KEY");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body must be valid JSON" }, 400);
  }

  const parsed = parseRequest(body);
  if (typeof parsed === "string") {
    return jsonResponse({ error: parsed }, 400);
  }
  const { curation_ids, mode = "fill_only" } = parsed;

  const supabase = createClient<RoomReasoningDatabase>(
    supabaseUrl,
    supabaseServiceKey,
  );

  // Determine caller identity. Service role tokens bypass the
  // viewer-ownership filter; authenticated user tokens are
  // restricted to curations they own.
  const role = decodeJwtRole(token);
  let viewerFilter: string | null = null;
  if (role !== "service_role") {
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token,
    );
    if (userError || !userData.user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }
    viewerFilter = userData.user.id;
  }

  // Fetch the working set.
  let curationQuery = supabase
    .from("room_curations")
    .select(
      "id, viewer_id, matched_user_id, kind, score, matched_stance_id, matched_need_id, reasoning_source",
    )
    .in("id", curation_ids);
  if (viewerFilter) {
    curationQuery = curationQuery.eq("viewer_id", viewerFilter);
  }

  const { data: curationRows, error: curationErr } = await curationQuery;
  if (curationErr) {
    console.error("dia-room-reasoning: fetch curations failed", curationErr);
    return jsonResponse({ error: "Failed to fetch curations" }, 500);
  }
  const curations: RoomCurationRow[] = curationRows ?? [];

  const failures: RowFailure[] = [];
  let upgraded = 0;
  let skipped = 0;
  let failed = 0;

  if (curations.length === 0) {
    const empty: RoomReasoningResponse = {
      processed: 0,
      upgraded: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    };
    return jsonResponse(empty, 200);
  }

  // Resolve all related entities up front.
  const userIds = new Set<string>();
  const stanceIds = new Set<string>();
  const needIds = new Set<string>();
  for (const row of curations) {
    userIds.add(row.viewer_id);
    userIds.add(row.matched_user_id);
    if (row.matched_stance_id) stanceIds.add(row.matched_stance_id);
    if (row.matched_need_id) needIds.add(row.matched_need_id);
  }

  const [profilesRes, manifestsRes, stancesRes, needsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(userIds)),
    supabase
      .from("contribution_manifests")
      .select("user_id, headline")
      .in("user_id", Array.from(userIds)),
    stanceIds.size > 0
      ? supabase
        .from("currency_stances")
        .select("id, user_id, title, description")
        .in("id", Array.from(stanceIds))
      : Promise.resolve({ data: [] as CurrencyStanceRow[], error: null }),
    needIds.size > 0
      ? supabase
        .from("need_declarations")
        .select("id, user_id, title, context")
        .in("id", Array.from(needIds))
      : Promise.resolve({ data: [] as NeedDeclarationRow[], error: null }),
  ]);

  if (profilesRes.error || manifestsRes.error || stancesRes.error || needsRes.error) {
    console.error("dia-room-reasoning: context fetch failed", {
      profiles: profilesRes.error,
      manifests: manifestsRes.error,
      stances: stancesRes.error,
      needs: needsRes.error,
    });
    return jsonResponse({ error: "Failed to fetch curation context" }, 500);
  }

  const profileMap = new Map<string, ProfileRow>(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );
  const manifestMap = new Map<string, ContributionManifestRow>(
    (manifestsRes.data ?? []).map((m) => [m.user_id, m]),
  );
  const stanceMap = new Map<string, CurrencyStanceRow>(
    (stancesRes.data ?? []).map((s) => [s.id, s]),
  );
  const needMap = new Map<string, NeedDeclarationRow>(
    (needsRes.data ?? []).map((n) => [n.id, n]),
  );

  // Build resolved contexts per curation.
  const resolved: ResolvedContext[] = curations.map((curation) => ({
    curation,
    context: resolveContext(
      curation,
      profileMap,
      manifestMap,
      curation.matched_stance_id
        ? stanceMap.get(curation.matched_stance_id) ?? null
        : null,
      curation.matched_need_id
        ? needMap.get(curation.matched_need_id) ?? null
        : null,
    ),
  }));

  const systemPrompt = getSystemPrompt();

  for (const { curation, context } of resolved) {
    if (mode === "fill_only" && curation.reasoning_source === "dia") {
      skipped += 1;
      continue;
    }

    try {
      const userPrompt = buildUserPrompt(context);
      const raw = await callPerplexity(perplexityKey, systemPrompt, userPrompt);
      const validation = validateOutput(raw);

      if (!validation.ok) {
        failed += 1;
        failures.push({ curation_id: curation.id, reason: validation.reason });
        continue;
      }

      const generatedAt = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("room_curations")
        .update({
          reasoning_text: validation.text,
          reasoning_source: "dia",
          reasoning_generated_at: generatedAt,
        })
        .eq("id", curation.id);

      if (updateErr) {
        failed += 1;
        failures.push({
          curation_id: curation.id,
          reason: `DB update failed: ${updateErr.message}`,
        });
        continue;
      }

      upgraded += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("dia-room-reasoning: row failure", curation.id, message);
      failed += 1;
      failures.push({ curation_id: curation.id, reason: message });
    }
  }

  const response: RoomReasoningResponse = {
    processed: resolved.length,
    upgraded,
    skipped,
    failed,
    failures,
  };
  return jsonResponse(response, 200);
});

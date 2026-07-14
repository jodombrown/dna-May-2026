// watch-curated-sources
//
// Scheduled sweep. For every event where date_confirmed = false and
// curated_source_url is present, fetch the source, hash the meaningful
// content, and compare to source_last_hash. On change, open a review row
// with reason 'source_changed' (idempotent via the partial unique index
// on (event_id, reason) WHERE status='open'). Always update
// source_last_checked; update source_last_hash when it changes.
//
// This function NEVER writes to date_confirmed, start_time, or end_time.
// The machine detects; the human confirms.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { corsHeaders } from "../_shared/cors.ts";
import { requireInternal } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Row {
  id: string;
  curated_source_url: string | null;
  source_last_hash: string | null;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Reduce a page down to meaningful text: strip scripts/styles, collapse
// whitespace. Not perfect, but stable enough that a real content change
// moves the hash and a cache-buster / analytics tag doesn't.
function meaningfulContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = requireInternal(req);
  if (!gate.ok) return gate.response;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: events, error } = await admin
    .from("events")
    .select("id, curated_source_url, source_last_hash")
    .eq("date_confirmed", false)
    .not("curated_source_url", "is", null)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = { checked: 0, changed: 0, failed: 0, reviews_opened: 0 };
  const now = new Date().toISOString();

  for (const e of (events ?? []) as Row[]) {
    if (!e.curated_source_url) continue;
    results.checked++;
    try {
      const res = await fetch(e.curated_source_url, {
        headers: { "User-Agent": "DNA-CuratedWatcher/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        results.failed++;
        await admin.from("events").update({ source_last_checked: now }).eq("id", e.id);
        continue;
      }
      const html = await res.text();
      const hash = await sha256(meaningfulContent(html));

      if (e.source_last_hash && e.source_last_hash !== hash) {
        results.changed++;
        // Idempotent: partial unique index (event_id, reason) WHERE status='open'
        const { error: insErr } = await admin
          .from("curated_source_reviews")
          .insert({
            event_id: e.id,
            reason: "source_changed",
            content_hash: hash,
            status: "open",
          });
        if (!insErr) results.reviews_opened++;
      }

      await admin
        .from("events")
        .update({
          source_last_hash: hash,
          source_last_checked: now,
        })
        .eq("id", e.id);
    } catch (err) {
      results.failed++;
      console.error("watch-curated-sources fetch failed", { eventId: e.id, error: String(err) });
      await admin.from("events").update({ source_last_checked: now }).eq("id", e.id);
    }
  }

  console.log("watch-curated-sources complete", results);
  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

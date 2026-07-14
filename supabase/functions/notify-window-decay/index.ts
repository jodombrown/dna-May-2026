// notify-window-decay
//
// Scheduled sweep. For every event whose date_confirmed = false and whose
// expected_window_start has arrived (<= today) with no announcement, notify
// every subscriber in event_date_subscriptions and stamp
// date_decay_notified_at = now(). The stamp is the idempotency guard:
// fires once, never every morning until December.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { corsHeaders } from "../_shared/cors.ts";
import { requireInternal } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = requireInternal(req);
  if (!gate.ok) return gate.response;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: events, error } = await admin
    .from("events")
    .select("id, title, slug, expected_window_start")
    .eq("date_confirmed", false)
    .is("date_decay_notified_at", null)
    .not("expected_window_start", "is", null)
    .lte("expected_window_start", today)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = { events_decayed: 0, notifications_sent: 0, failed: 0 };
  const now = new Date().toISOString();

  for (const e of events ?? []) {
    try {
      const { data: subs, error: subErr } = await admin
        .from("event_date_subscriptions")
        .select("user_id")
        .eq("event_id", e.id);
      if (subErr) throw subErr;

      const rows = (subs ?? []).map((s) => ({
        user_id: s.user_id,
        type: "event_window_decay",
        title: "Expected dates passed with no announcement",
        message: `"${e.title}" hasn't announced dates yet, and its historical window has arrived.`,
        link_url: e.slug ? `/dna/convene/event/${e.slug}` : `/dna/convene/event/${e.id}`,
        payload: { event_id: e.id },
      }));

      if (rows.length > 0) {
        const { error: notifErr } = await admin.from("notifications").insert(rows);
        if (notifErr) throw notifErr;
        results.notifications_sent += rows.length;
      }

      // Stamp last — if notify fails we retry tomorrow.
      const { error: stampErr } = await admin
        .from("events")
        .update({ date_decay_notified_at: now })
        .eq("id", e.id);
      if (stampErr) throw stampErr;

      results.events_decayed++;
    } catch (err) {
      results.failed++;
      console.error("notify-window-decay failed", { eventId: e.id, error: String(err) });
    }
  }

  console.log("notify-window-decay complete", results);
  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

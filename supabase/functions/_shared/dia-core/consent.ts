// DIA Core — consent. Capability-routed.
// - Reactive, user-invoked capabilities: consent is IMPLIED by the action.
// - Proactive capabilities (nudges, briefs, pulses): gate on notification prefs.
// dia-core only READS preference tables; it never populates them. The proactive
// policy + the messaging-prefs dam are N5's (BD124) to own — this is the primitive
// N5 rides, not a re-owning of the flywheel.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const IMPLIED_CONSENT = new Set<string>([
  "reactive_query",
  "compose_read",
  "smart_replies",
  "smart_compose",
  "smart_chips",
  "thread_summary",
]);

export interface ConsentStatus {
  allowed: boolean;
  reason: string;
}

export async function checkConsent(
  admin: SupabaseClient,
  userId: string,
  capability: string,
): Promise<ConsentStatus> {
  if (IMPLIED_CONSENT.has(capability)) return { allowed: true, reason: "implied" };

  // Proactive default primitive (N5 refines the policy).
  const { data } = await admin
    .from("dia_preferences")
    .select("in_app_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { allowed: false, reason: "no_preferences" };
  return {
    allowed: data.in_app_enabled !== false,
    reason: data.in_app_enabled === false ? "in_app_disabled" : "ok",
  };
}

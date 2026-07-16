// DIA Core — limits. One DB-backed monthly definition (dia_tier_limits) is the
// source of truth; dia_check_limit / dia_record_usage are the checkTierLimit seam.
// Pattern: check BEFORE the model call; record AFTER success (failures don't count).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface LimitStatus {
  allowed: boolean;
  tier: string;
  capability: string;
  limit: number | null; // null = unlimited
  used: number;
  remaining: number | null;
}

export async function checkLimit(
  admin: SupabaseClient,
  userId: string,
  capability: string,
): Promise<LimitStatus> {
  const { data, error } = await admin.rpc("dia_check_limit", {
    p_user_id: userId,
    p_capability: capability,
  });
  if (error) throw new Error(`dia_check_limit: ${error.message}`);
  return data as LimitStatus;
}

export async function recordUsage(
  admin: SupabaseClient,
  userId: string,
  capability: string,
  tokens = 0,
): Promise<void> {
  const { error } = await admin.rpc("dia_record_usage", {
    p_user_id: userId,
    p_capability: capability,
    p_tokens: tokens,
  });
  // A counter write must never block the user's response — but a swallowed error
  // is a lie, so it is logged, never silently discarded.
  if (error) console.error(`dia_record_usage: ${error.message}`);
}

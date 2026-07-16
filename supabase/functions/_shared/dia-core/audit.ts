// DIA Core — audit. One event shape, one writer, one table (dia_events): the
// unified signal spine DIA4's instrumentation reads and DIA3's agent calls share.
// An audit write must never throw on the request path — but it is logged if it fails.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { PrincipalType } from "./identity.ts";

export interface DiaEvent {
  userId: string | null;
  principalType?: PrincipalType; // default 'user'
  capability: string;
  surface: string; // function slug, e.g. "dia-search"
  provider?: string;
  model?: string;
  success?: boolean;
  latencyMs?: number;
  tokens?: number;
  errorCode?: string;
  errorMessage?: string;
  meta?: Record<string, unknown>;
}

export async function writeEvent(admin: SupabaseClient, e: DiaEvent): Promise<void> {
  const { error } = await admin.from("dia_events").insert({
    user_id: e.userId,
    principal_type: e.principalType ?? "user",
    capability: e.capability,
    surface: e.surface,
    provider: e.provider ?? null,
    model: e.model ?? null,
    success: e.success ?? true,
    latency_ms: e.latencyMs ?? null,
    tokens: e.tokens ?? null,
    error_code: e.errorCode ?? null,
    error_message: e.errorMessage ?? null,
    meta: e.meta ?? {},
  });
  if (error) console.error(`dia_events insert: ${error.message}`);
}

// DIA Core — identity. Thin extension of _shared/auth.ts. Principal is
// polymorphic (user | cron | service | agent) so DIA3's agent door lands in the
// same gate without a rewrite. auth.ts already carries non-human principals.
export { requireUser, requireAdmin, requireInternal, escapeHtml, isSafePublicUrl } from "../auth.ts";
export type { AuthResult, AuthOk, AuthErr } from "../auth.ts";

export type PrincipalType = "user" | "cron" | "service" | "agent";

export interface Principal {
  type: PrincipalType;
  userId: string | null; // DNA user id for 'user'; null for pure system callers
  token: string;
}

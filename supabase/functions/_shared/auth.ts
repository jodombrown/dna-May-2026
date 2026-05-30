// Shared auth guards for edge functions.
// Centralizes JWT validation, admin role checks, and cron/service-role gating.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

export type AuthOk = { ok: true; userId: string; token: string };
export type AuthErr = { ok: false; response: Response };
export type AuthResult = AuthOk | AuthErr;

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Content-Type": "application/json",
};

function unauthorized(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: baseHeaders,
  });
}

function forbidden(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: baseHeaders,
  });
}

/** Require a valid user JWT. Returns the user id. */
export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return { ok: false, response: unauthorized() };
  const token = authHeader.slice(7);

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return { ok: false, response: unauthorized() };
  return { ok: true, userId: data.user.id, token };
}

/** Require a valid user JWT AND that the user has the 'admin' role. */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const result = await requireUser(req);
  if (!result.ok) return result;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", result.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) return { ok: false, response: forbidden("Admin access required") };
  return result;
}

/**
 * Require an internal caller: either the service-role key as Bearer token,
 * or a matching CRON_SECRET in the x-cron-secret header. Used to lock down
 * scheduled cron jobs and internal-only endpoints.
 */
export function requireInternal(req: Request): AuthResult {
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (SUPABASE_SERVICE_ROLE_KEY && bearer === SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, userId: "service_role", token: bearer };
  }
  const cron = req.headers.get("x-cron-secret") ?? "";
  if (CRON_SECRET && cron === CRON_SECRET) {
    return { ok: true, userId: "cron", token: cron };
  }
  return { ok: false, response: unauthorized("Internal endpoint: service-role or cron secret required") };
}

/** Simple HTML escape for safe interpolation into email/HTML templates. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate that a URL is https and not pointing at private/internal IP ranges (SSRF guard). */
export function isSafePublicUrl(rawUrl: string, allowedHosts?: string[]): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  // Block obvious internal targets
  const blocked = [
    "localhost",
    "metadata.google.internal",
  ];
  if (blocked.includes(host)) return false;
  // Block IPv4 private/link-local
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  // Block IPv6 loopback/link-local
  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return false;
  }
  if (allowedHosts && allowedHosts.length > 0) {
    return allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
  }
  return true;
}

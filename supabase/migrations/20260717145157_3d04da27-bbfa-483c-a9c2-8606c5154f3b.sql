
-- 1) Restrict PII columns on profiles: revoke SELECT on email/phone/phone_number/whatsapp_number from anon and authenticated (row owner still reads full row via RLS + service_role unaffected). Owners fetch these via existing get_own_profile / RPC paths.
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon, authenticated;

-- 2) Convert public_profiles view to SECURITY INVOKER so RLS applies as caller.
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- 3) Add restrictive/deny-by-default policies on tables that have RLS enabled but no policies (blocks anon+authenticated; service_role bypasses RLS).
-- geocode_cache: internal edge-function cache
CREATE POLICY "geocode_cache_service_only_select" ON public.geocode_cache FOR SELECT TO authenticated USING (false);
-- dia_events: internal analytics
CREATE POLICY "dia_events_service_only_select" ON public.dia_events FOR SELECT TO authenticated USING (false);
-- dia_tier_limits: internal config table
CREATE POLICY "dia_tier_limits_read_all_authed" ON public.dia_tier_limits FOR SELECT TO authenticated USING (true);

-- 4) Ensure the presence:global / typing:% policies do not exist on public.messages (they were flagged; verify absent). No-op if not present.
DROP POLICY IF EXISTS "Realtime read: scoped to topic" ON public.messages;
DROP POLICY IF EXISTS "Realtime write: scoped to topic" ON public.messages;

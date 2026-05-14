
-- 1. Move unaccent extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- 2. Revoke API access on materialized view (keep data; just hide from PostgREST)
REVOKE ALL ON public.pulse_metrics_daily FROM anon, authenticated;

-- 3. Add explicit deny-all policy on roadmap_session_reminder_sends
--    (RLS is enabled with no policies; service_role bypasses RLS so backend
--    cron jobs continue to work. This silences the linter and locks out clients.)
CREATE POLICY "No client access" ON public.roadmap_session_reminder_sends
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Drop and recreate the three broken admin policies to use the canonical user_roles/has_role pattern
-- (mirrors the already-correct policy on public.user_reports)

-- 1. content_flags SELECT
DROP POLICY IF EXISTS "Admins can view all reports" ON public.content_flags;
CREATE POLICY "Admins can view all reports" ON public.content_flags
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. content_flags UPDATE
DROP POLICY IF EXISTS "Admins can update reports" ON public.content_flags;
CREATE POLICY "Admins can update reports" ON public.content_flags
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. analytics_events SELECT
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_events;
CREATE POLICY "Admins can view analytics" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
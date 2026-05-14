
-- 1. Lock down profiles UPDATE so users can't escalate themselves
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = (SELECT auth.uid()))
WITH CHECK (
  id = (SELECT auth.uid())
  AND roles IS NOT DISTINCT FROM (SELECT p.roles FROM public.profiles p WHERE p.id = auth.uid())
  AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
  AND user_type IS NOT DISTINCT FROM (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2. Replace admin-gating policies that read from profiles.roles with has_role()
DROP POLICY IF EXISTS "Admins can view cron logs" ON public.cron_job_logs;
CREATE POLICY "Admins can view cron logs"
ON public.cron_job_logs
FOR SELECT
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view reminder logs" ON public.event_reminder_logs;
CREATE POLICY "Users can view reminder logs"
ON public.event_reminder_logs
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "releases_admin_insert" ON public.releases;
CREATE POLICY "releases_admin_insert"
ON public.releases
FOR INSERT
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "releases_admin_update" ON public.releases;
CREATE POLICY "releases_admin_update"
ON public.releases
FOR UPDATE
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "releases_admin_delete" ON public.releases;
CREATE POLICY "releases_admin_delete"
ON public.releases
FOR DELETE
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP POLICY IF EXISTS "releases_select_policy" ON public.releases;
CREATE POLICY "releases_select_policy"
ON public.releases
FOR SELECT
USING (
  status::text = 'published'::text
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- 3. Tighten space-attachments storage upload policy to require space membership.
-- Convention: object path is "<space_id>/<...>" so first folder = space_id.
DROP POLICY IF EXISTS "Members can upload space attachment files" ON storage.objects;
CREATE POLICY "Members can upload space attachment files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'space-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.space_id::text = (storage.foldername(name))[1]
  )
);


-- 1) Revoke anon EXECUTE on SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.get_or_create_dia_preferences(uuid) FROM anon, public;

-- 2) hashtag_followers: restrict SELECT to the follower
DROP POLICY IF EXISTS "Authenticated view hashtag followers" ON public.hashtag_followers;
CREATE POLICY "Users view their own hashtag follows"
  ON public.hashtag_followers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3) post_analytics: tie inserts to auth.uid()
DROP POLICY IF EXISTS "Authenticated users can log events" ON public.post_analytics;
CREATE POLICY "Users can log their own analytics events"
  ON public.post_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = (SELECT auth.uid()))
    AND (viewer_id IS NULL OR viewer_id = (SELECT auth.uid()))
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- 4) profile_views: tie inserts to auth.uid() (allow NULL viewer for anonymous tracking only when no auth)
DROP POLICY IF EXISTS "profile_views_insert" ON public.profile_views;
CREATE POLICY "profile_views_insert"
  ON public.profile_views FOR INSERT
  TO authenticated
  WITH CHECK (
    viewer_id = (SELECT auth.uid())
    AND profile_id <> (SELECT auth.uid())
  );

BEGIN;

ALTER FUNCTION public.broadcast_activity_event() SET search_path = public;
ALTER FUNCTION public.compute_reasoning_string(p_kind match_kind, p_currency contribution_currency, p_subject_stance_title text, p_subject_need_title text, p_viewer_stance_title text, p_viewer_need_title text, p_shared_tags text[]) SET search_path = public;
ALTER FUNCTION public.dia_prefs_touch() SET search_path = public;
ALTER FUNCTION public.enforce_active_stance_cap() SET search_path = public;
ALTER FUNCTION public.set_attendee_qr_token() SET search_path = public;
ALTER FUNCTION public.set_updated_at_contribute() SET search_path = public;
ALTER FUNCTION public.stamp_archived_at() SET search_path = public;
ALTER FUNCTION public.tag_overlap_count(a text[], b text[]) SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.update_fulfillment_updated_at() SET search_path = public;

DROP POLICY IF EXISTS "Anyone can view advertiser logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view feedback media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story hero images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Event media public read" ON storage.objects;
DROP POLICY IF EXISTS "Organization logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly accessible for posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view post media" ON storage.objects;
DROP POLICY IF EXISTS "read event-images" ON storage.objects;
DROP POLICY IF EXISTS "read profile-images" ON storage.objects;
DROP POLICY IF EXISTS "read profile-pictures" ON storage.objects;
DROP POLICY IF EXISTS "read user-posts" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can submit intake" ON public.ad_intake_submissions;
CREATE POLICY "Public can submit complete intake requests" ON public.ad_intake_submissions FOR INSERT TO anon, authenticated WITH CHECK (
  length(btrim(company_name)) BETWEEN 2 AND 160 AND length(btrim(contact_name)) BETWEEN 2 AND 160 AND contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND coalesce(length(message), 0) <= 3000 AND status = 'new' AND reviewed_by IS NULL AND reviewed_at IS NULL AND internal_notes IS NULL
);

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.beta_waitlist;
CREATE POLICY "Public can join beta waitlist with valid contact" ON public.beta_waitlist FOR INSERT TO anon, authenticated WITH CHECK (
  email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND coalesce(length(full_name), 0) <= 160 AND coalesce(length(message), 0) <= 2000 AND status = 'pending' AND archived_at IS NULL AND archived_by IS NULL
);

DROP POLICY IF EXISTS "Anyone can signup for hub notifications" ON public.hub_notification_signups;
CREATE POLICY "Public can signup for hub notifications with valid contact" ON public.hub_notification_signups FOR INSERT TO anon, authenticated WITH CHECK (
  length(btrim(hub)) BETWEEN 2 AND 80 AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Public can create valid newsletter subscriptions" ON public.newsletter_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (
  email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND coalesce(length(full_name), 0) <= 160 AND is_active = true
);

DROP POLICY IF EXISTS "Anyone can log a corridor comparison" ON public.remittance_corridor_comparisons;
CREATE POLICY "Public can log bounded corridor comparisons" ON public.remittance_corridor_comparisons FOR INSERT TO anon, authenticated WITH CHECK (
  length(btrim(from_country)) BETWEEN 2 AND 80 AND length(btrim(to_country)) BETWEEN 2 AND 80 AND jsonb_typeof(estimates) = 'object' AND octet_length(estimates::text) <= 20000 AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can follow a speaker" ON public.roadmap_speaker_followers;
CREATE POLICY "Public can follow speakers with valid identity" ON public.roadmap_speaker_followers FOR INSERT TO anon, authenticated WITH CHECK (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR (user_id IS NULL AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$')
);

DROP POLICY IF EXISTS "Anyone can submit a sponsor lead" ON public.roadmap_sponsor_leads;
CREATE POLICY "Public can submit valid sponsor leads" ON public.roadmap_sponsor_leads FOR INSERT TO anon, authenticated WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid()) AND length(btrim(name)) BETWEEN 2 AND 160 AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND coalesce(length(message), 0) <= 3000 AND status = 'new' AND notes IS NULL AND updated_by IS NULL
);

DROP POLICY IF EXISTS "Anyone can subscribe to ROADMAP updates" ON public.roadmap_subscribers;
CREATE POLICY "Public can subscribe to ROADMAP updates with valid email" ON public.roadmap_subscribers FOR INSERT TO anon, authenticated WITH CHECK (
  email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND length(btrim(source)) BETWEEN 2 AND 80 AND edition_year BETWEEN 2025 AND 2035
);

DROP POLICY IF EXISTS "anyone insert survey" ON public.roadmap_survey_responses;
CREATE POLICY "Public can submit bounded ROADMAP surveys" ON public.roadmap_survey_responses FOR INSERT TO anon, authenticated WITH CHECK (
  edition_year BETWEEN 2025 AND 2035 AND (user_id IS NULL OR user_id = auth.uid()) AND (email IS NULL OR email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$') AND (nps IS NULL OR nps BETWEEN 0 AND 10) AND coalesce(length(highlight), 0) <= 3000 AND coalesce(length(improvement), 0) <= 3000
);

DROP POLICY IF EXISTS "Anyone can insert waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Public can submit valid waitlist signups" ON public.waitlist_signups FOR INSERT TO anon, authenticated WITH CHECK (
  length(btrim(full_name)) BETWEEN 2 AND 160 AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' AND length(btrim(role)) BETWEEN 2 AND 120 AND coalesce(status, 'approved') = 'approved'
);

DROP POLICY IF EXISTS "System can insert nudges" ON public.adin_nudges;
CREATE POLICY "Service role can insert nudges" ON public.adin_nudges FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS adin_queries_delete_service_role ON public.dia_queries;
CREATE POLICY adin_queries_delete_service_role ON public.dia_queries FOR DELETE TO service_role USING ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS adin_queries_insert_service_role ON public.dia_queries;
CREATE POLICY adin_queries_insert_service_role ON public.dia_queries FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS adin_queries_update_service_role ON public.dia_queries;
CREATE POLICY adin_queries_update_service_role ON public.dia_queries FOR UPDATE TO service_role USING ((auth.jwt() ->> 'role') = 'service_role') WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS adin_query_log_all_service_role ON public.dia_query_log;
CREATE POLICY adin_query_log_all_service_role ON public.dia_query_log FOR ALL TO service_role USING ((auth.jwt() ->> 'role') = 'service_role') WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS adin_user_usage_all_service_role ON public.dia_user_usage;
CREATE POLICY adin_user_usage_all_service_role ON public.dia_user_usage FOR ALL TO service_role USING ((auth.jwt() ->> 'role') = 'service_role') WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert error logs" ON public.error_logs;
CREATE POLICY "Service role can insert error logs" ON public.error_logs FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert analytics" ON public.event_analytics;
CREATE POLICY "Service role can insert analytics" ON public.event_analytics FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert events" ON public.events_log;
CREATE POLICY "Service role can insert events" ON public.events_log FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can create impact logs" ON public.impact_log;
CREATE POLICY "Service role can create impact logs" ON public.impact_log FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert skill analytics" ON public.skill_analytics;
CREATE POLICY "Service role can insert skill analytics" ON public.skill_analytics FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert activity" ON public.space_activity_log;
CREATE POLICY "Service role can insert activity" ON public.space_activity_log FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can insert DNA points" ON public.user_dna_points;
CREATE POLICY "Service role can insert DNA points" ON public.user_dna_points FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can create engagement events" ON public.user_engagement_tracking;
CREATE POLICY "Service role can create engagement events" ON public.user_engagement_tracking FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
DROP POLICY IF EXISTS "System can create recommendations" ON public.user_recommendations;
CREATE POLICY "Service role can create recommendations" ON public.user_recommendations FOR INSERT TO service_role WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.fn);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.fn);
  END LOOP;
END $$;

COMMIT;
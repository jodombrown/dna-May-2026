-- SECTION A — Narrow admin/member policies from PUBLIC to authenticated

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_log AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete waitlist entries" ON public.beta_waitlist;
CREATE POLICY "Admins can delete waitlist entries" ON public.beta_waitlist AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update waitlist entries" ON public.beta_waitlist;
CREATE POLICY "Admins can update waitlist entries" ON public.beta_waitlist AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))
  WITH CHECK (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view waitlist entries" ON public.beta_waitlist;
CREATE POLICY "Users can view waitlist entries" ON public.beta_waitlist AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((( SELECT auth.uid() AS uid) IS NOT NULL) AND (( SELECT auth.email() AS email) IS NOT NULL) AND (email = ( SELECT auth.email() AS email)))));

DROP POLICY IF EXISTS billing_transactions_select_fixed ON public.billing_transactions;
CREATE POLICY billing_transactions_select_fixed ON public.billing_transactions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (organization_id IN ( SELECT organizations.id
   FROM organizations
  WHERE (organizations.owner_user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Authenticated users can create offers if not blocked" ON public.contribution_offers;
CREATE POLICY "Authenticated users can create offers if not blocked" ON public.contribution_offers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (created_by = ( SELECT auth.uid() AS uid)) AND (NOT is_blocked_from_space(( SELECT auth.uid() AS uid), space_id))));

DROP POLICY IF EXISTS "Admins can view cron logs" ON public.cron_job_logs;
CREATE POLICY "Admins can view cron logs" ON public.cron_job_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.dashboard_analytics;
CREATE POLICY "Admins can view all analytics" ON public.dashboard_analytics AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS adin_preferences_select ON public.dia_preferences;
CREATE POLICY adin_preferences_select ON public.dia_preferences AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can view reminder logs" ON public.event_reminder_logs;
CREATE POLICY "Users can view reminder logs" ON public.event_reminder_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can view own events" ON public.events_log;
CREATE POLICY "Users can view own events" ON public.events_log AS PERMISSIVE FOR SELECT TO authenticated
  USING (((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can view feed research" ON public.feed_research_responses;
CREATE POLICY "Users can view feed research" ON public.feed_research_responses AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "View channel memberships" ON public.feedback_channel_memberships;
CREATE POLICY "View channel memberships" ON public.feedback_channel_memberships AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "Members can view feedback messages" ON public.feedback_messages;
CREATE POLICY "Members can view feedback messages" ON public.feedback_messages AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_feedback_admin() OR ((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM feedback_channel_memberships fcm
  WHERE ((fcm.channel_id = feedback_messages.channel_id) AND (fcm.user_id = ( SELECT auth.uid() AS uid)) AND (fcm.status = 'active'::text)))))));

DROP POLICY IF EXISTS group_members_delete_fixed ON public.group_members;
CREATE POLICY group_members_delete_fixed ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_group_creator(group_id, ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS group_members_select_fixed ON public.group_members;
CREATE POLICY group_members_select_fixed ON public.group_members AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_group_creator(group_id, ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS group_members_update_fixed ON public.group_members;
CREATE POLICY group_members_update_fixed ON public.group_members AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_group_creator(group_id, ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS ia_insert_participants ON public.impact_attributions;
CREATE POLICY ia_insert_participants ON public.impact_attributions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_connection_participant(connection_id));

DROP POLICY IF EXISTS ia_select_participants ON public.impact_attributions;
CREATE POLICY ia_select_participants ON public.impact_attributions AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_connection_participant(connection_id));

DROP POLICY IF EXISTS "View impact logs policy" ON public.impact_log;
CREATE POLICY "View impact logs policy" ON public.impact_log AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can create invites" ON public.invites;
CREATE POLICY "Admins can create invites" ON public.invites AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS invites_select ON public.invites;
CREATE POLICY invites_select ON public.invites AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (email = ( SELECT auth.email() AS email)) OR (created_by = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "Creators or space admins can delete opportunities" ON public.opportunities;
CREATE POLICY "Creators or space admins can delete opportunities" ON public.opportunities AS PERMISSIVE FOR DELETE TO authenticated
  USING (((created_by = ( SELECT auth.uid() AS uid)) OR is_member_of_space(space_id, ( SELECT auth.uid() AS uid), ARRAY['owner'::text, 'admin'::text], true)));

DROP POLICY IF EXISTS opportunities_update ON public.opportunities;
CREATE POLICY opportunities_update ON public.opportunities AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((( SELECT auth.uid() AS uid) = created_by) OR ((space_id IS NOT NULL) AND is_member_of_space(space_id, ( SELECT auth.uid() AS uid), ARRAY['owner'::text, 'admin'::text], true))));

DROP POLICY IF EXISTS org_verification_all ON public.organization_verification_requests;
CREATE POLICY org_verification_all ON public.organization_verification_requests AS PERMISSIVE FOR ALL TO authenticated
  USING ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (organization_id IN ( SELECT organizations.id
   FROM organizations
  WHERE (organizations.owner_user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (organization_id IN ( SELECT organizations.id
   FROM organizations
  WHERE (organizations.owner_user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS release_features_admin_delete ON public.release_features;
CREATE POLICY release_features_admin_delete ON public.release_features AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS release_features_admin_insert ON public.release_features;
CREATE POLICY release_features_admin_insert ON public.release_features AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS release_features_admin_update ON public.release_features;
CREATE POLICY release_features_admin_update ON public.release_features AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS releases_admin_delete ON public.releases;
CREATE POLICY releases_admin_delete ON public.releases AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS releases_admin_insert ON public.releases;
CREATE POLICY releases_admin_insert ON public.releases AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS releases_admin_update ON public.releases;
CREATE POLICY releases_admin_update ON public.releases AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_caveats" ON public.remittance_caveats;
CREATE POLICY "Admins manage remittance_caveats" ON public.remittance_caveats AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_channel_players" ON public.remittance_channel_players;
CREATE POLICY "Admins manage remittance_channel_players" ON public.remittance_channel_players AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_channels" ON public.remittance_channels;
CREATE POLICY "Admins manage remittance_channels" ON public.remittance_channels AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_citations" ON public.remittance_citations;
CREATE POLICY "Admins manage remittance_citations" ON public.remittance_citations AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_compare_corridors" ON public.remittance_compare_corridors;
CREATE POLICY "Admins manage remittance_compare_corridors" ON public.remittance_compare_corridors AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete corridor comparisons" ON public.remittance_corridor_comparisons;
CREATE POLICY "Admins can delete corridor comparisons" ON public.remittance_corridor_comparisons AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view corridor comparisons" ON public.remittance_corridor_comparisons;
CREATE POLICY "Admins can view corridor comparisons" ON public.remittance_corridor_comparisons AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_cost_data" ON public.remittance_cost_data;
CREATE POLICY "Admins manage remittance_cost_data" ON public.remittance_cost_data AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_diaspora_bonds" ON public.remittance_diaspora_bonds;
CREATE POLICY "Admins manage remittance_diaspora_bonds" ON public.remittance_diaspora_bonds AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_diaspora_regions" ON public.remittance_diaspora_regions;
CREATE POLICY "Admins manage remittance_diaspora_regions" ON public.remittance_diaspora_regions AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_fatf_status" ON public.remittance_fatf_status;
CREATE POLICY "Admins manage remittance_fatf_status" ON public.remittance_fatf_status AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_forecast" ON public.remittance_forecast;
CREATE POLICY "Admins manage remittance_forecast" ON public.remittance_forecast AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_future_trends" ON public.remittance_future_trends;
CREATE POLICY "Admins manage remittance_future_trends" ON public.remittance_future_trends AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_fx_cases" ON public.remittance_fx_cases;
CREATE POLICY "Admins manage remittance_fx_cases" ON public.remittance_fx_cases AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_gdp_leaders" ON public.remittance_gdp_leaders;
CREATE POLICY "Admins manage remittance_gdp_leaders" ON public.remittance_gdp_leaders AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_macro_flows" ON public.remittance_macro_flows;
CREATE POLICY "Admins manage remittance_macro_flows" ON public.remittance_macro_flows AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_sources" ON public.remittance_sources;
CREATE POLICY "Admins manage remittance_sources" ON public.remittance_sources AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_top_corridors" ON public.remittance_top_corridors;
CREATE POLICY "Admins manage remittance_top_corridors" ON public.remittance_top_corridors AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_top_recipients" ON public.remittance_top_recipients;
CREATE POLICY "Admins manage remittance_top_recipients" ON public.remittance_top_recipients AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage remittance_use_of_funds" ON public.remittance_use_of_funds;
CREATE POLICY "Admins manage remittance_use_of_funds" ON public.remittance_use_of_funds AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admins manage photos" ON public.roadmap_event_photos;
CREATE POLICY "admins manage photos" ON public.roadmap_event_photos AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete speakers" ON public.roadmap_speakers;
CREATE POLICY "Admins can delete speakers" ON public.roadmap_speakers AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert speakers" ON public.roadmap_speakers;
CREATE POLICY "Admins can insert speakers" ON public.roadmap_speakers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can read all speakers" ON public.roadmap_speakers;
CREATE POLICY "Admins can read all speakers" ON public.roadmap_speakers AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update speakers" ON public.roadmap_speakers;
CREATE POLICY "Admins can update speakers" ON public.roadmap_speakers AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "managers update sponsor leads" ON public.roadmap_sponsor_leads;
CREATE POLICY "managers update sponsor leads" ON public.roadmap_sponsor_leads AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM roadmap_sponsor_managers m
  WHERE ((m.sponsor_id = roadmap_sponsor_leads.sponsor_id) AND (m.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can read ROADMAP subscribers" ON public.roadmap_subscribers;
CREATE POLICY "Admins can read ROADMAP subscribers" ON public.roadmap_subscribers AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admins read all surveys" ON public.roadmap_survey_responses;
CREATE POLICY "admins read all surveys" ON public.roadmap_survey_responses AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Activity visible to space members" ON public.space_activity_log;
CREATE POLICY "Activity visible to space members" ON public.space_activity_log AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_member_of_space(space_id, ( SELECT auth.uid() AS uid), ARRAY['owner'::text, 'admin'::text, 'member'::text], true));

DROP POLICY IF EXISTS user_adin_profile_select_own ON public.user_dia_profile;
CREATE POLICY user_adin_profile_select_own ON public.user_dia_profile AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update feedback" ON public.user_feedback;
CREATE POLICY "Admins can update feedback" ON public.user_feedback AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "View user feedback policy" ON public.user_feedback;
CREATE POLICY "View user feedback policy" ON public.user_feedback AS PERMISSIVE FOR SELECT TO authenticated
  USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update reports" ON public.user_reports;
CREATE POLICY "Admins can update reports" ON public.user_reports AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins read all reports" ON public.user_reports;
CREATE POLICY "Admins read all reports" ON public.user_reports AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS user_vectors_select_own_or_admin ON public.user_vectors;
CREATE POLICY user_vectors_select_own_or_admin ON public.user_vectors AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update waitlist status" ON public.waitlist_signups;
CREATE POLICY "Admins can update waitlist status" ON public.waitlist_signups AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- SECTION B — Dual-purpose policies narrowed to authenticated

DROP POLICY IF EXISTS feature_flags_select ON public.feature_flags;
CREATE POLICY feature_flags_select ON public.feature_flags AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (is_enabled = true)));

DROP POLICY IF EXISTS "Anyone can read active citations" ON public.stat_citations;
CREATE POLICY "Anyone can read active citations" ON public.stat_citations AS PERMISSIVE FOR SELECT TO authenticated
  USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS releases_select_policy ON public.releases;
CREATE POLICY releases_select_policy ON public.releases AS PERMISSIVE FOR SELECT TO authenticated
  USING ((((status)::text = 'published'::text) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)));

DROP POLICY IF EXISTS sessions_public_read ON public.roadmap_sessions;
CREATE POLICY sessions_public_read ON public.roadmap_sessions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_published OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS testimonials_public_read ON public.roadmap_testimonials;
CREATE POLICY testimonials_public_read ON public.roadmap_testimonials AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_featured OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS sponsors_public_read ON public.roadmap_sponsors;
CREATE POLICY sponsors_public_read ON public.roadmap_sponsors AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_published OR has_role(auth.uid(), 'admin'::app_role)));


-- SECTION C — Explicit anon read policies

DROP POLICY IF EXISTS feature_flags_anon_select ON public.feature_flags;
CREATE POLICY feature_flags_anon_select ON public.feature_flags AS PERMISSIVE FOR SELECT TO anon
  USING (is_enabled = true);

DROP POLICY IF EXISTS stat_citations_anon_select ON public.stat_citations;
CREATE POLICY stat_citations_anon_select ON public.stat_citations AS PERMISSIVE FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS releases_anon_select ON public.releases;
CREATE POLICY releases_anon_select ON public.releases AS PERMISSIVE FOR SELECT TO anon
  USING ((status)::text = 'published'::text);

DROP POLICY IF EXISTS roadmap_sessions_anon_select ON public.roadmap_sessions;
CREATE POLICY roadmap_sessions_anon_select ON public.roadmap_sessions AS PERMISSIVE FOR SELECT TO anon
  USING (is_published);

DROP POLICY IF EXISTS roadmap_testimonials_anon_select ON public.roadmap_testimonials;
CREATE POLICY roadmap_testimonials_anon_select ON public.roadmap_testimonials AS PERMISSIVE FOR SELECT TO anon
  USING (is_featured);

DROP POLICY IF EXISTS roadmap_sponsors_anon_select ON public.roadmap_sponsors;
CREATE POLICY roadmap_sponsors_anon_select ON public.roadmap_sponsors AS PERMISSIVE FOR SELECT TO anon
  USING (is_published);

DROP POLICY IF EXISTS groups_anon_select ON public.groups;
CREATE POLICY groups_anon_select ON public.groups AS PERMISSIVE FOR SELECT TO anon
  USING (privacy <> 'secret'::group_privacy);


-- SECTION D — Missing grant
GRANT SELECT ON public.roadmap_sponsors TO anon;
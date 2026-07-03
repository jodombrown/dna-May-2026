
DROP POLICY IF EXISTS "View impact logs policy" ON public.impact_log;
CREATE POLICY "View impact logs policy" ON public.impact_log
  FOR SELECT TO public
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "View user feedback policy" ON public.user_feedback;
CREATE POLICY "View user feedback policy" ON public.user_feedback
  FOR SELECT TO public
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update feedback" ON public.user_feedback;
CREATE POLICY "Admins can update feedback" ON public.user_feedback
  FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "adin_preferences_select" ON public.adin_preferences;
CREATE POLICY "adin_preferences_select" ON public.adin_preferences
  FOR SELECT TO public
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update waitlist status" ON public.waitlist_signups;
CREATE POLICY "Admins can update waitlist status" ON public.waitlist_signups
  FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT (moderator_notes, rejection_reason, moderated_by, moderated_at)
  ON public.communities FROM anon, authenticated;

REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon, authenticated;

REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon, authenticated;

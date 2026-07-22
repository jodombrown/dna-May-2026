
-- Fix 1: community_event_attendees - split into per-command policies so INSERT requires user_id = auth.uid()
DROP POLICY IF EXISTS "Community event attendees access policy" ON public.community_event_attendees;

CREATE POLICY "cea_select" ON public.community_event_attendees
FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM community_events ce
    JOIN community_memberships cm ON cm.community_id = ce.community_id
    WHERE ce.id = community_event_attendees.event_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'approved'
  )
);

CREATE POLICY "cea_insert_self" ON public.community_event_attendees
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cea_update_self" ON public.community_event_attendees
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cea_delete_self" ON public.community_event_attendees
FOR DELETE USING (auth.uid() = user_id);

-- Fix 2: event_roles - restrict SELECT to organizer and the role holder only
DROP POLICY IF EXISTS event_roles_select ON public.event_roles;

CREATE POLICY event_roles_select ON public.event_roles
FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_roles.event_id AND e.organizer_id = auth.uid()
  )
);

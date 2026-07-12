-- Migration B — flip enforcement onto (status, visibility).
-- No columns are dropped here; this migration only moves enforcement.
-- (The orphan update-event edge function is removed from the repo in the same
-- change and must be retired from the deployed project separately.)

-- 1. events SELECT: draft-safe. Organizer always. Published+public for everyone.
--    Authenticated-community branch per the Spaces precedent. Group branch kept.
DROP POLICY IF EXISTS "Users can view accessible events" ON public.events;
CREATE POLICY "Users can view accessible events" ON public.events
FOR SELECT USING (
  organizer_id = (SELECT auth.uid())
  OR (status = 'published' AND visibility = 'public')
  OR (status = 'published' AND visibility = 'community'
      AND (SELECT auth.uid()) IS NOT NULL)
  OR (group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = events.group_id
          AND gm.user_id = (SELECT auth.uid())
          AND gm.is_banned = false))
);

-- 2. The three child policies inherit the same gate.
DROP POLICY IF EXISTS "Users can view accessible event attendees" ON public.event_attendees;
CREATE POLICY "Users can view accessible event attendees" ON public.event_attendees
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = event_attendees.event_id
    AND (e.organizer_id = (SELECT auth.uid())
         OR (e.status = 'published' AND e.visibility IN ('public','community')))
));

DROP POLICY IF EXISTS "Users can view comments on visible events" ON public.event_comments;
CREATE POLICY "Users can view comments on visible events" ON public.event_comments
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = event_comments.event_id
    AND (e.organizer_id = (SELECT auth.uid())
         OR (e.status = 'published' AND e.visibility IN ('public','community'))
         OR EXISTS (SELECT 1 FROM public.event_attendees ea
                    WHERE ea.event_id = e.id AND ea.user_id = (SELECT auth.uid())))
));

-- event_roles already gated on visibility; add the status half it was missing.
DROP POLICY IF EXISTS event_roles_select ON public.event_roles;
CREATE POLICY event_roles_select ON public.event_roles
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = event_roles.event_id
    AND (e.organizer_id = (SELECT auth.uid())
         OR (e.status = 'published' AND e.visibility = 'public'))
));

-- 3. The feed trigger fires on the PUBLISH TRANSITION, not on every insert.
--    Posts INSERT body preserved verbatim; only the guard changes.
--    OLD is unassigned in plpgsql INSERT triggers, so the was-published check
--    is hoisted into a variable instead of relying on short-circuit evaluation.
CREATE OR REPLACE FUNCTION public.create_event_feed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_was_published boolean := false;
BEGIN
  -- Skip curated events — they surface via DIA cards, not the social feed
  IF NEW.is_curated = true THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_was_published := (OLD.status = 'published');
  END IF;

  -- Only create a feed post on the transition into published, public events only
  IF NEW.status = 'published' AND NEW.visibility = 'public' AND NOT v_was_published THEN
    INSERT INTO public.posts (
      author_id,
      post_type,
      content,
      linked_entity_type,
      linked_entity_id,
      event_id,
      image_url,
      privacy_level
    ) VALUES (
      NEW.organizer_id,
      'event',
      'Created an event: ' || NEW.title,
      'event',
      NEW.id,
      NEW.id,
      NEW.cover_image_url,
      'public'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_create_event_feed_post ON public.events;
CREATE TRIGGER trg_create_event_feed_post
AFTER INSERT OR UPDATE OF status ON public.events
FOR EACH ROW EXECUTE FUNCTION public.create_event_feed_post();

-- 4. get_events: WHERE clause only — legacy boolean gates replaced with
--    (status, visibility). Return shape unchanged.
CREATE OR REPLACE FUNCTION public.get_events(p_user_id uuid, p_filter text DEFAULT 'upcoming'::text, p_event_type event_type DEFAULT NULL::event_type, p_format event_format DEFAULT NULL::event_format, p_city text DEFAULT NULL::text, p_country text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(event_id uuid, organizer_id uuid, organizer_username text, organizer_full_name text, organizer_avatar_url text, title text, description text, event_type event_type, format event_format, location_name text, location_city text, location_country text, meeting_url text, start_time timestamp with time zone, end_time timestamp with time zone, timezone text, max_attendees integer, cover_image_url text, is_public boolean, requires_approval boolean, created_at timestamp with time zone, attendee_count bigint, user_rsvp_status rsvp_status, is_organizer boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.organizer_id,
    p.username as organizer_username,
    p.full_name as organizer_full_name,
    p.avatar_url as organizer_avatar_url,
    e.title,
    e.description,
    e.event_type,
    e.format,
    e.location_name,
    e.location_city,
    e.location_country,
    e.meeting_url,
    e.start_time,
    e.end_time,
    e.timezone,
    e.max_attendees,
    e.cover_image_url,
    e.is_public,
    e.requires_approval,
    e.created_at,
    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status IN ('going', 'maybe')) as attendee_count,
    (SELECT status FROM event_attendees WHERE event_id = e.id AND user_id = p_user_id) as user_rsvp_status,
    (e.organizer_id = p_user_id) as is_organizer
  FROM events e
  INNER JOIN profiles p ON e.organizer_id = p.id
  WHERE e.status <> 'cancelled'
    AND (
      (p_filter = 'upcoming' AND e.start_time > now() AND e.status = 'published'
        AND (e.visibility = 'public'
             OR (e.visibility = 'community' AND p_user_id IS NOT NULL))) OR
      (p_filter = 'past' AND e.end_time < now() AND e.status = 'published'
        AND (e.visibility = 'public'
             OR (e.visibility = 'community' AND p_user_id IS NOT NULL))) OR
      (p_filter = 'my_events' AND e.organizer_id = p_user_id) OR
      (p_filter = 'attending' AND EXISTS (
        SELECT 1 FROM event_attendees
        WHERE event_id = e.id
          AND user_id = p_user_id
          AND status IN ('going', 'maybe')
      ))
    )
    AND (p_event_type IS NULL OR e.event_type = p_event_type)
    AND (p_format IS NULL OR e.format = p_format)
    AND (p_city IS NULL OR e.location_city ILIKE '%' || p_city || '%')
    AND (p_country IS NULL OR e.location_country ILIKE '%' || p_country || '%')
  ORDER BY e.start_time ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 5. get_event_details: WHERE clause only — is_public gate replaced with
--    (status, visibility), mirroring the events SELECT policy. Organizer and
--    attendee branches kept. Return shape unchanged.
CREATE OR REPLACE FUNCTION public.get_event_details(p_event_id uuid, p_user_id uuid)
RETURNS TABLE(event_id uuid, organizer_id uuid, organizer_username text, organizer_full_name text, organizer_avatar_url text, organizer_headline text, title text, description text, event_type text, format text, location_name text, location_address text, location_city text, location_country text, location_lat numeric, location_lng numeric, meeting_url text, meeting_platform text, start_time timestamp with time zone, end_time timestamp with time zone, timezone text, max_attendees integer, cover_image_url text, is_public boolean, requires_approval boolean, allow_guests boolean, is_cancelled boolean, cancellation_reason text, created_at timestamp with time zone, updated_at timestamp with time zone, attendee_count bigint, going_count bigint, maybe_count bigint, user_rsvp_status text, is_organizer boolean, can_edit boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    e.organizer_id,
    p.username as organizer_username,
    p.full_name as organizer_full_name,
    p.avatar_url as organizer_avatar_url,
    p.headline as organizer_headline,
    e.title,
    e.description,
    e.event_type::TEXT,
    e.format::TEXT,
    e.location_name,
    e.location_address,
    e.location_city,
    e.location_country,
    e.location_lat,
    e.location_lng,
    e.meeting_url,
    e.meeting_platform,
    e.start_time,
    e.end_time,
    e.timezone,
    e.max_attendees,
    e.cover_image_url,
    e.is_public,
    e.requires_approval,
    e.allow_guests,
    e.is_cancelled,
    e.cancellation_reason,
    e.created_at,
    e.updated_at,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status IN ('going', 'maybe')) as attendee_count,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'going') as going_count,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.status = 'maybe') as maybe_count,
    (SELECT ea.status::TEXT FROM event_attendees ea WHERE ea.event_id = e.id AND ea.user_id = p_user_id LIMIT 1) as user_rsvp_status,
    (e.organizer_id = p_user_id) as is_organizer,
    (e.organizer_id = p_user_id) as can_edit
  FROM events e
  INNER JOIN profiles p ON e.organizer_id = p.id
  WHERE e.id = p_event_id
    AND (
      (e.status = 'published' AND e.visibility = 'public') OR
      (e.status = 'published' AND e.visibility = 'community' AND p_user_id IS NOT NULL) OR
      e.organizer_id = p_user_id OR
      EXISTS (
        SELECT 1 FROM event_attendees ea2
        WHERE ea2.event_id = e.id AND ea2.user_id = p_user_id
      )
    );
END;
$function$;

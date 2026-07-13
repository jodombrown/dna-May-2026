CREATE OR REPLACE FUNCTION public.get_public_event(p_slug_or_id text)
RETURNS TABLE (
  id                   uuid,
  slug                 text,
  title                text,
  subtitle             text,
  short_description    text,
  description          text,
  event_type           text,
  format               text,
  start_time           timestamptz,
  end_time             timestamptz,
  timezone             text,
  location_name        text,
  location_city        text,
  location_country     text,
  location_lat         numeric,
  location_lng         numeric,
  cover_image_url      text,
  tags                 text[],
  requires_approval    boolean,
  is_cancelled         boolean,
  cancellation_reason  text,
  is_curated           boolean,
  curated_source       text,
  curated_source_url   text,
  organizer_name       text,
  organizer_username   text,
  organizer_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    e.slug::text,
    e.title,
    e.subtitle,
    e.short_description,
    e.description,
    e.event_type::text,
    e.format::text,
    e.start_time,
    e.end_time,
    e.timezone,
    e.location_name,
    e.location_city,
    e.location_country,
    e.location_lat,
    e.location_lng,
    e.cover_image_url,
    e.tags,
    e.requires_approval,
    e.is_cancelled,
    e.cancellation_reason,
    COALESCE(e.is_curated, false),
    e.curated_source,
    e.curated_source_url,
    COALESCE(p.display_name, p.full_name)              AS organizer_name,
    p.username                                          AS organizer_username,
    COALESCE(p.profile_picture_url, p.avatar_url)       AS organizer_avatar_url
  FROM public.events e
  LEFT JOIN public.profiles p ON p.id = e.organizer_id
  WHERE
    (
      e.slug = p_slug_or_id
      OR (
        p_slug_or_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND e.id = p_slug_or_id::uuid
      )
    )
    AND e.status = 'published'
    AND e.visibility = 'public'
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_public_event(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_event(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_event(text) TO authenticated;

COMMENT ON FUNCTION public.get_public_event(text) IS
  'Public read projection for a single event. The signed-out view: what a stranger sees when a shared link arrives. Guard (status=published AND visibility=public) is enforced inside the function because SECURITY DEFINER bypasses RLS. meeting_url, attendee lists, agenda, and speakers are deliberately excluded - those sit behind the Membership door. Return shape is explicit by design: what is not listed cannot leak.';
-- ============================================================
-- Convene C2.1 · BD106 / BD111 / BD112
-- Back-fills the migration record for schema applied via the
-- SQL Editor lane. Idempotent: the schema is ALREADY live.
-- ============================================================

-- BD106 · The (status, visibility) mirror is true BY CONSTRUCTION.
CREATE OR REPLACE FUNCTION public.sync_event_state_mirror()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- TRANSITIONAL (BD090). The legacy booleans mirror the canonical
  -- (status, visibility) columns and are scheduled for DROP in Migration C.
  NEW.is_published := (NEW.status = 'published');
  NEW.is_cancelled := (NEW.status = 'cancelled');
  NEW.is_public    := (NEW.visibility = 'public');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_event_state_mirror ON public.events;
CREATE TRIGGER trg_sync_event_state_mirror
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_state_mirror();

ALTER TABLE public.events ALTER COLUMN is_published SET DEFAULT false;

-- BD111 · The model must be able to say "we do not know the clock time".
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS time_confirmed boolean NOT NULL DEFAULT true;

-- BD112 · The model must be able to say "the organiser has announced nothing".
ALTER TABLE public.events ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN end_time   DROP NOT NULL;
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS date_confirmed boolean NOT NULL DEFAULT true;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS chk_event_date_knowledge;
ALTER TABLE public.events ADD CONSTRAINT chk_event_date_knowledge CHECK (
  (date_confirmed = (start_time IS NOT NULL))
  AND (NOT (time_confirmed AND (NOT date_confirmed)))
);

-- BD106/111/112 · Public projection. Return-shape change ⇒ DROP + CREATE.
DROP FUNCTION IF EXISTS public.get_public_event(text);

CREATE FUNCTION public.get_public_event(p_slug_or_id text)
RETURNS TABLE(
  id uuid, slug text, title text, subtitle text, short_description text,
  description text, event_type text, format text,
  start_time timestamptz, end_time timestamptz, timezone text,
  date_confirmed boolean, time_confirmed boolean,
  location_name text, location_address text, location_city text,
  location_state text, location_country text, location_country_code text,
  location_lat numeric, location_lng numeric,
  cover_image_url text, tags text[], speakers jsonb,
  requires_approval boolean, max_attendees integer, going_count bigint,
  status text, visibility text, cancellation_reason text,
  is_curated boolean, curated_source_url text,
  organizer_name text, organizer_username text, organizer_avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    e.id, e.slug::text, e.title, e.subtitle, e.short_description, e.description,
    e.event_type::text, e.format::text,
    e.start_time, e.end_time, e.timezone,
    e.date_confirmed, e.time_confirmed,
    e.location_name, e.location_address, e.location_city, e.location_state,
    e.location_country, e.location_country_code::text, e.location_lat, e.location_lng,
    e.cover_image_url, e.tags, COALESCE(e.speakers, '[]'::jsonb),
    e.requires_approval, e.max_attendees,
    (SELECT count(*) FROM public.event_attendees a
      WHERE a.event_id = e.id AND a.status = 'going'),
    e.status::text, e.visibility::text, e.cancellation_reason,
    COALESCE(e.is_curated, false), e.curated_source_url,
    COALESCE(p.display_name, p.full_name),
    p.username,
    COALESCE(p.profile_picture_url, p.avatar_url)
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
    AND e.status IN ('published', 'cancelled', 'completed')
    AND e.visibility = 'public'
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_public_event(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_event(text) TO anon, authenticated;
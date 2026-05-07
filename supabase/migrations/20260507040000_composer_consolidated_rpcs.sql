-- =====================================================================
-- Composer Unification — Consolidated Create RPCs
-- =====================================================================
-- Single canonical entry point per Five-C entity for the universal
-- composer (and any future caller). Each RPC:
--
--   * Inserts the entity under SECURITY DEFINER with an explicit
--     auth.uid() author check.
--   * Relies on the existing AFTER INSERT triggers
--     (trg_event_create_thread / trg_space_create_channel /
--     trg_opportunity_create_thread, defined in
--     20260220050734_*.sql) to materialise the linked
--     conversation in conversations_new.
--   * Reads the linked conversation id back inside the same
--     transaction and returns it alongside the entity id so the
--     caller can navigate to the thread/channel after creation.
--
-- All three RPCs return JSONB of shape:
--   { "entity_id": <uuid>, "linked_thread_id": <uuid> }
-- (For spaces the second key is "linked_channel_id".)
--
-- The function bodies execute in a single implicit transaction; if
-- any step fails, the entity insert is rolled back automatically by
-- PostgreSQL.
--
-- RLS: All three RPCs assert auth.uid() and set created_by /
-- organizer_id to it before insert, satisfying the existing INSERT
-- policies on events / spaces / opportunities (which all require
-- the auth user to own the row).
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. create_event_with_thread
-- =====================================================================
-- Wraps the events insert and surfaces the auto-created discussion
-- thread id. Mirrors the validation in supabase/functions/create-event
-- but runs server-side so non-edge callers get the same guarantees.

CREATE OR REPLACE FUNCTION public.create_event_with_thread(
  p_title           TEXT,
  p_description     TEXT,
  p_event_type      TEXT,
  p_format          TEXT,
  p_start_time      TIMESTAMPTZ,
  p_end_time        TIMESTAMPTZ,
  p_timezone        TEXT     DEFAULT 'UTC',
  p_location_name   TEXT     DEFAULT NULL,
  p_location_address TEXT    DEFAULT NULL,
  p_location_city   TEXT     DEFAULT NULL,
  p_location_country TEXT    DEFAULT NULL,
  p_meeting_url     TEXT     DEFAULT NULL,
  p_meeting_platform TEXT    DEFAULT NULL,
  p_max_attendees   INT      DEFAULT NULL,
  p_is_public       BOOLEAN  DEFAULT TRUE,
  p_requires_approval BOOLEAN DEFAULT FALSE,
  p_allow_guests    BOOLEAN  DEFAULT TRUE,
  p_cover_image_url TEXT     DEFAULT NULL,
  p_subtitle        TEXT     DEFAULT NULL,
  p_agenda          JSONB    DEFAULT '[]'::jsonb,
  p_dress_code      TEXT     DEFAULT NULL,
  p_tags            TEXT[]   DEFAULT '{}'::text[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_event_id  UUID;
  v_thread_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_title IS NULL OR length(p_title) < 10 OR length(p_title) > 200 THEN
    RAISE EXCEPTION 'Title must be between 10 and 200 characters'
      USING ERRCODE = '22023';
  END IF;

  IF p_description IS NULL OR length(p_description) < 50 THEN
    RAISE EXCEPTION 'Description must be at least 50 characters'
      USING ERRCODE = '22023';
  END IF;

  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'End time must be after start time'
      USING ERRCODE = '22023';
  END IF;

  IF p_start_time <= now() THEN
    RAISE EXCEPTION 'Event start time must be in the future'
      USING ERRCODE = '22023';
  END IF;

  IF p_format = 'in_person' OR p_format = 'hybrid' THEN
    IF p_location_name IS NULL THEN
      RAISE EXCEPTION 'In-person/hybrid events require a location'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_format = 'virtual' OR p_format = 'hybrid' THEN
    IF p_meeting_url IS NULL THEN
      RAISE EXCEPTION 'Virtual/hybrid events require a meeting URL'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.events (
    organizer_id, title, description, event_type, format,
    location_name, location_address, location_city, location_country,
    meeting_url, meeting_platform,
    start_time, end_time, timezone,
    max_attendees, cover_image_url,
    is_public, requires_approval, allow_guests,
    is_cancelled,
    subtitle, agenda, dress_code, tags
  ) VALUES (
    v_uid, p_title, p_description, p_event_type::event_type, p_format::event_format,
    p_location_name, p_location_address, p_location_city, p_location_country,
    p_meeting_url, p_meeting_platform,
    p_start_time, p_end_time, p_timezone,
    p_max_attendees, p_cover_image_url,
    p_is_public, p_requires_approval, p_allow_guests,
    FALSE,
    p_subtitle, p_agenda, p_dress_code, p_tags
  )
  RETURNING id INTO v_event_id;

  -- The AFTER INSERT trigger trg_event_create_thread will have fired
  -- by the time this SELECT runs; if it failed (the trigger swallows
  -- exceptions) v_thread_id will be NULL and we fall back to creating
  -- the thread explicitly.
  SELECT id INTO v_thread_id
  FROM public.conversations_new
  WHERE origin_type = 'event' AND origin_id = v_event_id
  LIMIT 1;

  IF v_thread_id IS NULL THEN
    v_thread_id := public.create_event_messaging_thread(
      v_event_id,
      p_title || ' — Discussion'
    );
  END IF;

  RETURN jsonb_build_object(
    'entity_id', v_event_id,
    'linked_thread_id', v_thread_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_event_with_thread(
  TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  INT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, JSONB, TEXT, TEXT[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_event_with_thread(
  TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  INT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, JSONB, TEXT, TEXT[]
) TO authenticated;

COMMENT ON FUNCTION public.create_event_with_thread IS
  'Composer unification: inserts an event and returns {entity_id, linked_thread_id}. Auto-thread is materialised by trg_event_create_thread; falls back to create_event_messaging_thread if the trigger was skipped.';

-- =====================================================================
-- 2. create_space_with_channel
-- =====================================================================
-- Inserts a Space and surfaces the general channel id. Also adds the
-- creator to space_members so the trg_space_member_join_channel
-- trigger inducts them into the new channel.

CREATE OR REPLACE FUNCTION public.create_space_with_channel(
  p_name             TEXT,
  p_slug             TEXT,
  p_space_type       TEXT,
  p_description      TEXT     DEFAULT NULL,
  p_tagline          TEXT     DEFAULT NULL,
  p_visibility       TEXT     DEFAULT 'community',
  p_status           TEXT     DEFAULT 'active',
  p_focus_areas      TEXT[]   DEFAULT '{}'::text[],
  p_region           TEXT     DEFAULT NULL,
  p_origin_event_id  UUID     DEFAULT NULL,
  p_origin_group_id  UUID     DEFAULT NULL,
  p_cover_image_url  TEXT     DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_space_id   UUID;
  v_channel_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Space name is required' USING ERRCODE = '22023';
  END IF;

  IF p_slug IS NULL OR length(btrim(p_slug)) = 0 THEN
    RAISE EXCEPTION 'Space slug is required' USING ERRCODE = '22023';
  END IF;

  IF p_space_type NOT IN ('project', 'working_group', 'initiative', 'program') THEN
    RAISE EXCEPTION 'Invalid space_type: %', p_space_type
      USING ERRCODE = '22023';
  END IF;

  IF p_visibility NOT IN ('public', 'community', 'private', 'stealth') THEN
    RAISE EXCEPTION 'Invalid visibility: %', p_visibility
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.spaces (
    name, slug, tagline, description, space_type,
    status, visibility, focus_areas, region,
    created_by, origin_event_id, origin_group_id, cover_image_url
  ) VALUES (
    p_name, p_slug, p_tagline, p_description, p_space_type,
    p_status, p_visibility, p_focus_areas, p_region,
    v_uid, p_origin_event_id, p_origin_group_id, p_cover_image_url
  )
  RETURNING id INTO v_space_id;

  -- Make creator an explicit lead member (also fires
  -- trg_space_member_join_channel which adds them to the channel
  -- once it exists).
  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (v_space_id, v_uid, 'lead')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  -- Auto-channel from trg_space_create_channel (best-effort);
  -- otherwise create explicitly.
  SELECT id INTO v_channel_id
  FROM public.conversations_new
  WHERE origin_type = 'space' AND origin_id = v_space_id
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    v_channel_id := public.create_space_messaging_channel(
      v_space_id,
      p_name || ' — Channel'
    );
  END IF;

  RETURN jsonb_build_object(
    'entity_id', v_space_id,
    'linked_channel_id', v_channel_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_space_with_channel(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT[], TEXT, UUID, UUID, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_space_with_channel(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT[], TEXT, UUID, UUID, TEXT
) TO authenticated;

COMMENT ON FUNCTION public.create_space_with_channel IS
  'Composer unification: inserts a Space, adds creator as lead member, returns {entity_id, linked_channel_id}. General channel is materialised by trg_space_create_channel; falls back to create_space_messaging_channel.';

-- =====================================================================
-- 3. create_opportunity_with_thread
-- =====================================================================
-- Inserts an Opportunity and surfaces the discussion thread id.

CREATE OR REPLACE FUNCTION public.create_opportunity_with_thread(
  p_title              TEXT,
  p_description        TEXT,
  p_direction          TEXT,
  p_category           TEXT,
  p_compensation_type  TEXT,
  p_location_relevance TEXT,
  p_compensation_details JSONB DEFAULT '{}'::jsonb,
  p_specific_region    TEXT     DEFAULT NULL,
  p_specific_country   TEXT     DEFAULT NULL,
  p_duration           TEXT     DEFAULT NULL,
  p_deadline           TIMESTAMPTZ DEFAULT NULL,
  p_requirements       TEXT     DEFAULT NULL,
  p_related_space_id   UUID     DEFAULT NULL,
  p_budget_range       JSONB    DEFAULT NULL,
  p_tags               TEXT[]   DEFAULT '{}'::text[],
  p_audience           TEXT     DEFAULT 'public',
  p_media              JSONB    DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid           UUID := auth.uid();
  v_opportunity_id UUID;
  v_thread_id     UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_title IS NULL OR length(btrim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Opportunity title is required' USING ERRCODE = '22023';
  END IF;

  IF p_description IS NULL OR length(btrim(p_description)) = 0 THEN
    RAISE EXCEPTION 'Opportunity description is required' USING ERRCODE = '22023';
  END IF;

  IF p_direction NOT IN ('need', 'offer') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.opportunities (
    created_by, title, description, direction, category,
    compensation_type, compensation_details, location_relevance,
    specific_region, specific_country, duration, deadline,
    requirements, related_space_id, budget_range,
    tags, audience, media, status
  ) VALUES (
    v_uid, p_title, p_description, p_direction, p_category,
    p_compensation_type, p_compensation_details, p_location_relevance,
    p_specific_region, p_specific_country, p_duration, p_deadline,
    p_requirements, p_related_space_id, p_budget_range,
    p_tags, p_audience, p_media, 'active'
  )
  RETURNING id INTO v_opportunity_id;

  -- trg_opportunity_create_thread fires on AFTER INSERT.
  SELECT id INTO v_thread_id
  FROM public.conversations_new
  WHERE origin_type = 'opportunity' AND origin_id = v_opportunity_id
  LIMIT 1;

  IF v_thread_id IS NULL THEN
    v_thread_id := public.create_opportunity_messaging_thread(
      v_opportunity_id,
      p_title || ' — Thread'
    );
  END IF;

  RETURN jsonb_build_object(
    'entity_id', v_opportunity_id,
    'linked_thread_id', v_thread_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_opportunity_with_thread(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB,
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID, JSONB,
  TEXT[], TEXT, JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_opportunity_with_thread(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB,
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, UUID, JSONB,
  TEXT[], TEXT, JSONB
) TO authenticated;

COMMENT ON FUNCTION public.create_opportunity_with_thread IS
  'Composer unification: inserts an Opportunity and returns {entity_id, linked_thread_id}. Discussion thread is materialised by trg_opportunity_create_thread; falls back to create_opportunity_messaging_thread.';

COMMIT;

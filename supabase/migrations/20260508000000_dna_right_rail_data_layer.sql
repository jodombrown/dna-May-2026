-- ============================================================
-- DNA Right Rail Redesign — Data Layer
-- ============================================================
-- Migration provides the database foundation for the four
-- redesigned right-rail components:
--   1. Five C's Pulse Compass
--   2. DIA Daily Brief
--   3. Trending in DNA (densified)
--   4. Ask DIA persistent CTA
--
-- Schema notes (departures from the PRD where the real DB
-- diverges from PRD assumptions):
--   * `activity_events` does not yet exist in this repo (the
--     PRD references a Sprint 4B event bus that has not been
--     merged). It is created here defensively with IF NOT
--     EXISTS so downstream Pulse RPCs and triggers compile.
--   * `connections` uses `requester_id` / `recipient_id`, not
--     `user_id`. Edge function adapts.
--   * `profiles` uses `professional_sectors` and `interests`;
--     `geography_tags` and `expertise_tags` are not present, so
--     the brief generator falls back to existing columns.
--   * `posts` has `visibility = 'public'`, not `is_published`.
--   * `opportunities` uses `tags` (TEXT[]) and statuses
--     ('active','closed','fulfilled','expired'), not
--     `sector_tags` / 'open'.
--   * `spaces` uses `focus_areas` and `status='active'`, not
--     `tags` / `is_active`. Member counts are derived from
--     `space_members`.
-- ============================================================

-- ============================================================
-- 1. activity_events (defensive create)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created
  ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type
  ON public.activity_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_created
  ON public.activity_events(user_id, created_at DESC, event_type);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_events'
      AND policyname = 'Users read their own activity'
  ) THEN
    CREATE POLICY "Users read their own activity"
      ON public.activity_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_events'
      AND policyname = 'Users insert their own activity'
  ) THEN
    CREATE POLICY "Users insert their own activity"
      ON public.activity_events FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_events'
      AND policyname = 'Service role manages activity'
  ) THEN
    CREATE POLICY "Service role manages activity"
      ON public.activity_events FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 2. dia_brief_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dia_brief_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
  c_module TEXT NOT NULL CHECK (c_module IN ('connect','convene','collaborate','contribute','convey')),
  signal_type TEXT NOT NULL,
  signal_strength NUMERIC(4,3) NOT NULL CHECK (signal_strength BETWEEN 0 AND 1),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  cta_route TEXT NOT NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  reasoning TEXT NOT NULL,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_user_brief_position UNIQUE (user_id, brief_date, position)
);

CREATE INDEX IF NOT EXISTS idx_dia_brief_cards_user_date
  ON public.dia_brief_cards(user_id, brief_date DESC);
CREATE INDEX IF NOT EXISTS idx_dia_brief_cards_active
  ON public.dia_brief_cards(user_id, expires_at)
  WHERE expires_at > now();

ALTER TABLE public.dia_brief_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_cards'
      AND policyname='Users read their own brief cards'
  ) THEN
    CREATE POLICY "Users read their own brief cards"
      ON public.dia_brief_cards FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_cards'
      AND policyname='Service role writes brief cards'
  ) THEN
    CREATE POLICY "Service role writes brief cards"
      ON public.dia_brief_cards FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_cards'
      AND policyname='Service role updates brief cards'
  ) THEN
    CREATE POLICY "Service role updates brief cards"
      ON public.dia_brief_cards FOR UPDATE
      USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_cards'
      AND policyname='Service role deletes brief cards'
  ) THEN
    CREATE POLICY "Service role deletes brief cards"
      ON public.dia_brief_cards FOR DELETE
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================
-- 3. dia_brief_interactions
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_interaction_type') THEN
    CREATE TYPE brief_interaction_type AS ENUM (
      'viewed',
      'clicked',
      'dismissed',
      'not_interested',
      'saved',
      'why_this_opened'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dia_brief_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.dia_brief_cards(id) ON DELETE CASCADE,
  interaction_type brief_interaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brief_interactions_user_card
  ON public.dia_brief_interactions(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_brief_interactions_type
  ON public.dia_brief_interactions(user_id, interaction_type, created_at DESC);

ALTER TABLE public.dia_brief_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_interactions'
      AND policyname='Users read their own interactions'
  ) THEN
    CREATE POLICY "Users read their own interactions"
      ON public.dia_brief_interactions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dia_brief_interactions'
      AND policyname='Users record their own interactions'
  ) THEN
    CREATE POLICY "Users record their own interactions"
      ON public.dia_brief_interactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 4. trend_follows
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trend_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_hashtag UNIQUE (user_id, hashtag)
);

CREATE INDEX IF NOT EXISTS idx_trend_follows_user ON public.trend_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_follows_hashtag ON public.trend_follows(hashtag);

ALTER TABLE public.trend_follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='trend_follows'
      AND policyname='Users read their own follows'
  ) THEN
    CREATE POLICY "Users read their own follows"
      ON public.trend_follows FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='trend_follows'
      AND policyname='Users create their own follows'
  ) THEN
    CREATE POLICY "Users create their own follows"
      ON public.trend_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='trend_follows'
      AND policyname='Users delete their own follows'
  ) THEN
    CREATE POLICY "Users delete their own follows"
      ON public.trend_follows FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 5. Materialized view: pulse_metrics_daily
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS public.pulse_metrics_daily;

CREATE MATERIALIZED VIEW public.pulse_metrics_daily AS
SELECT
  date_trunc('hour', created_at) AS hour_bucket,
  CASE
    WHEN event_type IN ('connection_request','connection_accepted','profile_updated','profile_view') THEN 'connect'
    WHEN event_type IN ('event_created','event_rsvp','event_published') THEN 'convene'
    WHEN event_type IN ('space_created','space_joined','space_message','task_completed') THEN 'collaborate'
    WHEN event_type IN ('opportunity_created','opportunity_application','opportunity_thread_message') THEN 'contribute'
    WHEN event_type IN ('post_created','comment_created','reaction_created','story_created') THEN 'convey'
    ELSE 'other'
  END AS c_module,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.activity_events
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY hour_bucket, c_module;

CREATE UNIQUE INDEX idx_pulse_metrics_unique
  ON public.pulse_metrics_daily(hour_bucket, c_module);
CREATE INDEX idx_pulse_metrics_recent
  ON public.pulse_metrics_daily(hour_bucket DESC, c_module);

-- Schedule 5-minute refresh via pg_cron (only when extension exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-pulse-metrics') THEN
      PERFORM cron.unschedule('refresh-pulse-metrics');
    END IF;
    PERFORM cron.schedule(
      'refresh-pulse-metrics',
      '*/5 * * * *',
      $cron$REFRESH MATERIALIZED VIEW CONCURRENTLY public.pulse_metrics_daily$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available in this environment; manual refresh required.
  NULL;
END $$;

-- ============================================================
-- 6. RPC: get_five_cs_pulse
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_five_cs_pulse(
  p_time_range TEXT DEFAULT '24h',
  p_scope TEXT DEFAULT 'platform',
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  c_module TEXT,
  event_count BIGINT,
  unique_users BIGINT,
  delta_vs_prior_period BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTERVAL;
  v_now TIMESTAMPTZ := now();
  v_user_id UUID;
BEGIN
  v_interval := CASE p_time_range
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  IF p_scope = 'user' THEN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User scope requires authenticated user or p_user_id';
    END IF;

    RETURN QUERY
    WITH event_to_c AS (
      SELECT
        ae.user_id,
        ae.created_at,
        CASE
          WHEN ae.event_type IN ('connection_request','connection_accepted','profile_updated','profile_view') THEN 'connect'
          WHEN ae.event_type IN ('event_created','event_rsvp','event_published') THEN 'convene'
          WHEN ae.event_type IN ('space_created','space_joined','space_message','task_completed') THEN 'collaborate'
          WHEN ae.event_type IN ('opportunity_created','opportunity_application','opportunity_thread_message') THEN 'contribute'
          WHEN ae.event_type IN ('post_created','comment_created','reaction_created','story_created') THEN 'convey'
          ELSE 'other'
        END AS c_mod
      FROM public.activity_events ae
      WHERE ae.user_id = v_user_id
        AND ae.created_at > v_now - (v_interval * 2)
    ),
    current_period AS (
      SELECT etc.c_mod, COUNT(*)::BIGINT AS events
      FROM event_to_c etc
      WHERE etc.created_at > v_now - v_interval
        AND etc.c_mod <> 'other'
      GROUP BY etc.c_mod
    ),
    prior_period AS (
      SELECT etc.c_mod, COUNT(*)::BIGINT AS events
      FROM event_to_c etc
      WHERE etc.created_at > v_now - (v_interval * 2)
        AND etc.created_at <= v_now - v_interval
        AND etc.c_mod <> 'other'
      GROUP BY etc.c_mod
    ),
    all_cs AS (
      SELECT unnest(ARRAY['connect','convene','collaborate','contribute','convey']) AS c_mod
    )
    SELECT
      ac.c_mod AS c_module,
      COALESCE(cp.events, 0) AS event_count,
      CASE WHEN COALESCE(cp.events, 0) > 0 THEN 1::BIGINT ELSE 0::BIGINT END AS unique_users,
      COALESCE(cp.events, 0) - COALESCE(pp.events, 0) AS delta_vs_prior_period
    FROM all_cs ac
    LEFT JOIN current_period cp ON cp.c_mod = ac.c_mod
    LEFT JOIN prior_period pp ON pp.c_mod = ac.c_mod;
  ELSE
    RETURN QUERY
    WITH current_period AS (
      SELECT
        pm.c_module AS c_mod,
        SUM(pm.event_count)::BIGINT AS events,
        SUM(pm.unique_users)::BIGINT AS users
      FROM public.pulse_metrics_daily pm
      WHERE pm.hour_bucket > v_now - v_interval
        AND pm.c_module <> 'other'
      GROUP BY pm.c_module
    ),
    prior_period AS (
      SELECT
        pm.c_module AS c_mod,
        SUM(pm.event_count)::BIGINT AS events
      FROM public.pulse_metrics_daily pm
      WHERE pm.hour_bucket > v_now - (v_interval * 2)
        AND pm.hour_bucket <= v_now - v_interval
        AND pm.c_module <> 'other'
      GROUP BY pm.c_module
    ),
    all_cs AS (
      SELECT unnest(ARRAY['connect','convene','collaborate','contribute','convey']) AS c_mod
    )
    SELECT
      ac.c_mod AS c_module,
      COALESCE(cp.events, 0) AS event_count,
      COALESCE(cp.users, 0) AS unique_users,
      COALESCE(cp.events, 0) - COALESCE(pp.events, 0) AS delta_vs_prior_period
    FROM all_cs ac
    LEFT JOIN current_period cp ON cp.c_mod = ac.c_mod
    LEFT JOIN prior_period pp ON pp.c_mod = ac.c_mod;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_five_cs_pulse(TEXT, TEXT, UUID) TO authenticated;

-- ============================================================
-- 7. RPC: get_pulse_breakdown
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pulse_breakdown(
  p_c_module TEXT,
  p_time_range TEXT DEFAULT '24h',
  p_scope TEXT DEFAULT 'platform',
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  display_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTERVAL;
  v_user_id UUID;
BEGIN
  v_interval := CASE p_time_range
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  IF p_scope = 'user' THEN
    v_user_id := COALESCE(p_user_id, auth.uid());
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User scope requires authenticated user or p_user_id';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    ae.event_type,
    COUNT(*)::BIGINT AS event_count,
    CASE ae.event_type
      WHEN 'connection_request' THEN 'New connection requests'
      WHEN 'connection_accepted' THEN 'Connections accepted'
      WHEN 'event_created' THEN 'Events created'
      WHEN 'event_rsvp' THEN 'Event RSVPs'
      WHEN 'space_created' THEN 'Spaces created'
      WHEN 'space_joined' THEN 'Members joined spaces'
      WHEN 'opportunity_created' THEN 'Opportunities posted'
      WHEN 'opportunity_application' THEN 'Applications submitted'
      WHEN 'post_created' THEN 'Posts published'
      WHEN 'reaction_created' THEN 'Reactions given'
      ELSE ae.event_type
    END AS display_label
  FROM public.activity_events ae
  WHERE ae.created_at > now() - v_interval
    AND (p_scope = 'platform' OR ae.user_id = v_user_id)
    AND CASE
      WHEN p_c_module = 'connect' THEN ae.event_type IN ('connection_request','connection_accepted','profile_updated','profile_view')
      WHEN p_c_module = 'convene' THEN ae.event_type IN ('event_created','event_rsvp','event_published')
      WHEN p_c_module = 'collaborate' THEN ae.event_type IN ('space_created','space_joined','space_message','task_completed')
      WHEN p_c_module = 'contribute' THEN ae.event_type IN ('opportunity_created','opportunity_application','opportunity_thread_message')
      WHEN p_c_module = 'convey' THEN ae.event_type IN ('post_created','comment_created','reaction_created','story_created')
      ELSE FALSE
    END
  GROUP BY ae.event_type
  ORDER BY event_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_breakdown(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ============================================================
-- 8. RPC: get_dia_daily_brief
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dia_daily_brief(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  position SMALLINT,
  c_module TEXT,
  signal_type TEXT,
  title TEXT,
  body TEXT,
  cta_label TEXT,
  cta_route TEXT,
  target_entity_type TEXT,
  target_entity_id UUID,
  reasoning TEXT,
  is_fallback BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required';
  END IF;

  RETURN QUERY
  SELECT
    bc.id,
    bc.position,
    bc.c_module,
    bc.signal_type,
    bc.title,
    bc.body,
    bc.cta_label,
    bc.cta_route,
    bc.target_entity_type,
    bc.target_entity_id,
    bc.reasoning,
    bc.is_fallback
  FROM public.dia_brief_cards bc
  WHERE bc.user_id = v_user_id
    AND bc.expires_at > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.dia_brief_interactions bi
      WHERE bi.card_id = bc.id
        AND bi.interaction_type IN ('dismissed','not_interested')
    )
  ORDER BY bc.position ASC
  LIMIT 3;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dia_daily_brief(UUID) TO authenticated;

-- ============================================================
-- 9. RPC: record_brief_interaction
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_brief_interaction(
  p_card_id UUID,
  p_interaction_type brief_interaction_type
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_interaction_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.dia_brief_interactions (user_id, card_id, interaction_type)
  VALUES (v_user_id, p_card_id, p_interaction_type)
  RETURNING id INTO v_interaction_id;

  IF p_interaction_type IN ('dismissed','not_interested') THEN
    UPDATE public.dia_brief_cards
    SET expires_at = now()
    WHERE id = p_card_id AND user_id = v_user_id;
  END IF;

  RETURN v_interaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_brief_interaction(UUID, brief_interaction_type) TO authenticated;

-- ============================================================
-- 10. RPC: get_trending_hashtags
-- (drops any prior signature variants to avoid conflicts)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_trending_hashtags(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_trending_hashtags(text, integer);
DROP FUNCTION IF EXISTS public.get_trending_hashtags(integer);

CREATE OR REPLACE FUNCTION public.get_trending_hashtags(
  p_time_range TEXT DEFAULT '24h',
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  hashtag TEXT,
  post_count BIGINT,
  unique_authors BIGINT,
  is_followed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTERVAL;
  v_user_id UUID := auth.uid();
BEGIN
  v_interval := CASE p_time_range
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  RETURN QUERY
  SELECT
    ph.hashtag,
    COUNT(DISTINCT ph.post_id)::BIGINT AS post_count,
    COUNT(DISTINCT p.author_id)::BIGINT AS unique_authors,
    EXISTS(
      SELECT 1 FROM public.trend_follows tf
      WHERE tf.user_id = v_user_id AND tf.hashtag = ph.hashtag
    ) AS is_followed
  FROM public.post_hashtags ph
  JOIN public.posts p ON p.id = ph.post_id
  WHERE p.created_at > now() - v_interval
    AND p.visibility = 'public'
  GROUP BY ph.hashtag
  ORDER BY post_count DESC, unique_authors DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_hashtags(TEXT, INT) TO authenticated;

-- ============================================================
-- 11. RPC: toggle_trend_follow
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_trend_follow(p_hashtag TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.trend_follows
    WHERE user_id = v_user_id AND hashtag = p_hashtag
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.trend_follows
    WHERE user_id = v_user_id AND hashtag = p_hashtag;
    RETURN FALSE;
  ELSE
    INSERT INTO public.trend_follows (user_id, hashtag)
    VALUES (v_user_id, p_hashtag);
    RETURN TRUE;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_trend_follow(TEXT) TO authenticated;

-- ============================================================
-- 12. Realtime broadcast trigger on activity_events
-- ============================================================
CREATE OR REPLACE FUNCTION public.broadcast_activity_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('pulse_platform', json_build_object(
    'c_module', CASE
      WHEN NEW.event_type IN ('connection_request','connection_accepted','profile_updated','profile_view') THEN 'connect'
      WHEN NEW.event_type IN ('event_created','event_rsvp','event_published') THEN 'convene'
      WHEN NEW.event_type IN ('space_created','space_joined','space_message','task_completed') THEN 'collaborate'
      WHEN NEW.event_type IN ('opportunity_created','opportunity_application','opportunity_thread_message') THEN 'contribute'
      WHEN NEW.event_type IN ('post_created','comment_created','reaction_created','story_created') THEN 'convey'
      ELSE 'other'
    END,
    'event_type', NEW.event_type,
    'user_id', NEW.user_id,
    'timestamp', NEW.created_at
  )::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_activity_event ON public.activity_events;
CREATE TRIGGER trg_broadcast_activity_event
  AFTER INSERT ON public.activity_events
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_activity_event();

COMMENT ON FUNCTION public.broadcast_activity_event() IS
  'Right-rail Pulse Compass realtime feed. Broadcasts on pulse_platform channel; payload includes user_id so clients can filter for personal scope.';

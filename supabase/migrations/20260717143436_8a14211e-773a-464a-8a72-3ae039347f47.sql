
-- 1) Materialized view for Five C's footprint counts
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_profile_footprint_counts AS
SELECT
  p.id AS user_id,
  COALESCE((
    SELECT COUNT(*) FROM public.connections c
    WHERE c.status = 'accepted' AND (c.requester_id = p.id OR c.recipient_id = p.id)
  ), 0)::int AS connections,
  COALESCE((
    SELECT COUNT(*) FROM public.event_attendees ea WHERE ea.user_id = p.id
  ), 0)::int AS events,
  COALESCE((
    SELECT COUNT(*) FROM public.space_members sm WHERE sm.user_id = p.id
  ), 0)::int AS spaces,
  COALESCE((
    SELECT COUNT(*) FROM public.contribution_offers co WHERE co.created_by = p.id
  ), 0)::int AS contributions,
  COALESCE((
    SELECT COUNT(*) FROM public.posts po
    WHERE po.author_id = p.id AND po.is_deleted = false
  ), 0)::int AS posts,
  now() AS refreshed_at
FROM public.profiles p
WHERE p.deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS mv_profile_footprint_counts_user_id_idx
  ON public.mv_profile_footprint_counts (user_id);

GRANT SELECT ON public.mv_profile_footprint_counts TO anon, authenticated, service_role;

-- 2) Consolidated bundle RPC v2 — wraps v1 and appends activity.counts
CREATE OR REPLACE FUNCTION public.rpc_get_profile_bundle_v2(
  p_username text,
  p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bundle jsonb;
  v_uid uuid;
  v_counts jsonb;
BEGIN
  v_bundle := public.rpc_get_profile_bundle(p_username, p_viewer_id)::jsonb;
  IF v_bundle IS NULL THEN
    RETURN NULL;
  END IF;

  v_uid := (v_bundle->'profile'->>'id')::uuid;

  SELECT jsonb_build_object(
    'connections',   COALESCE(m.connections, 0),
    'events',        COALESCE(m.events, 0),
    'spaces',        COALESCE(m.spaces, 0),
    'contributions', COALESCE(m.contributions, 0),
    'posts',         COALESCE(m.posts, 0)
  ) INTO v_counts
  FROM public.mv_profile_footprint_counts m
  WHERE m.user_id = v_uid;

  IF v_counts IS NULL THEN
    v_counts := jsonb_build_object(
      'connections', 0, 'events', 0, 'spaces', 0, 'contributions', 0, 'posts', 0
    );
  END IF;

  v_bundle := jsonb_set(
    v_bundle,
    '{activity,counts}',
    v_counts,
    true
  );

  RETURN v_bundle;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_get_profile_bundle_v2(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_profile_bundle_v2(text, uuid) TO authenticated;

-- 3) Scheduled refresh every 15 minutes (idempotent)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('mv_profile_footprint_counts_refresh')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'mv_profile_footprint_counts_refresh'
    );
    PERFORM cron.schedule(
      'mv_profile_footprint_counts_refresh',
      '*/15 * * * *',
      $cron$ REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_profile_footprint_counts $cron$
    );
  END IF;
END
$do$;

-- 4) Security: gate raw contact columns on profiles.
-- Owners still read them via get_own_profile (SECURITY DEFINER).
-- All other reads via profiles table no longer expose these columns.
REVOKE SELECT (email, phone_number, whatsapp_number) ON public.profiles FROM anon, authenticated;

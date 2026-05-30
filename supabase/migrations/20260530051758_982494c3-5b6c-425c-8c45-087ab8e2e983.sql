-- BD042 DROP pass — archive-then-drop, gated, atomic. (jsonb-aware Gate B)

CREATE SCHEMA IF NOT EXISTS archive;
REVOKE ALL ON SCHEMA archive FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA archive TO service_role;

DROP TABLE IF EXISTS archive.diaspora_narrative_drop_20260530;
CREATE TABLE archive.diaspora_narrative_drop_20260530 AS
SELECT id,
       diaspora_origin,
       diaspora_tags,
       diaspora_story,
       years_in_diaspora,
       years_in_diaspora_text,
       now() AS archived_at
FROM public.profiles;

REVOKE ALL ON TABLE archive.diaspora_narrative_drop_20260530 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON archive.diaspora_narrative_drop_20260530 TO service_role;

DO $gates$
DECLARE
  v_profiles_count       bigint;
  v_archive_count        bigint;
  v_bearing_origin       bigint;
  v_bearing_tags         bigint;
  v_bearing_story        bigint;
  v_bearing_years        bigint;
  v_bearing_years_text   bigint;
  v_dep_funcs            bigint;
  v_dep_views            bigint;
  v_dep_policies         bigint;
  v_tags_type            text;
BEGIN
  -- GATE A
  SELECT count(*) INTO v_profiles_count FROM public.profiles;
  SELECT count(*) INTO v_archive_count  FROM archive.diaspora_narrative_drop_20260530;
  RAISE NOTICE 'GATE A — profiles=%, archive=%', v_profiles_count, v_archive_count;
  IF v_archive_count <> v_profiles_count THEN
    RAISE EXCEPTION 'GATE A FAILED: archive=% != profiles=%', v_archive_count, v_profiles_count;
  END IF;

  -- Discover diaspora_tags storage type for accurate emptiness check
  SELECT data_type INTO v_tags_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='diaspora_tags';
  RAISE NOTICE 'diaspora_tags data_type = %', v_tags_type;

  -- GATE B: dynamic SQL so we handle jsonb vs ARRAY without parse-time failure
  EXECUTE format($f$
    SELECT
      count(*) FILTER (WHERE diaspora_origin IS NOT NULL AND btrim(diaspora_origin) <> ''),
      count(*) FILTER (WHERE %s),
      count(*) FILTER (WHERE diaspora_story IS NOT NULL AND btrim(diaspora_story) <> ''),
      count(*) FILTER (WHERE years_in_diaspora IS NOT NULL),
      count(*) FILTER (WHERE years_in_diaspora_text IS NOT NULL AND btrim(years_in_diaspora_text) <> '')
    FROM public.profiles
  $f$,
    CASE
      WHEN v_tags_type = 'jsonb' THEN
        $j$diaspora_tags IS NOT NULL
           AND diaspora_tags <> 'null'::jsonb
           AND ((jsonb_typeof(diaspora_tags)='array' AND jsonb_array_length(diaspora_tags) > 0)
                OR (jsonb_typeof(diaspora_tags)='object' AND diaspora_tags <> '{}'::jsonb)
                OR (jsonb_typeof(diaspora_tags) NOT IN ('array','object','null')))$j$
      WHEN v_tags_type = 'json' THEN
        $j$diaspora_tags IS NOT NULL AND diaspora_tags::text NOT IN ('null','[]','{}')$j$
      WHEN v_tags_type = 'ARRAY' THEN
        $j$diaspora_tags IS NOT NULL AND array_length(diaspora_tags,1) > 0$j$
      ELSE
        $j$diaspora_tags IS NOT NULL AND btrim(diaspora_tags::text) <> ''$j$
    END
  )
  INTO v_bearing_origin, v_bearing_tags, v_bearing_story, v_bearing_years, v_bearing_years_text;

  RAISE NOTICE 'GATE B — origin=%, tags=%, story=%, years=%, years_text=%',
    v_bearing_origin, v_bearing_tags, v_bearing_story, v_bearing_years, v_bearing_years_text;
  IF v_bearing_origin + v_bearing_tags + v_bearing_story + v_bearing_years + v_bearing_years_text > 0 THEN
    RAISE EXCEPTION 'GATE B FAILED: data-bearing rows detected (origin=%, tags=%, story=%, years=%, years_text=%)',
      v_bearing_origin, v_bearing_tags, v_bearing_story, v_bearing_years, v_bearing_years_text;
  END IF;

  -- GATE C
  SELECT count(*) INTO v_dep_funcs
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ~ 'diaspora_origin|diaspora_tags|diaspora_story|years_in_diaspora';

  SELECT count(*) INTO v_dep_views
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND view_definition ~ 'diaspora_origin|diaspora_tags|diaspora_story|years_in_diaspora';

  SELECT count(*) INTO v_dep_policies
  FROM pg_policy
  WHERE coalesce(pg_get_expr(polqual, polrelid), '') ~ 'diaspora_origin|diaspora_tags|diaspora_story|years_in_diaspora'
     OR coalesce(pg_get_expr(polwithcheck, polrelid), '') ~ 'diaspora_origin|diaspora_tags|diaspora_story|years_in_diaspora';

  RAISE NOTICE 'GATE C — funcs=%, views=%, policies=%', v_dep_funcs, v_dep_views, v_dep_policies;
  IF v_dep_funcs + v_dep_views + v_dep_policies > 0 THEN
    RAISE EXCEPTION 'GATE C FAILED: live dependencies remain (funcs=%, views=%, policies=%)',
      v_dep_funcs, v_dep_views, v_dep_policies;
  END IF;

  RAISE NOTICE 'ALL GATES GREEN — proceeding to DROP';
END
$gates$;

ALTER TABLE public.profiles
  DROP COLUMN diaspora_origin,
  DROP COLUMN diaspora_tags,
  DROP COLUMN diaspora_story,
  DROP COLUMN years_in_diaspora,
  DROP COLUMN years_in_diaspora_text;  -- NO CASCADE

REVOKE EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) FROM anon;

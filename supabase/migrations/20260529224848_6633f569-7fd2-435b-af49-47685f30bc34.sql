-- BD036 Step 3 — member_heritage create + backfill (delegated-RLS read)
BEGIN;

UPDATE public.profiles SET country_of_origin = NULL WHERE country_of_origin = '';

CREATE TABLE public.member_heritage (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_country       TEXT NOT NULL,
  is_primary           BOOLEAN NOT NULL DEFAULT false,
  ethnic_heritage      TEXT[] NOT NULL DEFAULT '{}',
  diaspora_networks    TEXT[] NOT NULL DEFAULT '{}',
  heritage_notes       TEXT,
  source_archive_ref   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_heritage_origin_country_iso3
    CHECK (origin_country ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_member_heritage_profile_id ON public.member_heritage(profile_id);
CREATE UNIQUE INDEX uniq_member_heritage_profile_primary
  ON public.member_heritage(profile_id) WHERE is_primary = true;
CREATE UNIQUE INDEX uniq_member_heritage_profile_country
  ON public.member_heritage(profile_id, origin_country);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_heritage TO authenticated;
GRANT ALL ON public.member_heritage TO service_role;

ALTER TABLE public.member_heritage ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_heritage_owner_all ON public.member_heritage
  FOR ALL
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

-- Delegated read: nested EXISTS runs under profiles' RLS, so visibility
-- tracks profiles_select_fixed (is_public OR self OR accepted connection).
-- Single source of truth = profiles. Do NOT restate the rule here; do NOT
-- "optimize" the EXISTS away — the nested RLS is load-bearing.
CREATE POLICY member_heritage_readable ON public.member_heritage
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = member_heritage.profile_id)
  );

CREATE TRIGGER trg_member_heritage_updated_at
  BEFORE UPDATE ON public.member_heritage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: 9 distinct live values, 14 rows total (verified pre-apply).
INSERT INTO public.member_heritage
  (profile_id, origin_country, is_primary, ethnic_heritage, diaspora_networks, source_archive_ref)
SELECT
  p.id,
  CASE upper(trim(p.country_of_origin))
    WHEN 'GHANA'         THEN 'GHA'
    WHEN 'HAITI'         THEN 'HTI'
    WHEN 'INDIA'         THEN 'IND'
    WHEN 'KENYA'         THEN 'KEN'
    WHEN 'NIGERIA'       THEN 'NGA'
    WHEN 'SIERRA LEONE'  THEN 'SLE'
    WHEN 'SWEDEN'        THEN 'SWE'
    WHEN 'UNITED STATES' THEN 'USA'
    WHEN 'ZIMBABWE'      THEN 'ZWE'
    ELSE NULL
  END,
  true,
  COALESCE(p.ethnic_heritage, '{}'::text[]),
  COALESCE(p.diaspora_networks, '{}'::text[]),
  'profiles.country_of_origin@BD036'
FROM public.profiles p
WHERE p.country_of_origin IS NOT NULL
  AND length(trim(p.country_of_origin)) > 0;

DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM public.member_heritage WHERE origin_country IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'BD036 backfill produced % NULL origin_country rows', n;
  END IF;
END$$;

COMMIT;
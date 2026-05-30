-- BD038/4b Step 6b: 41-row archive + 3 gates, then drop 5 heritage-origin columns.
-- Single transaction. Archive schema is off the Data API (no anon/authenticated GRANTs).

-- Drop the previously-created public archive table from the rolled-back attempt (CREATE TABLE
-- commits even when the surrounding tx rolls back if it ran in a prior submission). Safe no-op
-- if it doesn't exist.
DROP TABLE IF EXISTS public.profiles_heritage_origin_archive_4b;

-- 0. Off-Data-API archive schema
CREATE SCHEMA IF NOT EXISTS archive;
GRANT USAGE ON SCHEMA archive TO service_role;

-- 1. Archive table + full 41-row snapshot
CREATE TABLE archive.heritage_origin_drop_20260529 (
  profile_id uuid PRIMARY KEY,
  country_of_origin text,
  country_origin text,
  origin_country_code text,
  origin_country_name text,
  country_of_origin_id uuid,
  archived_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON archive.heritage_origin_drop_20260529 TO service_role;

INSERT INTO archive.heritage_origin_drop_20260529
  (profile_id, country_of_origin, country_origin, origin_country_code, origin_country_name, country_of_origin_id)
SELECT id, country_of_origin, country_origin, origin_country_code, origin_country_name, country_of_origin_id
FROM public.profiles;

-- 2. Three gates
DO $$
DECLARE
  archived_count int;
  real_origin_count int;
  dead_rep_with_data int;
BEGIN
  SELECT count(*) INTO archived_count FROM archive.heritage_origin_drop_20260529;
  IF archived_count <> 41 THEN
    RAISE EXCEPTION 'archive count % <> 41 (structural gate)', archived_count;
  END IF;

  SELECT count(*) INTO real_origin_count
  FROM archive.heritage_origin_drop_20260529
  WHERE country_of_origin IS NOT NULL AND country_of_origin <> '';
  IF real_origin_count <> 14 THEN
    RAISE EXCEPTION 'country_of_origin non-empty = %, expected 14 (substantive gate)', real_origin_count;
  END IF;

  SELECT count(*) INTO dead_rep_with_data
  FROM archive.heritage_origin_drop_20260529
  WHERE country_origin IS NOT NULL
     OR origin_country_code IS NOT NULL
     OR origin_country_name IS NOT NULL
     OR country_of_origin_id IS NOT NULL;
  IF dead_rep_with_data <> 0 THEN
    RAISE EXCEPTION 'a supposedly-dead origin rep carried data: % rows (classification gate)', dead_rep_with_data;
  END IF;
END $$;

-- 3. Drop the diaspora_profile updater function (re-pointed; reads a dropping column)
DROP FUNCTION public.update_profile_diaspora(uuid, text, text, text, jsonb);

-- 4. Drop the FK before dropping its column
ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_country_of_origin_id_fkey;

-- 5. Drop the five heritage-origin columns. No CASCADE.
ALTER TABLE public.profiles
  DROP COLUMN country_of_origin,
  DROP COLUMN country_origin,
  DROP COLUMN origin_country_code,
  DROP COLUMN origin_country_name,
  DROP COLUMN country_of_origin_id;
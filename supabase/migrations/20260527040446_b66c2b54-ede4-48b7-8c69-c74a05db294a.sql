-- D054: enforce ISO 3166-1 alpha-3 format on profiles.country.
-- The column is already char(3); this guards against lowercase, digits,
-- legacy alpha-2 codes, or junk being written from any client.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_country_alpha3_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_country_alpha3_check
  CHECK (country IS NULL OR country ~ '^[A-Z]{3}$');
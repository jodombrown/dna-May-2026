ALTER TABLE public.profiles
  ADD COLUMN continent char(2) NULL,
  ADD COLUMN country   char(3) NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_continent_iso2_format
  CHECK (continent IS NULL OR continent ~ '^[A-Z]{2}$');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_continent_known
  CHECK (continent IS NULL OR continent IN ('AF','AS','EU','NA','SA','OC'));
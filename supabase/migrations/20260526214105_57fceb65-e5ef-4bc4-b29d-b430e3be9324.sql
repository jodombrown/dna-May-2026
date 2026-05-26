-- Role layer with soft default per BD008 ('exploring' = not yet declared)
ALTER TABLE public.profiles
  ADD COLUMN role public.dna_identity_role NOT NULL DEFAULT 'exploring',
  ADD COLUMN role_declared_at  timestamptz NULL,
  ADD COLUMN place_declared_at timestamptz NULL;

-- Indexes for feed/discover filters on role + place
CREATE INDEX IF NOT EXISTS profiles_role_idx       ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_continent_idx  ON public.profiles (continent);
CREATE INDEX IF NOT EXISTS profiles_country_idx    ON public.profiles (country);
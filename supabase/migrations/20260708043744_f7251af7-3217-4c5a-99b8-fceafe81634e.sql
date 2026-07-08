-- 1. Table
CREATE TABLE public.stat_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  display_value text NOT NULL,
  label text NOT NULL,
  description text NOT NULL,
  source_name text NOT NULL,
  source_url text,
  year integer,
  methodology text,
  definition text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX stat_citations_active_sort_idx
  ON public.stat_citations (is_active, sort_order);

-- 2. Grants (public read is intentional; writes go through admin policies)
GRANT SELECT ON public.stat_citations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stat_citations TO authenticated;
GRANT ALL ON public.stat_citations TO service_role;

-- 3. RLS
ALTER TABLE public.stat_citations ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Anyone can read active citations"
  ON public.stat_citations
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert citations"
  ON public.stat_citations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update citations"
  ON public.stat_citations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete citations"
  ON public.stat_citations
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger (reuses existing helper if present, otherwise creates one)
CREATE OR REPLACE FUNCTION public.set_stat_citations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stat_citations_set_updated_at
  BEFORE UPDATE ON public.stat_citations
  FOR EACH ROW EXECUTE FUNCTION public.set_stat_citations_updated_at();

-- 6. Seed the three current homepage stats
INSERT INTO public.stat_citations
  (key, display_value, label, description, source_name, source_url, year, methodology, definition, sort_order)
VALUES
  (
    'diaspora_population',
    '200M+',
    'People of African Descent',
    'Living outside Africa, projected to comprise 25% of global population',
    'African Union',
    'https://au.int/en/diaspora-division',
    2024,
    'Aggregated national census data and diaspora estimates compiled by the African Union''s Citizens and Diaspora Organizations Directorate (CIDO).',
    'People of African descent living outside the African continent, spanning historic diaspora communities (Caribbean, Americas) and modern migration cohorts (Europe, Middle East, Asia).',
    1
  ),
  (
    'annual_remittances',
    '100B+',
    'Annual Remittances (2024)',
    'Fueling economic growth across African nations',
    'World Bank / KNOMAD',
    'https://www.knomad.org/publication/migration-and-development-brief-41',
    2024,
    'World Bank / KNOMAD Migration and Development Brief 41: modelled from bilateral remittance matrices, national balance-of-payments filings, and mobile-money corridor data.',
    'Formal remittance inflows to Sub-Saharan Africa recorded through banks, money-transfer operators, and licensed mobile-money channels. Excludes informal / hand-carried transfers.',
    2
  ),
  (
    'education_rate',
    '43%',
    'Highly Educated',
    'Hold bachelor''s degree or higher, 2x the U.S. national average',
    'Pew Research Center',
    'https://www.pewresearch.org/2022/01/20/a-growing-share-of-black-immigrants-have-a-college-degree-or-higher/',
    2022,
    'Pew analysis of U.S. Census Bureau American Community Survey (ACS) microdata via IPUMS, filtered to foreign-born Black adults ages 25+.',
    'Share of Black immigrants ages 25 and older living in the U.S. who hold a bachelor''s degree or higher. The U.S. national average for the same age cohort is roughly 22%.',
    3
  );
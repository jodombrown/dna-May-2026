## Rebuild `public.public_profiles` view

Add `role`, `continent`, `country` to the view's SELECT list, preserving all 37 existing columns in their current order. Re-grant `SELECT` to `anon` and `authenticated` (views drop grants on recreate).

### Migration SQL

```sql
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  username,
  display_name,
  full_name,
  first_name,
  last_name,
  avatar_url,
  profile_picture_url,
  banner_url,
  headline,
  bio,
  professional_role,
  profession,
  industry,
  years_experience,
  company,
  venture_name,
  venture_stage,
  country_of_origin,
  diaspora_origin,
  origin_country_name,
  current_country,
  current_country_name,
  current_city,
  current_region,
  skills,
  interests,
  interest_tags,
  sectors,
  impact_areas,
  impact_regions,
  sdg_focus,
  available_for,
  offers,
  needs,
  networking_goals,
  is_public,
  created_at,
  role,
  continent,
  country
FROM public.profiles
WHERE is_public = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

### Notes

- `CREATE OR REPLACE VIEW` preserves the view OID, so FKs / dependent objects referencing `public_profiles` remain intact.
- The three new columns are appended at the end so existing column ordinals are unchanged.
- After the migration runs, `src/integrations/supabase/types.ts` will regenerate to include `role`, `continent`, `country` on the `public_profiles` row type.

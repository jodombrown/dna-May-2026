-- 1. Drop duplicate profile completion trigger
DROP TRIGGER IF EXISTS update_profile_score ON public.profiles;

-- 2. Conservative role backfill (soft seed; only undeclared + default rows)
UPDATE public.profiles
SET role = CASE diaspora_status
             WHEN 'returnee'            THEN 'returnee'::dna_identity_role
             WHEN 'ally'                THEN 'ally'::dna_identity_role
             WHEN 'continental_african' THEN 'anchor'::dna_identity_role
           END
WHERE role_declared_at IS NULL
  AND role = 'exploring'::dna_identity_role
  AND diaspora_status IN ('returnee','ally','continental_african');
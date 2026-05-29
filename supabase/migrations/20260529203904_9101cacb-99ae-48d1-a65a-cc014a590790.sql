BEGIN;
DROP INDEX IF EXISTS public.idx_profiles_diaspora_status;
ALTER TABLE public.profiles DROP COLUMN diaspora_status;
COMMIT;
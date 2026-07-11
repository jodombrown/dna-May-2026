REVOKE INSERT, UPDATE, DELETE ON public.profile_causes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profile_skills FROM anon;
-- SELECT was never granted through a policy for anon (policy is authenticated-only);
-- table-level SELECT remains but RLS blocks it.
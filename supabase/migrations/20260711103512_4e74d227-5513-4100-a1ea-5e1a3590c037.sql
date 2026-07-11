-- Restore Data API grants on public.profiles.
-- Symptom: "permission denied for table profiles" on client updates because
-- the profiles table had zero role_table_grants, so PostgREST could not
-- reach it even though RLS policies allowed the action.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
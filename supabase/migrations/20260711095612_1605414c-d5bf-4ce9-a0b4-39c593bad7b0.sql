-- get_own_profile filters internally by auth.uid(); safe to expose to anon
-- (returns zero rows when unauthenticated). Prevents "permission denied for
-- function get_own_profile" flashes during session hydration on onboarding.
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO anon;
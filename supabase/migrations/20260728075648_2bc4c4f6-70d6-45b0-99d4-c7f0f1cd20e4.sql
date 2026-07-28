REVOKE SELECT (current_lat, current_lng, current_geog) ON public.profiles FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_own_location()
RETURNS TABLE (current_lat double precision, current_lng double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.current_lat, p.current_lng
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_own_location() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_location() TO authenticated;
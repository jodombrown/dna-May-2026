REVOKE SELECT (current_lat, current_lng) ON public.profiles FROM authenticated;
REVOKE SELECT (current_lat, current_lng) ON public.profiles FROM anon;
-- Fix: authenticated role cannot execute is_group_creator, causing
-- "permission denied for function is_group_creator" when RLS on group_members
-- (referenced by events SELECT policy) evaluates during PostgREST returning
-- rows after an events UPDATE.
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO service_role;
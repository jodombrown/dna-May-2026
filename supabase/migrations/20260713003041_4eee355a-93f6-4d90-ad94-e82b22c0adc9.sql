-- 1. Re-assert the groups policy in tracked history (idempotent; matches live state).
DROP POLICY IF EXISTS groups_select_fixed ON public.groups;
CREATE POLICY groups_select_fixed ON public.groups AS PERMISSIVE FOR SELECT TO authenticated
  USING (((privacy <> 'secret'::group_privacy) OR (created_by = ( SELECT auth.uid() AS uid)) OR is_group_member(id, ( SELECT auth.uid() AS uid))));

-- 2. Revoke dead anon EXECUTE grants on group helper functions.
REVOKE EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid)  FROM anon;
-- BD059 · Break recursion in space_members roster policies by routing the
-- "is this caller a lead or the space creator?" check through a SECURITY
-- DEFINER helper. Discovered by Arc 4 Cycle 2 role-impersonation verification.

CREATE OR REPLACE FUNCTION public.is_space_lead(_space_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.spaces s
     WHERE s.id = _space_id AND s.created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.space_members sm
     WHERE sm.space_id = _space_id
       AND sm.user_id  = _user_id
       AND sm.role     = 'lead'
       AND COALESCE(sm.status, 'active') = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_space_lead(uuid, uuid) TO authenticated, service_role;

-- UPDATE: creator, lead, or the member themselves.
DROP POLICY IF EXISTS space_members_update_fixed ON public.space_members;
CREATE POLICY space_members_update_fixed
  ON public.space_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_space_lead(space_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.is_space_lead(space_id, (SELECT auth.uid()))
  );

-- DELETE: same set.
DROP POLICY IF EXISTS space_members_delete_fixed ON public.space_members;
CREATE POLICY space_members_delete_fixed
  ON public.space_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_space_lead(space_id, (SELECT auth.uid()))
  );

-- INSERT policy also self-references; keep it consistent with the helper so
-- self-join, creator-invite, and lead-invite paths all avoid recursion.
DROP POLICY IF EXISTS space_members_insert_fixed ON public.space_members;
CREATE POLICY space_members_insert_fixed
  ON public.space_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.is_space_lead(space_id, (SELECT auth.uid()))
  );
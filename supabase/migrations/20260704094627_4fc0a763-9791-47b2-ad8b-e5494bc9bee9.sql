CREATE OR REPLACE FUNCTION public.rpc_list_eligible_witnesses(
  p_role_at_affirm public.dna_identity_role
)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.id <> auth.uid()
    AND public.is_affirmed_member(p.id)
    AND (p_role_at_affirm <> 'ally' OR p.role IN ('returnee','anchor'));
$$;

REVOKE ALL ON FUNCTION public.rpc_list_eligible_witnesses(public.dna_identity_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rpc_list_eligible_witnesses(public.dna_identity_role) TO authenticated;
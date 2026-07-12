
-- 1. Attach existing guard triggers
DROP TRIGGER IF EXISTS trg_profiles_prevent_priv_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_priv_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation_profiles();

DROP TRIGGER IF EXISTS trg_orgs_prevent_priv_escalation ON public.organizations;
CREATE TRIGGER trg_orgs_prevent_priv_escalation
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_privilege_escalation();

DROP TRIGGER IF EXISTS trg_communities_prevent_priv_escalation ON public.communities;
CREATE TRIGGER trg_communities_prevent_priv_escalation
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.prevent_community_privilege_escalation();

-- 2. user_dia_profile guard
CREATE OR REPLACE FUNCTION public.prevent_user_dia_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified_contributor IS DISTINCT FROM OLD.is_verified_contributor
     OR NEW.contributor_score IS DISTINCT FROM OLD.contributor_score
     OR NEW.contributor_impact_type IS DISTINCT FROM OLD.contributor_impact_type
  THEN
    RAISE EXCEPTION 'Not authorized to modify verified-contributor fields on user_dia_profile.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_user_dia_profile_privilege_escalation() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_user_dia_profile_prevent_priv_escalation ON public.user_dia_profile;
CREATE TRIGGER trg_user_dia_profile_prevent_priv_escalation
  BEFORE UPDATE ON public.user_dia_profile
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_dia_profile_privilege_escalation();

-- 3. user_badges: badges are awarded by the system (service role) only.
DROP POLICY IF EXISTS "System inserts badges" ON public.user_badges;
CREATE POLICY "Service role inserts badges"
  ON public.user_badges
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. community_memberships: restrict SELECT to same-community members + creator + admin
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_memberships;
CREATE POLICY "Members and admins can view community memberships"
  ON public.community_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_memberships.community_id
        AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.community_memberships cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 5. Convert group helper functions to SECURITY INVOKER so they aren't flagged
ALTER FUNCTION public.is_group_creator(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_group_member(uuid, uuid) SECURITY INVOKER;

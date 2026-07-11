-- =====================================================================
-- PROFILES: block self privilege escalation on sensitive columns
-- =====================================================================
CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_actor boolean := false;
BEGIN
  -- Service role / superuser / no auth context -> allow (server-side flows)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    is_admin_actor := public.has_role(auth.uid(), 'admin'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin_actor := false;
  END;

  IF is_admin_actor THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change these fields (revert to OLD)
  NEW.is_admin              := OLD.is_admin;
  NEW.verified              := OLD.verified;
  NEW.verification_status   := OLD.verification_status;
  NEW.beta_status           := OLD.beta_status;
  NEW.is_beta_tester        := OLD.is_beta_tester;
  NEW.beta_expires_at       := OLD.beta_expires_at;
  NEW.is_test_account       := OLD.is_test_account;
  NEW.deleted_at            := OLD.deleted_at;
  NEW.follower_count        := OLD.follower_count;
  NEW.following_count       := OLD.following_count;
  NEW.connection_count      := OLD.connection_count;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_privilege_escalation();

-- =====================================================================
-- ORGANIZATIONS: block owner self-verification / self tier upgrade
-- =====================================================================
CREATE OR REPLACE FUNCTION public.organizations_prevent_self_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_actor boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    is_admin_actor := public.has_role(auth.uid(), 'admin'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin_actor := false;
  END;

  IF is_admin_actor THEN
    RETURN NEW;
  END IF;

  NEW.verified            := OLD.verified;
  NEW.verification_status := OLD.verification_status;
  NEW.subscription_tier   := OLD.subscription_tier;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_prevent_self_verification ON public.organizations;
CREATE TRIGGER trg_organizations_prevent_self_verification
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.organizations_prevent_self_verification();

-- =====================================================================
-- SPACE_MEMBERS: prevent self-granting lead / core_contributor role
-- =====================================================================
CREATE OR REPLACE FUNCTION public.space_members_prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  actor_is_lead boolean := false;
BEGIN
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    actor_is_lead := public.is_space_lead(NEW.space_id, actor);
  EXCEPTION WHEN OTHERS THEN
    actor_is_lead := false;
  END;

  IF actor_is_lead THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Self-joins must default to contributor
    IF NEW.user_id = actor THEN
      NEW.role := 'contributor';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Non-leads can't change roles at all
    NEW.role := OLD.role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_space_members_prevent_role_escalation ON public.space_members;
CREATE TRIGGER trg_space_members_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.space_members
  FOR EACH ROW
  EXECUTE FUNCTION public.space_members_prevent_role_escalation();
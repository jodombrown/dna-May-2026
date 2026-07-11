-- Guard: block self-elevation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role / backend calls (no auth.uid()) are always allowed.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins may change anything.
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.role IS DISTINCT FROM OLD.role
  THEN
    RAISE EXCEPTION 'Not authorized to modify privileged profile fields (is_admin, verified, verification_status, role).'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Guard: block self-verification / self-billing on organizations
CREATE OR REPLACE FUNCTION public.prevent_organization_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.verified                    IS DISTINCT FROM OLD.verified
     OR NEW.verified_at              IS DISTINCT FROM OLD.verified_at
     OR NEW.verification_status      IS DISTINCT FROM OLD.verification_status
     OR NEW.verification_submitted_at IS DISTINCT FROM OLD.verification_submitted_at
     OR NEW.verification_approved_at IS DISTINCT FROM OLD.verification_approved_at
     OR NEW.verification_rejected_at IS DISTINCT FROM OLD.verification_rejected_at
     OR NEW.verification_notes       IS DISTINCT FROM OLD.verification_notes
     OR NEW.verification_documents_url IS DISTINCT FROM OLD.verification_documents_url
     OR NEW.verification_fee_paid    IS DISTINCT FROM OLD.verification_fee_paid
     OR NEW.subscription_tier        IS DISTINCT FROM OLD.subscription_tier
     OR NEW.subscription_status      IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_started_at  IS DISTINCT FROM OLD.subscription_started_at
     OR NEW.subscription_ends_at     IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.stripe_customer_id       IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id   IS DISTINCT FROM OLD.stripe_subscription_id
  THEN
    RAISE EXCEPTION 'Not authorized to modify verification, subscription, or billing fields on organizations.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_organization_privilege_escalation ON public.organizations;
CREATE TRIGGER trg_prevent_organization_privilege_escalation
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_privilege_escalation();
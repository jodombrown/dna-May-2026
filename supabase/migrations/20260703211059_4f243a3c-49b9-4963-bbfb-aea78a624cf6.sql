
-- Fix infinite recursion: the previous UPDATE policy on profiles ran subqueries
-- against profiles itself inside WITH CHECK, which re-triggered RLS and recursed.
-- Replace with a BEFORE UPDATE trigger that prevents non-admins from changing
-- privileged columns, and simplify the UPDATE policy.

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.is_admin := OLD.is_admin;
  NEW.role := OLD.role;
  NEW.verified := OLD.verified;
  NEW.verification_status := OLD.verification_status;
  NEW.verification_method := OLD.verification_method;
  NEW.verified_at := OLD.verified_at;
  NEW.verification_updated_at := OLD.verification_updated_at;
  NEW.is_beta_tester := OLD.is_beta_tester;
  NEW.beta_phase := OLD.beta_phase;
  NEW.beta_expires_at := OLD.beta_expires_at;
  NEW.is_test_account := OLD.is_test_account;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

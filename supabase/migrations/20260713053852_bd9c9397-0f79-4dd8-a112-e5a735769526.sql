
-- =========================================================
-- 1. group_members: restrict self-join to role='member'
-- =========================================================
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role = 'member'::group_member_role
  AND COALESCE(is_banned, false) = false
);

-- =========================================================
-- 2. space_members: restrict self-assigned role to non-lead
-- =========================================================
DROP POLICY IF EXISTS space_members_insert_fixed ON public.space_members;
CREATE POLICY space_members_insert_fixed
ON public.space_members
FOR INSERT
TO authenticated
WITH CHECK (
  is_space_lead(space_id, (SELECT auth.uid()))
  OR (
    user_id = (SELECT auth.uid())
    AND (role IS NULL OR role <> 'lead')
  )
);

DROP POLICY IF EXISTS space_members_update_fixed ON public.space_members;
CREATE POLICY space_members_update_fixed
ON public.space_members
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR is_space_lead(space_id, (SELECT auth.uid()))
)
WITH CHECK (
  is_space_lead(space_id, (SELECT auth.uid()))
  OR (
    user_id = (SELECT auth.uid())
    AND (role IS NULL OR role <> 'lead')
  )
);

-- =========================================================
-- 3. organizations: block owner self-verify / self-subscribe
--    via a trigger that resets privileged columns on
--    non-admin, non-service_role updates.
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_org_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  is_service boolean := (current_setting('role', true) = 'service_role');
BEGIN
  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin := false;
  END;

  IF is_admin OR is_service THEN
    RETURN NEW;
  END IF;

  -- Restore protected columns to previous values silently.
  NEW.verified                    := OLD.verified;
  NEW.verified_at                 := OLD.verified_at;
  NEW.verification_status         := OLD.verification_status;
  NEW.verification_approved_at    := OLD.verification_approved_at;
  NEW.verification_rejected_at    := OLD.verification_rejected_at;
  NEW.verification_notes          := OLD.verification_notes;
  NEW.subscription_tier           := OLD.subscription_tier;
  NEW.subscription_status         := OLD.subscription_status;
  NEW.subscription_started_at     := OLD.subscription_started_at;
  NEW.subscription_ends_at        := OLD.subscription_ends_at;
  NEW.stripe_customer_id          := OLD.stripe_customer_id;
  NEW.stripe_subscription_id      := OLD.stripe_subscription_id;
  NEW.verification_fee_paid       := OLD.verification_fee_paid;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_org_privileged_columns_trg ON public.organizations;
CREATE TRIGGER enforce_org_privileged_columns_trg
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_org_privileged_columns();

-- =========================================================
-- 4. profiles: block self-grant of admin / self-verify
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
  is_service boolean := (current_setting('role', true) = 'service_role');
BEGIN
  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin := false;
  END;

  IF is_admin OR is_service THEN
    RETURN NEW;
  END IF;

  -- Restore admin/verification-controlled columns.
  IF TG_OP = 'UPDATE' THEN
    NEW.is_admin            := OLD.is_admin;
    NEW.verified            := OLD.verified;
    NEW.verification_status := OLD.verification_status;
  ELSE
    -- INSERT: force safe defaults so a new row cannot be created admin.
    NEW.is_admin            := false;
    NEW.verified            := COALESCE(NEW.verified, false);
    IF NEW.verified = true THEN NEW.verified := false; END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_privileged_columns_trg ON public.profiles;
CREATE TRIGGER enforce_profile_privileged_columns_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_privileged_columns();

-- =========================================================
-- 5. sponsor_placements: only active + in-window visible
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view active placements" ON public.sponsor_placements;
CREATE POLICY "Authenticated users can view active placements"
ON public.sponsor_placements
FOR SELECT
TO authenticated
USING (
  is_admin_user(auth.uid())
  OR (
    COALESCE(is_active, false) = true
    AND (status IS NULL OR status = 'active')
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >= now())
  )
);

-- =========================================================
-- 6. get_public_event: SECURITY INVOKER (events RLS already
--    exposes published+public rows to anon).
-- =========================================================
ALTER FUNCTION public.get_public_event(text) SECURITY INVOKER;

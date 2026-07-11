-- ─── 1. Communities: block self-approval of moderation / featured / active ──
CREATE OR REPLACE FUNCTION public.prevent_community_privilege_escalation()
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

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderated_by    IS DISTINCT FROM OLD.moderated_by
     OR NEW.moderated_at    IS DISTINCT FROM OLD.moderated_at
     OR NEW.moderator_notes IS DISTINCT FROM OLD.moderator_notes
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.is_featured     IS DISTINCT FROM OLD.is_featured
     OR NEW.is_active       IS DISTINCT FROM OLD.is_active
  THEN
    RAISE EXCEPTION 'Not authorized to modify moderation, featured, or active status on communities.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_community_privilege_escalation ON public.communities;
CREATE TRIGGER trg_prevent_community_privilege_escalation
BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.prevent_community_privilege_escalation();


-- ─── 2. profile_causes / profile_skills: gate reads on profile visibility ──
-- Drop the permissive USING (true) policies.
DROP POLICY IF EXISTS profile_causes_select ON public.profile_causes;
DROP POLICY IF EXISTS profile_skills_select ON public.profile_skills;

-- Helper predicate: can the current session read this profile's associations?
--   - profile is public, OR
--   - viewer is the profile owner, OR
--   - viewer has an accepted connection with the profile owner.
CREATE OR REPLACE FUNCTION public.can_view_profile_associations(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _profile_id
      AND (
        p.is_public = true
        OR p.id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.connections c
          WHERE c.status = 'accepted'
            AND (
              (c.requester_id = auth.uid() AND c.recipient_id = p.id)
              OR (c.recipient_id = auth.uid() AND c.requester_id = p.id)
            )
        )
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_profile_associations(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.can_view_profile_associations(uuid) TO authenticated, service_role;

CREATE POLICY profile_causes_select
ON public.profile_causes
FOR SELECT
TO authenticated
USING (public.can_view_profile_associations(profile_id));

CREATE POLICY profile_skills_select
ON public.profile_skills
FOR SELECT
TO authenticated
USING (public.can_view_profile_associations(profile_id));
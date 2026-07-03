-- Opt-in contact visibility: owners who set allow_profile_sharing = true
-- expose email/phone/phone_number/whatsapp_number to any authenticated member.
-- Owner always sees their own.

CREATE OR REPLACE FUNCTION public.get_profile_contact(target_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  phone text,
  phone_number text,
  whatsapp_number text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    CASE WHEN p.id = caller OR COALESCE(p.allow_profile_sharing, false) THEN p.email END AS email,
    CASE WHEN p.id = caller OR COALESCE(p.allow_profile_sharing, false) THEN p.phone END AS phone,
    CASE WHEN p.id = caller OR COALESCE(p.allow_profile_sharing, false) THEN p.phone_number END AS phone_number,
    CASE WHEN p.id = caller OR COALESCE(p.allow_profile_sharing, false) THEN p.whatsapp_number END AS whatsapp_number
  FROM public.profiles p
  WHERE p.id = target_id
    AND (
      p.id = caller
      OR p.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
          AND (
            (c.requester_id = caller AND c.recipient_id = p.id)
            OR (c.recipient_id = caller AND c.requester_id = p.id)
          )
      )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_profile_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_contact(uuid) TO authenticated;

-- Sponsor contact fields: admin/service-role only
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon;
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM authenticated;
GRANT SELECT (contact_email, contact_name) ON public.sponsors TO service_role;

-- Roadmap sponsor contact email: admin/service-role only
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon;
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM authenticated;
GRANT SELECT (contact_email) ON public.roadmap_sponsors TO service_role;

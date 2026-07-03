-- Column-level revokes to lock down sensitive PII / editorial fields.
-- Owners retain access to their own contact info via a SECURITY DEFINER RPC.

-- 1) profiles: hide contact PII from other authenticated users
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM authenticated;
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM anon;

CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE (
  email text,
  phone text,
  phone_number text,
  whatsapp_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone, p.phone_number, p.whatsapp_number
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;

-- 2) advertisers: admins only for contact / billing / internal notes
REVOKE SELECT (contact_email, contact_name, billing_email, internal_notes)
  ON public.advertisers FROM authenticated;
REVOKE SELECT (contact_email, contact_name, billing_email, internal_notes)
  ON public.advertisers FROM anon;
GRANT SELECT (contact_email, contact_name, billing_email, internal_notes)
  ON public.advertisers TO service_role;

-- 3) communities: hide moderator editorial fields from public + authenticated
REVOKE SELECT (moderator_notes, rejection_reason, moderated_by, moderated_at)
  ON public.communities FROM anon;
REVOKE SELECT (moderator_notes, rejection_reason, moderated_by, moderated_at)
  ON public.communities FROM authenticated;
GRANT SELECT (moderator_notes, rejection_reason, moderated_by, moderated_at)
  ON public.communities TO service_role;


-- advertisers: business contact fields admin-only
REVOKE SELECT (contact_email, contact_phone, billing_email, internal_notes)
  ON public.advertisers FROM authenticated, anon;
GRANT  SELECT (contact_email, contact_phone, billing_email, internal_notes)
  ON public.advertisers TO service_role;

-- communities: moderator fields never public
REVOKE SELECT (rejection_reason, moderator_notes, moderated_by)
  ON public.communities FROM authenticated, anon;
GRANT  SELECT (rejection_reason, moderator_notes, moderated_by)
  ON public.communities TO service_role;

-- profiles: personal contact never RLS-exposed
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM authenticated, anon;
GRANT  SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles TO service_role;

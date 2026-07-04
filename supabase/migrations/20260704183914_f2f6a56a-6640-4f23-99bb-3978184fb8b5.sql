-- Security BD064: Lock down sensitive columns flagged by active RLS findings.
-- Idempotent REVOKE/GRANT; safe to re-run.

-- 1) advertisers: business contact PII admin/service only
REVOKE SELECT (contact_email, contact_name, billing_email, contact_phone)
  ON public.advertisers FROM authenticated, anon;
GRANT  SELECT (contact_email, contact_name, billing_email, contact_phone)
  ON public.advertisers TO service_role;

-- 2) communities: moderator editorial fields never public
REVOKE SELECT (rejection_reason, moderator_notes, moderated_by)
  ON public.communities FROM authenticated, anon;
GRANT  SELECT (rejection_reason, moderator_notes, moderated_by)
  ON public.communities TO service_role;

-- 3) profiles: personal contact fields never exposed via RLS
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM authenticated, anon;
GRANT  SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles TO service_role;

-- Lock down SECURITY DEFINER functions from anon
REVOKE EXECUTE ON FUNCTION public.enforce_comments_disabled() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) FROM PUBLIC, anon;

-- communities: hide moderation columns from anon/authenticated
REVOKE SELECT (rejection_reason, moderator_notes, moderated_by, moderated_at, moderation_status)
  ON public.communities FROM anon, authenticated;

-- profiles: hide contact fields from authenticated (and anon)
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM anon, authenticated;

-- roadmap_sponsors: hide contact_email
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon, authenticated;

-- sponsors: hide contact_email and contact_name
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon, authenticated;

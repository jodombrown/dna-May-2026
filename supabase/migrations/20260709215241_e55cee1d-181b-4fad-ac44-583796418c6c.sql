-- Revoke column-level SELECT on sensitive fields exposed by broad row-level policies.

-- profiles PII: contact info should be owner-only (already accessible via get_my_contact_info security-definer)
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon, authenticated;

-- communities: internal moderation fields must be admin-only, not exposed by public "is_active" read policy
REVOKE SELECT (moderator_notes, moderated_by, moderated_at, rejection_reason) ON public.communities FROM anon, authenticated;

-- roadmap_sponsors: contact_email must not leak via public sponsor listing
REVOKE SELECT (contact_email) ON public.roadmap_sponsors FROM anon, authenticated;

-- sponsors: contact_email and contact_name must not be readable by all authenticated users
REVOKE SELECT (contact_email, contact_name) ON public.sponsors FROM anon, authenticated;
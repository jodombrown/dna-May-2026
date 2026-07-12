
-- Revoke anon EXECUTE on SECURITY DEFINER functions that should never be
-- callable from an unauthenticated client. Trigger guards run automatically;
-- feed / profile / cleanup helpers require an authenticated caller.
REVOKE EXECUTE ON FUNCTION public.get_own_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_universal_feed(uuid, text, uuid, uuid, uuid, integer, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.organizations_prevent_self_verification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_community_privilege_escalation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_organization_privilege_escalation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_privilege_escalation_profiles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_privilege_escalation_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.profiles_prevent_privilege_escalation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.purge_expired_dia_history() FROM anon;
REVOKE EXECUTE ON FUNCTION public.space_members_prevent_role_escalation() FROM anon;

-- Drop the broad SELECT (listing) policy on the public event-images bucket.
-- Public buckets serve files via direct URL without RLS, so removing the
-- listing policy prevents enumeration without breaking image display.
DROP POLICY IF EXISTS "event_images_public_read" ON storage.objects;

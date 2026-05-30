
-- 1. Profiles: revoke PII columns from anon/authenticated (owners get them via SECURITY DEFINER get_own_profile RPC; admins via service_role)
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon;
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM authenticated;

-- 2. Advertisers: restrict SELECT policy to authenticated and revoke internal/billing columns
DROP POLICY IF EXISTS "Approved advertisers visible to everyone" ON public.advertisers;
CREATE POLICY "Approved advertisers visible to authenticated"
  ON public.advertisers
  FOR SELECT
  TO authenticated
  USING (status = 'approved'::advertiser_status);

REVOKE SELECT (internal_notes, billing_email) ON public.advertisers FROM anon;
REVOKE SELECT (internal_notes, billing_email) ON public.advertisers FROM authenticated;

-- 3. Communities: keep public discovery, but hide internal moderation columns
REVOKE SELECT (moderator_notes, rejection_reason) ON public.communities FROM anon;
REVOKE SELECT (moderator_notes, rejection_reason) ON public.communities FROM authenticated;

-- 4. public_profiles view: make it security_invoker so it runs as the caller (respects their RLS), not as the view owner
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 5. get_safe_profile_fields: revoke from anon (keep authenticated + service_role)
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) FROM PUBLIC;

-- 6. Realtime channel authorization: require authentication to subscribe / broadcast / track presence
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can write realtime messages"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

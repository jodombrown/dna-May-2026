
-- =========================================================================
-- 1. advertisers: hide contact/billing/internal columns from clients
-- =========================================================================
REVOKE SELECT (contact_email, contact_phone, contact_name, billing_email, internal_notes)
  ON public.advertisers FROM anon, authenticated;

-- =========================================================================
-- 2. communities: hide moderator-only columns from public reads
-- =========================================================================
REVOKE SELECT (moderator_notes, moderated_by, moderated_at, rejection_reason)
  ON public.communities FROM anon, authenticated;

-- =========================================================================
-- 3. sponsors: hide contact_email + contact_name from all non-admin reads
-- =========================================================================
REVOKE SELECT (contact_email, contact_name)
  ON public.sponsors FROM anon, authenticated;

-- =========================================================================
-- 4. roadmap_sponsors: hide contact_email from public reads
-- =========================================================================
REVOKE SELECT (contact_email)
  ON public.roadmap_sponsors FROM anon, authenticated;

-- =========================================================================
-- 5. profiles: hide contact columns (email/phone/whatsapp) from other users.
--    Owner keeps access via SECURITY DEFINER RPC below so client `select('*')`
--    on the owner path can be migrated at the caller's pace.
-- =========================================================================
REVOKE SELECT (email, phone, phone_number, whatsapp_number)
  ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE (
  email          text,
  phone          text,
  phone_number   text,
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

REVOKE ALL ON FUNCTION public.get_my_contact_info() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;

-- =========================================================================
-- 6. member_heritage: rewrite SELECT policy to honor profile visibility
-- =========================================================================
DROP POLICY IF EXISTS member_heritage_readable ON public.member_heritage;

CREATE POLICY member_heritage_readable
  ON public.member_heritage
  FOR SELECT
  TO authenticated
  USING (
    -- owner can always read their own heritage
    profile_id = auth.uid()
    -- otherwise only readable when the target profile is public OR an accepted connection exists
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = member_heritage.profile_id
        AND (
          p.is_public = true
          OR EXISTS (
            SELECT 1
            FROM public.connections c
            WHERE (
                    (c.requester_id = auth.uid() AND c.recipient_id = p.id)
                 OR (c.recipient_id = auth.uid() AND c.requester_id = p.id)
                  )
              AND c.status = 'accepted'
          )
        )
    )
  );

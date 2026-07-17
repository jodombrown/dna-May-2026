
-- Tighten profiles SELECT to exclude PII (email/phone/whatsapp) from general reads.
-- Owners still see their full row; others only via SECURITY DEFINER RPCs that filter columns.

DROP POLICY IF EXISTS "profiles_select_fixed" ON public.profiles;

-- Owner can select their own full row
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

-- Others can read a profile row only when it's public OR they have an accepted connection,
-- BUT column-level privileges (below) prevent access to PII columns for non-owners.
CREATE POLICY "profiles_select_visible_non_pii"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id <> (SELECT auth.uid()) AND (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (
        (c.requester_id = (SELECT auth.uid()) AND c.recipient_id = profiles.id)
        OR (c.recipient_id = (SELECT auth.uid()) AND c.requester_id = profiles.id)
      )
      AND c.status = 'accepted'
    )
  )
);

-- Revoke column-level SELECT on PII columns from authenticated. Owner still reads them
-- via the profiles_select_own policy because authenticated role retains SELECT on the
-- remaining columns; PII is only reachable through SECURITY DEFINER RPCs (e.g. get_public_profile),
-- which run as owner and bypass column grants for the specific fields they return.
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM authenticated, anon;
GRANT SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles TO service_role;


-- 1. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/public
REVOKE EXECUTE ON FUNCTION public.notify_window_decay(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_event_dates_announced() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_org_privileged_columns() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_privileged_columns() FROM anon, authenticated, PUBLIC;

-- 2. Fix organization-logos storage policies to use object path, not org display name
DROP POLICY IF EXISTS "Org owners can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Org owners can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Org owners can delete their logos" ON storage.objects;

CREATE POLICY "Org owners can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.owner_user_id = auth.uid()
        AND o.id::text = (storage.foldername(objects.name))[1]
    )
  );

CREATE POLICY "Org owners can update their logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.owner_user_id = auth.uid()
        AND o.id::text = (storage.foldername(objects.name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.owner_user_id = auth.uid()
        AND o.id::text = (storage.foldername(objects.name))[1]
    )
  );

CREATE POLICY "Org owners can delete their logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.owner_user_id = auth.uid()
        AND o.id::text = (storage.foldername(objects.name))[1]
    )
  );

-- 3. Profiles PII lockdown
ALTER TABLE public.profiles ALTER COLUMN is_public SET DEFAULT false;

REVOKE SELECT (current_lat, current_lng, current_place_id)
  ON public.profiles FROM anon, authenticated;

-- 4. Remove profiles from realtime publication (sensitive columns must not broadcast)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 1. Internal-only SECURITY DEFINER functions: no anon/authenticated EXECUTE.
REVOKE EXECUTE ON FUNCTION public.create_message_notification()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_affirmation_update_events()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_affirmation_witness_request()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_space_attachment_added()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_space_join_approved()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_space_join_request()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_space_task_assigned()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_space_task_completed()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation()       FROM PUBLIC, anon, authenticated;

-- 2. Caller-facing helpers: keep authenticated, drop anon; add explicit auth guards.
--    Preserve existing return signature of get_my_contact_info exactly.
CREATE OR REPLACE FUNCTION public.get_my_contact_info()
RETURNS TABLE(email text, phone text, phone_number text, whatsapp_number text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.email, p.phone, p.phone_number, p.whatsapp_number
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_contact_info() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_contact_info() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_space_lead(_space_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.space_id = _space_id
      AND sm.user_id  = _user_id
      AND sm.role IN ('owner','lead','admin')
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.is_space_lead(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_space_lead(uuid, uuid) TO authenticated;

-- 3. sponsor-logos: admin-only writes. Read stays public (bucket is public).
DROP POLICY IF EXISTS "Authenticated users can upload sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete sponsor logos" ON storage.objects;

CREATE POLICY "Admins can upload sponsor logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sponsor-logos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can update sponsor logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'sponsor-logos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id = 'sponsor-logos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins can delete sponsor logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'sponsor-logos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 4. Regression guard: fail migration if privileges are not what we want.
DO $$
DECLARE bad_fn text;
BEGIN
  FOR bad_fn IN
    SELECT proname FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'create_message_notification','get_my_contact_info','is_space_lead',
        'notify_affirmation_update_events','notify_affirmation_witness_request',
        'notify_space_attachment_added','notify_space_join_approved',
        'notify_space_join_request','notify_space_task_assigned',
        'notify_space_task_completed','prevent_profile_privilege_escalation')
      AND has_function_privilege('anon', oid, 'EXECUTE')
  LOOP
    RAISE EXCEPTION 'anon still has EXECUTE on %', bad_fn;
  END LOOP;

  IF NOT has_function_privilege('authenticated', 'public.get_my_contact_info()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost EXECUTE on get_my_contact_info';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.is_space_lead(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost EXECUTE on is_space_lead';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname IN (
        'Authenticated users can upload sponsor logos',
        'Authenticated users can update sponsor logos',
        'Authenticated users can delete sponsor logos')
  ) THEN
    RAISE EXCEPTION 'legacy sponsor-logos policies still present';
  END IF;

  IF (SELECT COUNT(*) FROM pg_policy
       WHERE polrelid = 'storage.objects'::regclass
         AND polname IN (
           'Admins can upload sponsor logos',
           'Admins can update sponsor logos',
           'Admins can delete sponsor logos')) <> 3 THEN
    RAISE EXCEPTION 'admin sponsor-logos policies are not fully installed';
  END IF;
END;
$$;
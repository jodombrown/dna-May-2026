
-- 1) Lock down privilege-adjacent columns on profiles self-update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
    AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND verified IS NOT DISTINCT FROM (SELECT p.verified FROM public.profiles p WHERE p.id = auth.uid())
    AND verification_status IS NOT DISTINCT FROM (SELECT p.verification_status FROM public.profiles p WHERE p.id = auth.uid())
    AND verification_method IS NOT DISTINCT FROM (SELECT p.verification_method FROM public.profiles p WHERE p.id = auth.uid())
    AND verified_at IS NOT DISTINCT FROM (SELECT p.verified_at FROM public.profiles p WHERE p.id = auth.uid())
    AND verification_updated_at IS NOT DISTINCT FROM (SELECT p.verification_updated_at FROM public.profiles p WHERE p.id = auth.uid())
    AND is_beta_tester IS NOT DISTINCT FROM (SELECT p.is_beta_tester FROM public.profiles p WHERE p.id = auth.uid())
    AND beta_phase IS NOT DISTINCT FROM (SELECT p.beta_phase FROM public.profiles p WHERE p.id = auth.uid())
    AND beta_expires_at IS NOT DISTINCT FROM (SELECT p.beta_expires_at FROM public.profiles p WHERE p.id = auth.uid())
    AND is_test_account IS NOT DISTINCT FROM (SELECT p.is_test_account FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admin override so platform admins can still adjust verification / beta state
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Mask sensitive PII columns from broad authenticated reads
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM authenticated;
REVOKE SELECT (email, phone, phone_number, whatsapp_number) ON public.profiles FROM anon;

-- SECURITY DEFINER helper: owner reads their own full row (incl. sensitive cols)
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- Admin helper: fetch contact fields by ids (used by moderation/analytics dashboards)
CREATE OR REPLACE FUNCTION public.admin_get_profile_contacts(p_ids uuid[])
RETURNS TABLE (id uuid, full_name text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE p.id = ANY(p_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_profile_contacts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_profile_contacts(uuid[]) TO authenticated;

-- Admin helper: search profiles (full row) for the user-management screen
CREATE OR REPLACE FUNCTION public.admin_search_profiles(p_query text, p_limit int DEFAULT 100)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.profiles
    WHERE p_query IS NULL OR p_query = ''
       OR email ILIKE '%' || p_query || '%'
       OR full_name ILIKE '%' || p_query || '%'
       OR username ILIKE '%' || p_query || '%'
    ORDER BY created_at DESC
    LIMIT COALESCE(p_limit, 100);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_search_profiles(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text, int) TO authenticated;

-- 3) Tighten roadmap_attendees insert: bind authenticated inserts to caller
DROP POLICY IF EXISTS attendees_public_insert ON public.roadmap_attendees;
CREATE POLICY attendees_public_insert
  ON public.roadmap_attendees
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

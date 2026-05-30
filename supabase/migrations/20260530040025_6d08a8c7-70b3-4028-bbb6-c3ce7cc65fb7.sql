-- 1. Lock down profiles UPDATE: prevent self-promotion via is_admin/role columns
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
);

-- 2. Fix SECURITY DEFINER view: enforce caller (invoker) privileges on public_profiles
ALTER VIEW public.public_profiles SET (security_invoker = true);
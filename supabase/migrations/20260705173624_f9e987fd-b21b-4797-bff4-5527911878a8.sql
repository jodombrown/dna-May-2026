
-- 1) communities: restrict moderator-only columns to service_role
REVOKE SELECT ON public.communities FROM anon, authenticated;
GRANT SELECT (
  id, name, description, category, member_count, is_featured, image_url,
  created_by, created_at, updated_at, is_active, cover_image_url,
  purpose_goals, tags
) ON public.communities TO anon, authenticated;

-- 2) roadmap_sponsors: hide contact_email from anon/authenticated
REVOKE SELECT ON public.roadmap_sponsors FROM anon, authenticated;
GRANT SELECT (
  id, edition_year, name, slug, tier, logo_url, blurb, website_url,
  cta_label, cta_url, display_order, is_published, created_at, updated_at
) ON public.roadmap_sponsors TO anon, authenticated;

-- 3) profiles.is_admin: block users from writing this column via PostgREST
REVOKE UPDATE (is_admin) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_non_admin_is_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change is_admin' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_non_admin_is_admin_change ON public.profiles;
CREATE TRIGGER trg_prevent_non_admin_is_admin_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_admin_is_admin_change();

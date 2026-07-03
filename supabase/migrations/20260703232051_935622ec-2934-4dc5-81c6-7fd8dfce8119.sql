-- Communities: strip moderator-only columns from anon/authenticated column privileges.
REVOKE SELECT ON public.communities FROM anon, authenticated;

GRANT SELECT (
  id, name, description, category, member_count, is_featured, image_url,
  created_by, created_at, updated_at, is_active, cover_image_url,
  purpose_goals, tags
) ON public.communities TO anon, authenticated;

-- Roadmap sponsors: strip contact_email from anon/authenticated column privileges.
REVOKE SELECT ON public.roadmap_sponsors FROM anon, authenticated;

GRANT SELECT (
  id, edition_year, name, slug, tier, logo_url, blurb, website_url,
  cta_label, cta_url, display_order, is_published, created_at, updated_at
) ON public.roadmap_sponsors TO anon, authenticated;
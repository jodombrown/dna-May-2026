GRANT SELECT (
  id, name, description, category, member_count, is_featured,
  image_url, cover_image_url, purpose_goals, tags,
  moderation_status, is_active, created_at, updated_at
) ON public.communities TO anon, authenticated;
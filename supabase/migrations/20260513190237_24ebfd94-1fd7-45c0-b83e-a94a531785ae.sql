CREATE OR REPLACE FUNCTION public.get_trending_hashtags(p_time_range text DEFAULT '24h'::text, p_limit integer DEFAULT 8)
 RETURNS TABLE(hashtag text, post_count bigint, unique_authors bigint, is_followed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interval INTERVAL;
  v_user_id UUID := auth.uid();
BEGIN
  v_interval := CASE p_time_range
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;
  RETURN QUERY
  SELECT h.tag AS hashtag,
    COUNT(DISTINCT ph.post_id)::BIGINT AS post_count,
    COUNT(DISTINCT p.author_id)::BIGINT AS unique_authors,
    EXISTS(
      SELECT 1 FROM public.trend_follows tf
      WHERE tf.user_id = v_user_id AND tf.hashtag = h.tag
    ) AS is_followed
  FROM public.post_hashtags ph
  JOIN public.hashtags h ON h.id = ph.hashtag_id
  JOIN public.posts p ON p.id = ph.post_id
  WHERE p.created_at > now() - v_interval
    AND p.visibility = 'public'
  GROUP BY h.tag
  ORDER BY COUNT(DISTINCT ph.post_id) DESC, COUNT(DISTINCT p.author_id) DESC
  LIMIT p_limit;
END;
$function$;
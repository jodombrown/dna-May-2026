
-- BD088 — get_universal_feed parity repair. Preserves existing 9-arg signature,
-- FROM/JOIN/WHERE/ORDER BY logic verbatim; adds 10 new return columns.

DROP FUNCTION IF EXISTS public.get_universal_feed(uuid, text, uuid, uuid, uuid, integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.get_universal_feed(
  p_viewer_id uuid,
  p_tab text DEFAULT 'all',
  p_author_id uuid DEFAULT NULL,
  p_space_id uuid DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_ranking_mode text DEFAULT 'latest',
  p_hashtag text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, author_id uuid, author_username text, author_full_name text,
  author_avatar_url text, author_headline text, content text, title text,
  subtitle text, post_type text, privacy_level text, image_url text,
  gallery_urls text[], link_url text, link_title text, link_description text,
  link_metadata jsonb, linked_entity_type text, linked_entity_id uuid,
  space_id uuid, event_id uuid, created_at timestamptz, updated_at timestamptz,
  likes_count bigint, comments_count bigint, user_has_liked boolean,
  user_has_bookmarked boolean, original_post_id uuid, original_author_id uuid,
  original_author_username text, original_author_full_name text,
  original_author_avatar_url text, original_author_headline text,
  original_content text, original_image_url text, original_created_at timestamptz,
  slug text, metadata jsonb,
  -- NEW: engagement + story
  story_type text, view_count integer, reshare_count integer,
  bookmark_count integer, has_reshared boolean, comments_disabled boolean,
  -- NEW: Collaborate facets
  member_count integer, country_count integer, roles_needed jsonb, progress_pct integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hashtag_norm text := NULLIF(lower(regexp_replace(COALESCE(p_hashtag, ''), '^#', '')), '');
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.author_id, prof.username, prof.full_name, prof.avatar_url, prof.headline,
    p.content, p.title, p.subtitle, p.post_type, p.privacy_level,
    p.image_url, p.gallery_urls,
    p.link_url, p.link_title, p.link_description, p.link_metadata,
    p.linked_entity_type, p.linked_entity_id, p.space_id, p.event_id,
    p.created_at, p.updated_at,
    COALESCE(likes.like_count, 0)::bigint,
    COALESCE(comments.comment_count, 0)::bigint,
    EXISTS(SELECT 1 FROM post_reactions pr WHERE pr.post_id = p.id AND pr.user_id = p_viewer_id),
    EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = p_viewer_id),
    p.original_post_id,
    op.author_id, op_prof.username, op_prof.full_name, op_prof.avatar_url, op_prof.headline,
    op.content, op.image_url, op.created_at,
    p.slug,
    p.metadata,
    -- NEW engagement + story
    p.story_type,
    COALESCE(p.view_count, 0),
    (SELECT count(*)::integer FROM posts rp WHERE rp.original_post_id = p.id AND rp.is_deleted = FALSE),
    (SELECT count(*)::integer FROM post_bookmarks pb2 WHERE pb2.post_id = p.id),
    EXISTS(SELECT 1 FROM posts rp2 WHERE rp2.original_post_id = p.id AND rp2.author_id = p_viewer_id AND rp2.is_deleted = FALSE),
    COALESCE(p.comments_disabled, false),
    -- NEW Collaborate facets (NULL for non-space posts)
    CASE WHEN p.space_id IS NOT NULL THEN
      (SELECT count(*)::integer FROM space_members sm
        WHERE sm.space_id = p.space_id AND sm.status = 'active')
    END,
    CASE WHEN p.space_id IS NOT NULL THEN
      (SELECT count(DISTINCT pr2.current_country_code)::integer
         FROM space_members sm2
         JOIN profiles pr2 ON pr2.id = sm2.user_id
        WHERE sm2.space_id = p.space_id
          AND sm2.status = 'active'
          AND pr2.current_country_code IS NOT NULL)
    END,
    CASE WHEN p.space_id IS NOT NULL THEN
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', sr.id, 'title', sr.title) ORDER BY sr.order_index), '[]'::jsonb)
         FROM space_roles sr
        WHERE sr.space_id = p.space_id)
    END,
    CASE WHEN p.space_id IS NOT NULL THEN
      (SELECT CASE WHEN count(*) = 0 THEN NULL
                   ELSE (count(*) FILTER (WHERE st.status = 'done') * 100 / count(*))::integer
              END
         FROM space_tasks st
        WHERE st.space_id = p.space_id)
    END
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN posts op ON p.original_post_id = op.id
  LEFT JOIN profiles op_prof ON op.author_id = op_prof.id
  LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM post_reactions GROUP BY post_id) likes ON p.id = likes.post_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM post_comments WHERE is_deleted = FALSE GROUP BY post_id) comments ON p.id = comments.post_id
  WHERE p.is_deleted = FALSE
    AND (p_author_id IS NULL OR p.author_id = p_author_id)
    AND (p_space_id IS NULL OR p.space_id = p_space_id)
    AND (p_event_id IS NULL OR p.event_id = p_event_id)
    AND (
      v_hashtag_norm IS NULL
      OR EXISTS (SELECT 1 FROM post_hashtags ph JOIN hashtags h ON h.id = ph.hashtag_id WHERE ph.post_id = p.id AND lower(h.tag) = v_hashtag_norm)
    )
    AND (
      CASE
        WHEN p_tab = 'all' THEN
          (p.privacy_level = 'public')
          OR (p.author_id = p_viewer_id)
          OR (p.privacy_level = 'connections' AND EXISTS(
            SELECT 1 FROM connections c
            WHERE ((c.requester_id = p_viewer_id AND c.recipient_id = p.author_id)
               OR  (c.recipient_id = p_viewer_id AND c.requester_id = p.author_id))
              AND c.status = 'accepted'))
        WHEN p_tab = 'for_you' THEN
          (p.privacy_level = 'public')
          OR (p.author_id = p_viewer_id)
          OR EXISTS(SELECT 1 FROM connections c
            WHERE ((c.requester_id = p_viewer_id AND c.recipient_id = p.author_id)
               OR  (c.recipient_id = p_viewer_id AND c.requester_id = p.author_id))
              AND c.status = 'accepted')
        WHEN p_tab = 'network' THEN
          EXISTS(SELECT 1 FROM connections c
            WHERE ((c.requester_id = p_viewer_id AND c.recipient_id = p.author_id)
               OR  (c.recipient_id = p_viewer_id AND c.requester_id = p.author_id))
              AND c.status = 'accepted')
        WHEN p_tab = 'my_posts' THEN p.author_id = p_viewer_id
        WHEN p_tab = 'bookmarks' THEN
          EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = p_viewer_id)
        ELSE (p.privacy_level = 'public')
      END
    )
  ORDER BY
    CASE WHEN p_ranking_mode = 'top' THEN COALESCE(likes.like_count, 0) END DESC NULLS LAST,
    p.created_at DESC
  LIMIT COALESCE(p_limit, 20)
  OFFSET COALESCE(p_offset, 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_universal_feed(uuid, text, uuid, uuid, uuid, integer, integer, text, text) TO authenticated;

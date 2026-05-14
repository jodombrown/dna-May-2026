
-- Tier 3: global inbox search across message bodies.
-- Returns matching message snippets the calling user can see, grouped by conversation.
CREATE OR REPLACE FUNCTION public.search_inbox_messages(
  p_query text,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  conversation_id uuid,
  message_id uuid,
  snippet text,
  created_at timestamptz,
  is_group boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  q text;
BEGIN
  IF uid IS NULL OR p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;
  q := '%' || trim(p_query) || '%';

  -- 1:1 messages the user participates in
  RETURN QUERY
  SELECT
    m.conversation_id,
    m.id AS message_id,
    substring(m.content from 1 for 240) AS snippet,
    m.created_at,
    false AS is_group
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.user_a = uid OR c.user_b = uid)
    AND m.content ILIKE q
    AND coalesce(m.is_unsent, false) = false
  ORDER BY m.created_at DESC
  LIMIT p_limit;

  -- Group messages where the user is a participant
  RETURN QUERY
  SELECT
    gm.conversation_id,
    gm.id AS message_id,
    substring(gm.content from 1 for 240) AS snippet,
    gm.created_at,
    true AS is_group
  FROM public.group_messages gm
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = gm.conversation_id
      AND cp.user_id = uid
      AND coalesce(cp.has_left, false) = false
  )
    AND gm.content ILIKE q
    AND coalesce(gm.is_unsent, false) = false
  ORDER BY gm.created_at DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_inbox_messages(text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.search_inbox_messages(text, int) TO authenticated;

-- 1) Per-participant flags for group conversations
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_pinned   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_muted    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON public.conversation_participants(user_id);

-- 2) Updated group conversations list with preview + flags
CREATE OR REPLACE FUNCTION public.get_group_conversations_for_user(
  p_include_archived boolean DEFAULT false
)
RETURNS TABLE(
  conversation_id uuid,
  title text,
  description text,
  avatar_url text,
  conversation_type text,
  created_by uuid,
  created_at timestamptz,
  last_message_at timestamptz,
  participant_count bigint,
  unread_count integer,
  last_message_preview text,
  last_sender_name text,
  is_pinned boolean,
  is_muted boolean,
  is_archived boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH last_msg AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content,
      m.sender_id,
      m.created_at
    FROM messages_new m
    WHERE m.is_deleted = false
    ORDER BY m.conversation_id, m.created_at DESC
  )
  SELECT
    c.id,
    c.title,
    c.description,
    c.avatar_url,
    c.conversation_type,
    c.created_by,
    c.created_at,
    c.last_message_at,
    (SELECT count(*) FROM conversation_participants cp2 WHERE cp2.conversation_id = c.id) AS participant_count,
    public.get_group_unread_count(c.id) AS unread_count,
    lm.content AS last_message_preview,
    p.full_name AS last_sender_name,
    cp.is_pinned,
    cp.is_muted,
    cp.is_archived
  FROM conversations_new c
  JOIN conversation_participants cp
    ON cp.conversation_id = c.id AND cp.user_id = auth.uid()
  LEFT JOIN last_msg lm ON lm.conversation_id = c.id
  LEFT JOIN profiles p ON p.id = lm.sender_id
  WHERE c.conversation_type = 'group'
    AND (p_include_archived OR cp.is_archived = false)
  ORDER BY cp.is_pinned DESC, c.last_message_at DESC NULLS LAST;
END;
$$;

-- 3) Per-user pin/mute/archive RPCs for group conversations
CREATE OR REPLACE FUNCTION public.set_group_conversation_pin(
  p_conversation_id uuid,
  p_pinned boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE conversation_participants
     SET is_pinned = p_pinned
   WHERE conversation_id = p_conversation_id
     AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_group_conversation_mute(
  p_conversation_id uuid,
  p_muted boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE conversation_participants
     SET is_muted = p_muted
   WHERE conversation_id = p_conversation_id
     AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_group_conversation_archive(
  p_conversation_id uuid,
  p_archived boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE conversation_participants
     SET is_archived = p_archived
   WHERE conversation_id = p_conversation_id
     AND user_id = auth.uid();
END;
$$;

-- 4) Unified inbox RPC: returns both 1:1 and group rows in one query
CREATE OR REPLACE FUNCTION public.get_inbox_for_user(
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0,
  p_include_archived boolean DEFAULT false
)
RETURNS TABLE(
  conversation_id uuid,
  is_group boolean,
  -- 1:1 fields
  other_user_id uuid,
  other_user_username text,
  other_user_full_name text,
  other_user_avatar_url text,
  -- group fields
  group_title text,
  group_avatar_url text,
  participant_count bigint,
  -- shared
  last_message_preview text,
  last_message_at timestamptz,
  last_sender_name text,
  unread_count integer,
  is_pinned boolean,
  is_muted boolean,
  is_archived boolean,
  bucket text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  -- 1:1 conversations
  WITH direct AS (
    SELECT
      c.id AS conversation_id,
      false AS is_group,
      CASE WHEN c.user_a = v_uid THEN c.user_b ELSE c.user_a END AS other_user_id,
      c.last_message_at,
      CASE WHEN c.user_a = v_uid THEN c.is_pinned_by_a   ELSE c.is_pinned_by_b   END AS is_pinned,
      CASE WHEN c.user_a = v_uid THEN c.is_muted_by_a    ELSE c.is_muted_by_b    END AS is_muted,
      CASE WHEN c.user_a = v_uid THEN c.is_archived_by_a ELSE c.is_archived_by_b END AS is_archived,
      CASE WHEN c.user_a = v_uid THEN c.deleted_by_a     ELSE c.deleted_by_b     END AS is_deleted,
      COALESCE(
        CASE WHEN c.user_a = v_uid THEN c.bucket_for_a ELSE c.bucket_for_b END,
        'primary'
      ) AS bucket
    FROM conversations c
    WHERE c.user_a = v_uid OR c.user_b = v_uid
  ),
  direct_filtered AS (
    SELECT * FROM direct
    WHERE is_deleted = false
      AND (p_include_archived OR is_archived = false)
  ),
  direct_last AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.content, m.sender_id, m.created_at
    FROM messages m
    WHERE m.conversation_id IN (SELECT conversation_id FROM direct_filtered)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  direct_unread AS (
    SELECT cp.conversation_id,
      (SELECT count(*) FROM messages mm
        WHERE mm.conversation_id = cp.conversation_id
          AND mm.sender_id <> v_uid
          AND (cp.last_read_at IS NULL OR mm.created_at > cp.last_read_at)
      )::int AS unread_count
    FROM conversation_participants cp
    WHERE cp.user_id = v_uid
      AND cp.conversation_id IN (SELECT conversation_id FROM direct_filtered)
  ),
  direct_rows AS (
    SELECT
      df.conversation_id,
      df.is_group,
      df.other_user_id,
      p.username AS other_user_username,
      p.full_name AS other_user_full_name,
      p.avatar_url AS other_user_avatar_url,
      NULL::text AS group_title,
      NULL::text AS group_avatar_url,
      0::bigint AS participant_count,
      dl.content AS last_message_preview,
      df.last_message_at,
      NULL::text AS last_sender_name,
      COALESCE(du.unread_count, 0) AS unread_count,
      df.is_pinned,
      df.is_muted,
      df.is_archived,
      df.bucket
    FROM direct_filtered df
    LEFT JOIN profiles p ON p.id = df.other_user_id
    LEFT JOIN direct_last dl ON dl.conversation_id = df.conversation_id
    LEFT JOIN direct_unread du ON du.conversation_id = df.conversation_id
  ),
  -- group conversations (reuse the new RPC's logic inline)
  group_last AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.content, m.sender_id, m.created_at
    FROM messages_new m
    WHERE m.is_deleted = false
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  group_rows AS (
    SELECT
      c.id AS conversation_id,
      true AS is_group,
      NULL::uuid AS other_user_id,
      NULL::text AS other_user_username,
      NULL::text AS other_user_full_name,
      NULL::text AS other_user_avatar_url,
      c.title AS group_title,
      c.avatar_url AS group_avatar_url,
      (SELECT count(*) FROM conversation_participants cp2 WHERE cp2.conversation_id = c.id) AS participant_count,
      gl.content AS last_message_preview,
      c.last_message_at,
      sp.full_name AS last_sender_name,
      public.get_group_unread_count(c.id) AS unread_count,
      cp.is_pinned,
      cp.is_muted,
      cp.is_archived,
      'primary'::text AS bucket
    FROM conversations_new c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = v_uid
    LEFT JOIN group_last gl ON gl.conversation_id = c.id
    LEFT JOIN profiles sp ON sp.id = gl.sender_id
    WHERE c.conversation_type = 'group'
      AND (p_include_archived OR cp.is_archived = false)
  )
  SELECT * FROM direct_rows
  UNION ALL
  SELECT * FROM group_rows
  ORDER BY is_pinned DESC, last_message_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_conversations_for_user(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_conversation_pin(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_conversation_mute(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_conversation_archive(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inbox_for_user(int, int, boolean) TO authenticated;
-- =====================================================
-- Phase 5: Group messaging parity (edit/unsend/forward/star/mentions/role/mute/transfer/leave)
-- =====================================================

-- 1. messages_new: edit/unsend/forward columns
ALTER TABLE public.messages_new
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS forwarded_from_message_id uuid REFERENCES public.messages_new(id) ON DELETE SET NULL;

-- Allow empty content (unsend + media-only)
ALTER TABLE public.messages_new
  DROP CONSTRAINT IF EXISTS messages_new_content_check;

-- 2. conversation_participants: role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='conversation_participants' AND column_name='role') THEN
    ALTER TABLE public.conversation_participants
      ADD COLUMN role text NOT NULL DEFAULT 'member';
  END IF;
END $$;

ALTER TABLE public.conversation_participants
  DROP CONSTRAINT IF EXISTS conversation_participants_role_check;
ALTER TABLE public.conversation_participants
  ADD CONSTRAINT conversation_participants_role_check
  CHECK (role IN ('owner','admin','member'));

-- Backfill: creators -> owner
UPDATE public.conversation_participants cp
SET role = 'owner'
FROM public.conversations_new c
WHERE cp.conversation_id = c.id
  AND cp.user_id = c.created_by
  AND cp.role <> 'owner';

CREATE INDEX IF NOT EXISTS idx_conversation_participants_role
  ON public.conversation_participants(conversation_id, role);

-- 3. Group message mentions
CREATE TABLE IF NOT EXISTS public.group_message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages_new(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations_new(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_msg_mentions_user
  ON public.group_message_mentions(mentioned_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_msg_mentions_conv
  ON public.group_message_mentions(conversation_id);

ALTER TABLE public.group_message_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own group mentions" ON public.group_message_mentions;
CREATE POLICY "Users view own group mentions" ON public.group_message_mentions
  FOR SELECT USING (mentioned_user_id = auth.uid());

DROP POLICY IF EXISTS "Senders insert group mentions" ON public.group_message_mentions;
CREATE POLICY "Senders insert group mentions" ON public.group_message_mentions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.messages_new m
            WHERE m.id = message_id AND m.sender_id = auth.uid())
  );

-- 4. Group starred messages
CREATE TABLE IF NOT EXISTS public.group_starred_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.messages_new(id) ON DELETE CASCADE,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_group_starred_messages_user
  ON public.group_starred_messages(user_id, created_at DESC);

ALTER TABLE public.group_starred_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own group stars" ON public.group_starred_messages;
CREATE POLICY "Users view own group stars" ON public.group_starred_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own group stars" ON public.group_starred_messages;
CREATE POLICY "Users create own group stars" ON public.group_starred_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own group stars" ON public.group_starred_messages;
CREATE POLICY "Users delete own group stars" ON public.group_starred_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RPC: edit_group_message
CREATE OR REPLACE FUNCTION public.edit_group_message(
  p_message_id uuid,
  p_new_content text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_sender uuid; v_created timestamptz;
BEGIN
  SELECT sender_id, created_at INTO v_sender, v_created
  FROM messages_new WHERE id = p_message_id;

  IF v_sender IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF v_sender <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF v_created < now() - interval '15 minutes' THEN RAISE EXCEPTION 'Edit window expired'; END IF;

  UPDATE messages_new
  SET content = p_new_content,
      edited_at = now()
  WHERE id = p_message_id;
END;
$$;

-- 6. RPC: unsend_group_message
CREATE OR REPLACE FUNCTION public.unsend_group_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_sender uuid;
BEGIN
  SELECT sender_id INTO v_sender FROM messages_new WHERE id = p_message_id;
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF v_sender <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;

  UPDATE messages_new
  SET deleted_at = now(),
      content = '',
      is_deleted = true
  WHERE id = p_message_id;
END;
$$;

-- 7. RPC: forward_group_message
CREATE OR REPLACE FUNCTION public.forward_group_message(
  p_source_message_id uuid,
  p_target_conversation_id uuid,
  p_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_src RECORD;
  v_new_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Caller must be in target conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_target_conversation_id AND user_id = v_uid
  ) THEN RAISE EXCEPTION 'Not a participant of target conversation'; END IF;

  SELECT id, content FROM messages_new WHERE id = p_source_message_id INTO v_src;
  IF v_src.id IS NULL THEN RAISE EXCEPTION 'Source message not found'; END IF;

  INSERT INTO messages_new (conversation_id, sender_id, content, forwarded_from_message_id)
  VALUES (
    p_target_conversation_id,
    v_uid,
    COALESCE(NULLIF(p_note, ''), v_src.content, ''),
    p_source_message_id
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 8. RPC: record_group_mentions (batch)
CREATE OR REPLACE FUNCTION public.record_group_mentions(
  p_message_id uuid,
  p_user_ids uuid[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv uuid;
  v_sender uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT conversation_id, sender_id INTO v_conv, v_sender
  FROM messages_new WHERE id = p_message_id;
  IF v_conv IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF v_sender <> v_uid THEN RAISE EXCEPTION 'Not allowed'; END IF;

  INSERT INTO group_message_mentions (message_id, conversation_id, mentioned_user_id)
  SELECT p_message_id, v_conv, u
  FROM unnest(p_user_ids) AS u
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = v_conv AND cp.user_id = u
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- 9. RPC: set_group_mute
CREATE OR REPLACE FUNCTION public.set_group_mute(
  p_conversation_id uuid,
  p_muted boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE conversation_participants
  SET is_muted = p_muted
  WHERE conversation_id = p_conversation_id AND user_id = v_uid;
END;
$$;

-- 10. RPC: transfer_group_ownership
CREATE OR REPLACE FUNCTION public.transfer_group_ownership(
  p_conversation_id uuid,
  p_new_owner_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = v_uid
      AND role = 'owner'
  ) THEN RAISE EXCEPTION 'Only the owner can transfer ownership'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_new_owner_id
      AND COALESCE(status,'active') = 'active'
  ) THEN RAISE EXCEPTION 'Target user is not an active participant'; END IF;

  UPDATE conversation_participants
  SET role = 'admin'
  WHERE conversation_id = p_conversation_id AND user_id = v_uid;

  UPDATE conversation_participants
  SET role = 'owner'
  WHERE conversation_id = p_conversation_id AND user_id = p_new_owner_id;

  UPDATE conversations_new
  SET created_by = p_new_owner_id
  WHERE id = p_conversation_id;
END;
$$;

-- 11. RPC: leave_group_conversation (owner must transfer first)
CREATE OR REPLACE FUNCTION public.leave_group_conversation(
  p_conversation_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT role INTO v_role FROM conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id = v_uid;

  IF v_role IS NULL THEN RAISE EXCEPTION 'Not a participant'; END IF;
  IF v_role = 'owner' THEN
    RAISE EXCEPTION 'Owner must transfer ownership before leaving';
  END IF;

  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.edit_group_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsend_group_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forward_group_message(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_group_mentions(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_mute(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group_conversation(uuid) TO authenticated;
-- Phase 2: edit, unsend, forward, star

-- 1. Forward column on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS forwarded_from_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- 2. Starred messages
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_messages_user
  ON public.starred_messages(user_id, created_at DESC);

ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own stars" ON public.starred_messages;
CREATE POLICY "Users view own stars" ON public.starred_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own stars" ON public.starred_messages;
CREATE POLICY "Users create own stars" ON public.starred_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own stars" ON public.starred_messages;
CREATE POLICY "Users delete own stars" ON public.starred_messages
  FOR DELETE USING (auth.uid() = user_id);

-- 3. RPC: edit_message (15-min window, sender only)
CREATE OR REPLACE FUNCTION public.edit_message(
  p_message_id uuid,
  p_new_content text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sender uuid;
  v_created timestamptz;
BEGIN
  SELECT sender_id, created_at INTO v_sender, v_created
  FROM messages WHERE id = p_message_id;

  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF v_sender <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF v_created < now() - interval '15 minutes' THEN
    RAISE EXCEPTION 'Edit window expired';
  END IF;

  UPDATE messages
  SET content = p_new_content,
      edited_at = now()
  WHERE id = p_message_id;
END;
$$;

-- 4. RPC: unsend_message (sender only, soft delete)
CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sender uuid;
BEGIN
  SELECT sender_id INTO v_sender FROM messages WHERE id = p_message_id;
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF v_sender <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE messages
  SET deleted_at = now(),
      content = ''
  WHERE id = p_message_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsend_message(uuid) TO authenticated;
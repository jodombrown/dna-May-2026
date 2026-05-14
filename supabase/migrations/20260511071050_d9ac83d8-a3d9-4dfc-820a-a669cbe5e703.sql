
-- ============================================================
-- Phase 1: Receipts, Presence, Client-ID dedupe
-- ============================================================

-- 1) Add client_id to messages for optimistic-send dedupe
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS client_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_id_uniq
  ON public.messages (sender_id, client_id)
  WHERE client_id IS NOT NULL;

-- 2) Privacy toggles on profiles (last_seen_at already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_presence boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_read_receipts boolean NOT NULL DEFAULT true;

-- 3) Per-recipient delivery + read receipts
CREATE TABLE IF NOT EXISTS public.message_receipts (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS message_receipts_user_unread_idx
  ON public.message_receipts (user_id, conversation_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS message_receipts_message_idx
  ON public.message_receipts (message_id);

ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

-- Sender of the message OR the recipient row owner can read receipts
CREATE POLICY "Receipts visible to sender or recipient"
  ON public.message_receipts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

-- Only the recipient can update their own receipt (mark delivered/read)
CREATE POLICY "Recipients update own receipt"
  ON public.message_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4) Trigger: fan out a receipt row per other participant on new message
CREATE OR REPLACE FUNCTION public.create_message_receipts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.message_receipts (message_id, user_id, conversation_id)
  SELECT NEW.id, cp.user_id, NEW.conversation_id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id <> NEW.sender_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_create_receipts ON public.messages;
CREATE TRIGGER messages_create_receipts
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.create_message_receipts();

-- 5) Mark conversation as read RPC: bumps last_read_at AND fills read_at on receipts
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.conversation_participants
  SET last_read_at = _now
  WHERE conversation_id = _conversation_id
    AND user_id = auth.uid();

  UPDATE public.message_receipts
  SET read_at = COALESCE(read_at, _now),
      delivered_at = COALESCE(delivered_at, _now)
  WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- 6) Update presence (last_seen_at) - lightweight, called on focus/heartbeat
CREATE OR REPLACE FUNCTION public.update_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_presence() TO authenticated;

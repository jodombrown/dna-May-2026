
DROP FUNCTION IF EXISTS public.are_users_connected(uuid, uuid);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS bucket_for_a text NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS bucket_for_b text NOT NULL DEFAULT 'primary';

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_bucket_for_a_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_bucket_for_a_check
  CHECK (bucket_for_a IN ('primary','requests','spam'));

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_bucket_for_b_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_bucket_for_b_check
  CHECK (bucket_for_b IN ('primary','requests','spam'));

CREATE INDEX IF NOT EXISTS idx_conversations_bucket_a ON public.conversations(user_a, bucket_for_a);
CREATE INDEX IF NOT EXISTS idx_conversations_bucket_b ON public.conversations(user_b, bucket_for_b);

CREATE OR REPLACE FUNCTION public.are_users_connected(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((requester_id = _a AND recipient_id = _b)
        OR (requester_id = _b AND recipient_id = _a))
  );
$$;

CREATE OR REPLACE FUNCTION public.route_first_message_to_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conv RECORD; v_count int; v_recipient uuid; v_connected boolean;
BEGIN
  SELECT id, user_a, user_b INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_conv.id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.messages WHERE conversation_id = NEW.conversation_id;
  IF v_count > 1 THEN RETURN NEW; END IF;
  v_recipient := CASE WHEN NEW.sender_id = v_conv.user_a THEN v_conv.user_b ELSE v_conv.user_a END;
  v_connected := public.are_users_connected(NEW.sender_id, v_recipient);
  IF v_connected THEN RETURN NEW; END IF;
  IF v_recipient = v_conv.user_a THEN
    UPDATE public.conversations SET bucket_for_a = 'requests' WHERE id = v_conv.id AND bucket_for_a = 'primary';
  ELSE
    UPDATE public.conversations SET bucket_for_b = 'requests' WHERE id = v_conv.id AND bucket_for_b = 'primary';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_route_first_message_to_requests ON public.messages;
CREATE TRIGGER trg_route_first_message_to_requests
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.route_first_message_to_requests();

CREATE OR REPLACE FUNCTION public.set_conversation_bucket(_conversation_id uuid, _bucket text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_conv RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _bucket NOT IN ('primary','requests','spam') THEN RAISE EXCEPTION 'Invalid bucket'; END IF;
  SELECT id, user_a, user_b INTO v_conv FROM public.conversations WHERE id = _conversation_id;
  IF v_conv.id IS NULL THEN RAISE EXCEPTION 'Conversation not found'; END IF;
  IF v_uid = v_conv.user_a THEN
    UPDATE public.conversations SET bucket_for_a = _bucket WHERE id = _conversation_id;
  ELSIF v_uid = v_conv.user_b THEN
    UPDATE public.conversations SET bucket_for_b = _bucket WHERE id = _conversation_id;
  ELSE RAISE EXCEPTION 'Not a participant'; END IF;
END; $$;

CREATE TABLE IF NOT EXISTS public.message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_mentions_user ON public.message_mentions(mentioned_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_mentions_conv ON public.message_mentions(conversation_id);

ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mentions" ON public.message_mentions;
CREATE POLICY "Users can view their own mentions" ON public.message_mentions
  FOR SELECT USING (mentioned_user_id = auth.uid());

DROP POLICY IF EXISTS "Senders can insert mentions" ON public.message_mentions;
CREATE POLICY "Senders can insert mentions" ON public.message_mentions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
  );

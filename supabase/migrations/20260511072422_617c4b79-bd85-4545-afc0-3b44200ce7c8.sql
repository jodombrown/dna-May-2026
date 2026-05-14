ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at_alive
  ON public.messages(conversation_id, created_at)
  WHERE deleted_at IS NULL;
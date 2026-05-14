ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS summary_payload jsonb,
  ADD COLUMN IF NOT EXISTS last_summarised_message_id uuid;
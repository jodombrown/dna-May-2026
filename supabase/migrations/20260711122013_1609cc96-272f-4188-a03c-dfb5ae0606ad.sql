
ALTER TABLE public.dia_query_log
  ADD COLUMN IF NOT EXISTS tools_fired jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS success boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS tokens_used integer,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

CREATE INDEX IF NOT EXISTS dia_query_log_user_created_idx
  ON public.dia_query_log (user_id, created_at DESC);

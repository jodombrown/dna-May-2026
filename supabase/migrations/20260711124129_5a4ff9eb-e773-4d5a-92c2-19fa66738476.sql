
ALTER TABLE public.dia_query_log ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS dia_query_log_archived_at_idx ON public.dia_query_log(archived_at);

GRANT UPDATE, DELETE ON public.dia_query_log TO authenticated;

DROP POLICY IF EXISTS dia_query_log_update_own ON public.dia_query_log;
CREATE POLICY dia_query_log_update_own ON public.dia_query_log
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS dia_query_log_delete_own ON public.dia_query_log;
CREATE POLICY dia_query_log_delete_own ON public.dia_query_log
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Purge archived history older than 14 days.
CREATE OR REPLACE FUNCTION public.purge_expired_dia_history()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.dia_query_log
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - interval '14 days';
$$;

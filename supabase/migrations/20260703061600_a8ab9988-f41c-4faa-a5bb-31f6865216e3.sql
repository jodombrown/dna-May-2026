CREATE INDEX IF NOT EXISTS idx_space_tasks_board
  ON public.space_tasks (space_id, status, sort_order);
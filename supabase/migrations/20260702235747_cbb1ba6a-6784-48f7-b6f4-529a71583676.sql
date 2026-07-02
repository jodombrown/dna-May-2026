CREATE OR REPLACE FUNCTION public.rpc_dashboard_counts()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_active_spaces int := 0;
  v_pending_joins int := 0;
  v_tasks_due_7d int := 0;
  v_saved_opportunities int := 0;
  v_unread_notifications int := 0;
BEGIN
  BEGIN
    SELECT count(*) INTO v_active_spaces FROM public.space_members
    WHERE user_id = auth.uid() AND status = 'active';
  EXCEPTION WHEN undefined_table THEN v_active_spaces := 0; END;

  v_pending_joins := 0;                 -- Arc 4 (BD046)

  -- Note 4: re-point tasks_due_7d to canonical space_tasks (Arc 4, BD048)
  BEGIN
    SELECT count(*) INTO v_tasks_due_7d
    FROM public.space_tasks t
    WHERE t.assignee_id = auth.uid()
      AND t.status <> 'done'
      AND t.due_date IS NOT NULL
      AND t.due_date >= CURRENT_DATE
      AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
      AND EXISTS (
        SELECT 1 FROM public.space_members m
        WHERE m.space_id = t.space_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
      );
  EXCEPTION WHEN undefined_table THEN v_tasks_due_7d := 0; END;

  BEGIN
    SELECT count(*) INTO v_saved_opportunities FROM public.saved_opportunities
    WHERE user_id = auth.uid();
  EXCEPTION WHEN undefined_table THEN v_saved_opportunities := 0; END;

  BEGIN
    SELECT count(*) INTO v_unread_notifications FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false;
  EXCEPTION WHEN undefined_table THEN v_unread_notifications := 0; END;

  RETURN json_build_object(
    'active_spaces', COALESCE(v_active_spaces,0),
    'pending_joins', COALESCE(v_pending_joins,0),
    'tasks_due_7d', COALESCE(v_tasks_due_7d,0),
    'saved_opportunities', COALESCE(v_saved_opportunities,0),
    'unread_notifications', COALESCE(v_unread_notifications,0)
  );
END;
$function$;
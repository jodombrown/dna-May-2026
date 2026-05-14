
CREATE OR REPLACE FUNCTION public.set_group_participant_role(
  p_conversation_id uuid,
  p_user_id uuid,
  p_role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_target_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_role NOT IN ('admin','member') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  SELECT role INTO v_caller_role
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'You are not a participant of this group';
  END IF;
  IF v_caller_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Only owners or admins can change roles';
  END IF;

  SELECT role INTO v_target_role
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user is not a participant';
  END IF;
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot change owner role; transfer ownership instead';
  END IF;
  IF v_target_role = p_role THEN
    RETURN;
  END IF;

  UPDATE public.conversation_participants
  SET role = p_role
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_group_participant_role(uuid, uuid, text) TO authenticated;

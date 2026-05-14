-- Phase 6: Connection context for chat header
-- Returns shared activity + connection status between current user and another user.
-- SECURITY DEFINER so it can read both sides' membership without per-row RLS friction.

CREATE OR REPLACE FUNCTION public.get_chat_connection_context(_other_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _is_connected boolean := false;
  _connected_at timestamptz := null;
  _shared_events int := 0;
  _shared_spaces int := 0;
  _mutual_connections int := 0;
  _recent_event_title text := null;
  _recent_space_title text := null;
BEGIN
  IF _me IS NULL OR _other_user_id IS NULL OR _me = _other_user_id THEN
    RETURN jsonb_build_object(
      'is_connected', false,
      'shared_events', 0,
      'shared_spaces', 0,
      'mutual_connections', 0
    );
  END IF;

  -- Connection status (bidirectional)
  SELECT true, c.created_at INTO _is_connected, _connected_at
  FROM connections c
  WHERE c.status = 'accepted'
    AND ((c.user_id = _me AND c.connected_user_id = _other_user_id)
      OR (c.user_id = _other_user_id AND c.connected_user_id = _me))
  LIMIT 1;

  -- Shared events (both attended/registered)
  SELECT COUNT(DISTINCT ea1.event_id) INTO _shared_events
  FROM event_attendees ea1
  JOIN event_attendees ea2 ON ea1.event_id = ea2.event_id
  WHERE ea1.user_id = _me AND ea2.user_id = _other_user_id;

  -- Most recent shared event title
  SELECT e.title INTO _recent_event_title
  FROM event_attendees ea1
  JOIN event_attendees ea2 ON ea1.event_id = ea2.event_id
  JOIN events e ON e.id = ea1.event_id
  WHERE ea1.user_id = _me AND ea2.user_id = _other_user_id
  ORDER BY e.start_date DESC NULLS LAST
  LIMIT 1;

  -- Shared spaces (both members)
  SELECT COUNT(DISTINCT sm1.space_id) INTO _shared_spaces
  FROM space_members sm1
  JOIN space_members sm2 ON sm1.space_id = sm2.space_id
  WHERE sm1.user_id = _me AND sm2.user_id = _other_user_id;

  -- Most recent shared space title
  SELECT s.title INTO _recent_space_title
  FROM space_members sm1
  JOIN space_members sm2 ON sm1.space_id = sm2.space_id
  JOIN spaces s ON s.id = sm1.space_id
  WHERE sm1.user_id = _me AND sm2.user_id = _other_user_id
  ORDER BY sm1.joined_at DESC NULLS LAST
  LIMIT 1;

  -- Mutual connections (third-party users connected to both)
  SELECT COUNT(*) INTO _mutual_connections FROM (
    SELECT CASE WHEN c.user_id = _me THEN c.connected_user_id ELSE c.user_id END AS friend
    FROM connections c
    WHERE c.status = 'accepted' AND (c.user_id = _me OR c.connected_user_id = _me)
    INTERSECT
    SELECT CASE WHEN c.user_id = _other_user_id THEN c.connected_user_id ELSE c.user_id END AS friend
    FROM connections c
    WHERE c.status = 'accepted' AND (c.user_id = _other_user_id OR c.connected_user_id = _other_user_id)
  ) m;

  RETURN jsonb_build_object(
    'is_connected', _is_connected,
    'connected_at', _connected_at,
    'shared_events', _shared_events,
    'shared_spaces', _shared_spaces,
    'mutual_connections', _mutual_connections,
    'recent_event_title', _recent_event_title,
    'recent_space_title', _recent_space_title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_connection_context(uuid) TO authenticated;
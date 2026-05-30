CREATE OR REPLACE FUNCTION public.rpc_get_profile_bundle(p_username text, p_viewer_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile profiles%ROWTYPE;
  v_result json;
  v_is_owner boolean;
  v_activity json;
  v_spaces json;
  v_events json;
  v_connections_count integer;
  v_events_count integer;
  v_connection_status text;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE username = p_username;
  
  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_is_owner := (p_viewer_id IS NOT NULL AND p_viewer_id = v_profile.id);
  
  IF NOT v_is_owner AND NOT COALESCE(v_profile.is_public, false) THEN
    RETURN NULL;
  END IF;
  
  v_connection_status := 'none';
  
  IF p_viewer_id IS NOT NULL AND NOT v_is_owner THEN
    SELECT 
      CASE 
        WHEN status = 'accepted' THEN 'accepted'
        WHEN status = 'pending' THEN 'pending_sent'
        WHEN status = 'declined' THEN 'declined'
        ELSE 'none'
      END INTO v_connection_status
    FROM connections
    WHERE requester_id = p_viewer_id AND recipient_id = v_profile.id;
    
    IF v_connection_status IS NULL OR v_connection_status = 'none' THEN
      SELECT 
        CASE 
          WHEN status = 'accepted' THEN 'accepted'
          WHEN status = 'pending' THEN 'pending_received'
          WHEN status = 'declined' THEN 'declined'
          ELSE 'none'
        END INTO v_connection_status
      FROM connections
      WHERE requester_id = v_profile.id AND recipient_id = p_viewer_id;
    END IF;
    
    v_connection_status := COALESCE(v_connection_status, 'none');
  END IF;
  
  SELECT COUNT(*) INTO v_connections_count
  FROM connections
  WHERE status = 'accepted'
    AND (requester_id = v_profile.id OR recipient_id = v_profile.id);
  
  SELECT COUNT(DISTINCT e.id) INTO v_events_count
  FROM events e
  LEFT JOIN event_attendees ea ON ea.event_id = e.id AND ea.user_id = v_profile.id
  WHERE (e.organizer_id = v_profile.id OR ea.user_id IS NOT NULL)
    AND e.is_cancelled = false;
  
  SELECT COALESCE(json_agg(space_data), '[]'::json)
  INTO v_spaces
  FROM (
    SELECT json_build_object(
      'id', s.id,
      'title', s.name,
      'role', cm.role
    ) as space_data
    FROM spaces s
    JOIN space_members cm ON cm.space_id = s.id
    WHERE cm.user_id = v_profile.id AND cm.status = 'active'
    LIMIT 3
  ) sub;
  
  SELECT COALESCE(json_agg(event_data ORDER BY event_date DESC), '[]'::json)
  INTO v_events
  FROM (
    SELECT DISTINCT ON (e.id)
      json_build_object(
        'id', e.id,
        'title', e.title,
        'role', 'host',
        'event_date', e.start_time
      ) as event_data,
      e.start_time as event_date
    FROM events e
    WHERE e.organizer_id = v_profile.id
      AND e.is_cancelled = false
      AND e.start_time >= CURRENT_DATE - INTERVAL '3 months'
    
    UNION ALL
    
    SELECT DISTINCT ON (e.id)
      json_build_object(
        'id', e.id,
        'title', e.title,
        'role', 'attendee',
        'event_date', e.start_time
      ) as event_data,
      e.start_time as event_date
    FROM events e
    JOIN event_attendees ea ON ea.event_id = e.id
    WHERE ea.user_id = v_profile.id
      AND e.organizer_id != v_profile.id
      AND e.is_cancelled = false
      AND e.start_time >= CURRENT_DATE - INTERVAL '3 months'
    
    LIMIT 5
  ) sub;
  
  v_activity := json_build_object(
    'spaces', v_spaces,
    'events', v_events,
    'connections_count', v_connections_count,
    'events_count', v_events_count,
    'stories_count', (SELECT COUNT(*) FROM posts WHERE author_id = v_profile.id AND post_type = 'story'),
    'contributions_count', 0
  );
  
  -- Preserve remainder of original function body
  RETURN public._rpc_get_profile_bundle_tail(v_profile, v_is_owner, v_activity, v_connection_status);
END;
$function$;
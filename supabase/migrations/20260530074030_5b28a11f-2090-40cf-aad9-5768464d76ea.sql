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

  v_result := json_build_object(
    'profile', json_build_object(
      'id', v_profile.id,
      'username', v_profile.username,
      'full_name', COALESCE(v_profile.first_name || ' ' || v_profile.last_name, v_profile.first_name, v_profile.full_name),
      'first_name', v_profile.first_name,
      'last_name', v_profile.last_name,
      'avatar_url', v_profile.avatar_url,
      'banner_url', v_profile.banner_url,
      'banner_type', COALESCE(v_profile.banner_type, 'gradient'),
      'banner_gradient', COALESCE(v_profile.banner_gradient, 'dna'),
      'banner_overlay', COALESCE(v_profile.banner_overlay, false),
      'professional_role', v_profile.professional_role,
      'headline', v_profile.headline,
      'bio', v_profile.bio,
      'profession', v_profile.profession,
      'company', v_profile.company,
      'industry', v_profile.industry,
      'years_experience', v_profile.years_experience,
      'current_country', v_profile.current_country,
      'current_city', v_profile.current_city,
      'primary_origin_country', (select mh.origin_country from public.member_heritage mh
                                   where mh.profile_id = v_profile.id and mh.is_primary limit 1),
      'ethnic_heritage', v_profile.ethnic_heritage,
      'african_causes', to_json(COALESCE(v_profile.african_causes, ARRAY[]::text[])),
      'engagement_intentions', to_json(COALESCE(v_profile.engagement_intentions, ARRAY[]::text[])),
      'return_intentions', v_profile.return_intentions,
      'africa_visit_frequency', v_profile.africa_visit_frequency,
      'diaspora_networks', to_json(COALESCE(v_profile.diaspora_networks, ARRAY[]::text[])),
      'mentorship_areas', to_json(COALESCE(v_profile.mentorship_areas, ARRAY[]::text[])),
      'languages', to_json(COALESCE(v_profile.languages, ARRAY[]::text[])),
      'location', v_profile.location,
      'verification_status', v_profile.verification_status,
      'verification_updated_at', v_profile.verification_updated_at,
      'created_at', v_profile.created_at
    ),
    'tags', json_build_object(
      'skills', to_json(COALESCE(v_profile.skills, ARRAY[]::text[])),
      'interests', to_json(COALESCE(v_profile.interests, ARRAY[]::text[])),
      'focus_areas', to_json(COALESCE(v_profile.focus_areas, ARRAY[]::text[])),
      'impact_areas', to_json(COALESCE(v_profile.impact_areas, ARRAY[]::text[])),
      'available_for', to_json(COALESCE(v_profile.available_for, ARRAY[]::text[])),
      'industries', to_json(COALESCE(v_profile.industries, ARRAY[]::text[])),
      'regional_expertise', to_json(COALESCE(v_profile.regional_expertise, ARRAY[]::text[])),
      'professional_sectors', to_json(COALESCE(v_profile.professional_sectors, ARRAY[]::text[]))
    ),
    'activity', v_activity,
    'permissions', json_build_object(
      'is_owner', v_is_owner,
      'can_edit', v_is_owner,
      'can_create_events', true,
      'can_create_public_spaces', true,
      'can_connect', NOT v_is_owner AND v_connection_status = 'none'
    ),
    'visibility', json_build_object(
      'about', 'public',
      'skills', 'public',
      'interests', 'public',
      'activity', 'public',
      'events', 'public',
      'spaces', 'public',
      'opportunities', 'public',
      'stories', 'public'
    ),
    'completion', json_build_object(
      'score', COALESCE(v_profile.profile_completion_percentage, 0),
      'suggested_actions', '[]'::json
    ),
    'verification_meta', json_build_object(
      'tier', v_profile.verification_status,
      'status', v_profile.verification_status,
      'updated_at', v_profile.verification_updated_at,
      'improvement_suggestions', '[]'::json
    ),
    'connection_status', v_connection_status
  );

  RETURN v_result;
END;
$function$;
-- BD033 Step 2 — re-point txn (retry): archive verbatim + RPC rewrites

-- Part A: archive off Data API
CREATE SCHEMA IF NOT EXISTS archive;

CREATE TABLE IF NOT EXISTS archive.diaspora_status_20260529 (
  profile_id       uuid        NOT NULL,
  diaspora_status  text        NOT NULL,
  archived_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO archive.diaspora_status_20260529 (profile_id, diaspora_status)
SELECT id, diaspora_status
FROM public.profiles
WHERE diaspora_status IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM archive.diaspora_status_20260529);

-- Part B: discover_members — DROP then recreate (shape change forbids CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.discover_members(uuid, text[], text[], text[], text, text, text[], text, text, integer, integer, text[]);

CREATE FUNCTION public.discover_members(p_current_user_id uuid, p_focus_areas text[] DEFAULT NULL::text[], p_regional_expertise text[] DEFAULT NULL::text[], p_industries text[] DEFAULT NULL::text[], p_country_of_origin text DEFAULT NULL::text, p_location_country text DEFAULT NULL::text, p_skills text[] DEFAULT NULL::text[], p_search_query text DEFAULT NULL::text, p_sort_by text DEFAULT 'match'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_ethnic_heritage text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, banner_url text, banner_type text, banner_gradient text, banner_overlay boolean, headline text, profession text, location text, country_of_origin text, focus_areas text[], regional_expertise text[], industries text[], profile_comp integer, created_at timestamp with time zone, calc_match_score integer, ethnic_heritage text[], available_for text[], skills text[], last_seen_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH current_user_profile AS (
    SELECT 
      pr.focus_areas as user_focus,
      pr.regional_expertise as user_region,
      pr.industries as user_industries,
      pr.country_of_origin as user_country,
      pr.current_country_name as user_location,
      pr.skills as user_skills
    FROM profiles pr
    WHERE pr.id = p_current_user_id
  ),
  blocked_users AS (
    SELECT blocked_id FROM blocked_users bu WHERE bu.blocker_id = p_current_user_id
    UNION
    SELECT blocker_id FROM blocked_users bu WHERE bu.blocked_id = p_current_user_id
  ),
  scored_profiles AS (
    SELECT
      pr.id,
      pr.full_name,
      pr.username,
      pr.avatar_url,
      pr.banner_url,
      pr.banner_type,
      pr.banner_gradient,
      pr.banner_overlay,
      pr.headline,
      pr.profession,
      pr.location,
      pr.country_of_origin,
      pr.focus_areas,
      pr.regional_expertise,
      pr.industries,
      COALESCE(pr.profile_completion_percentage, 0)::int as profile_comp,
      pr.created_at,
      (
        CASE 
          WHEN pr.focus_areas IS NOT NULL 
               AND (SELECT user_focus FROM current_user_profile) IS NOT NULL
               AND pr.focus_areas && (SELECT user_focus FROM current_user_profile) 
          THEN LEAST(30, 10 * COALESCE(array_length(
            ARRAY(SELECT UNNEST(pr.focus_areas) INTERSECT SELECT UNNEST((SELECT user_focus FROM current_user_profile))),
            1
          ), 0))
          ELSE 0
        END +
        CASE 
          WHEN pr.regional_expertise IS NOT NULL 
               AND (SELECT user_region FROM current_user_profile) IS NOT NULL
               AND pr.regional_expertise && (SELECT user_region FROM current_user_profile) 
          THEN LEAST(20, 10 * COALESCE(array_length(
            ARRAY(SELECT UNNEST(pr.regional_expertise) INTERSECT SELECT UNNEST((SELECT user_region FROM current_user_profile))),
            1
          ), 0))
          ELSE 0
        END +
        CASE 
          WHEN pr.industries IS NOT NULL 
               AND (SELECT user_industries FROM current_user_profile) IS NOT NULL
               AND pr.industries && (SELECT user_industries FROM current_user_profile) 
          THEN LEAST(20, 10 * COALESCE(array_length(
            ARRAY(SELECT UNNEST(pr.industries) INTERSECT SELECT UNNEST((SELECT user_industries FROM current_user_profile))),
            1
          ), 0))
          ELSE 0
        END +
        CASE 
          WHEN pr.country_of_origin IS NOT NULL 
               AND pr.country_of_origin = (SELECT user_country FROM current_user_profile) THEN 15
          ELSE 0
        END +
        CASE 
          WHEN pr.current_country_name IS NOT NULL 
               AND pr.current_country_name = (SELECT user_location FROM current_user_profile) THEN 10
          ELSE 0
        END +
        CASE 
          WHEN COALESCE(pr.profile_completion_percentage, 0) >= 80 THEN 5
          WHEN COALESCE(pr.profile_completion_percentage, 0) >= 50 THEN 3
          ELSE 0
        END
      )::int AS calc_match_score,
      pr.ethnic_heritage,
      pr.available_for,
      pr.skills,
      pr.last_seen_at
      
    FROM profiles pr
    WHERE
      pr.id != p_current_user_id
      AND pr.id NOT IN (SELECT bu.blocked_id FROM blocked_users bu)
      AND COALESCE(pr.is_public, true) = true
      AND (p_country_of_origin IS NULL OR pr.country_of_origin = p_country_of_origin)
      AND (p_location_country IS NULL OR pr.current_country_name = p_location_country)
      AND (p_focus_areas IS NULL OR pr.focus_areas && p_focus_areas)
      AND (p_regional_expertise IS NULL OR pr.regional_expertise && p_regional_expertise)
      AND (p_industries IS NULL OR pr.industries && p_industries)
      AND (p_skills IS NULL OR pr.skills && p_skills)
      AND (p_ethnic_heritage IS NULL OR pr.ethnic_heritage && p_ethnic_heritage)
      AND (
        p_search_query IS NULL OR
        pr.full_name ILIKE '%' || p_search_query || '%' OR
        pr.username ILIKE '%' || p_search_query || '%' OR
        pr.headline ILIKE '%' || p_search_query || '%' OR
        pr.profession ILIKE '%' || p_search_query || '%' OR
        pr.location ILIKE '%' || p_search_query || '%' OR
        pr.country_of_origin ILIKE '%' || p_search_query || '%' OR
        pr.bio ILIKE '%' || p_search_query || '%'
      )
  )
  SELECT sp.* FROM scored_profiles sp
  ORDER BY
    CASE WHEN p_sort_by = 'match' THEN sp.calc_match_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'recent' THEN sp.created_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'name' THEN sp.full_name END ASC NULLS LAST,
    sp.calc_match_score DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- Part C: rpc_get_profile_bundle — CREATE OR REPLACE (return type unchanged: json)
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
      'title', s.title,
      'role', cm.role
    ) as space_data
    FROM collaboration_spaces s
    JOIN collaboration_memberships cm ON cm.space_id = s.id
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
      'country_of_origin', v_profile.country_of_origin,
      'diaspora_origin', v_profile.diaspora_origin,
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
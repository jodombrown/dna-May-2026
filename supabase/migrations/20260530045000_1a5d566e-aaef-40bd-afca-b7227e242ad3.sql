-- BD042 re-point pass: remove diaspora_origin from 4 catalog objects. No column drops.

-- 1. VIEW public_profiles — DROP + CREATE (PG can't drop columns via CREATE OR REPLACE)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
 SELECT id,
    username,
    display_name,
    full_name,
    first_name,
    last_name,
    avatar_url,
    profile_picture_url,
    banner_url,
    headline,
    bio,
    professional_role,
    profession,
    industry,
    years_experience,
    company,
    venture_name,
    venture_stage,
    ( SELECT mh.origin_country
           FROM member_heritage mh
          WHERE mh.profile_id = profiles.id AND mh.is_primary
         LIMIT 1) AS primary_origin_country,
    current_country,
    current_country_name,
    current_city,
    current_region,
    skills,
    interests,
    interest_tags,
    sectors,
    impact_areas,
    impact_regions,
    sdg_focus,
    available_for,
    offers,
    needs,
    networking_goals,
    is_public,
    created_at,
    role,
    continent,
    country
   FROM profiles
  WHERE is_public = true;

-- Re-apply original grants (live relacl: postgres, anon, authenticated, service_role all full)
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.public_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.public_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.public_profiles TO service_role;

-- 2. FUNCTION get_safe_profile_fields — DROP + CREATE (return signature changes)
DROP FUNCTION IF EXISTS public.get_safe_profile_fields(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_safe_profile_fields(profile_id uuid, viewer_id uuid)
 RETURNS TABLE(id uuid, username text, display_name text, full_name text, first_name text, last_name text, avatar_url text, profile_picture_url text, banner_url text, headline text, bio text, professional_role text, profession text, industry text, years_experience integer, company text, venture_name text, venture_stage text, primary_origin_country text, current_country text, current_country_name text, current_city text, current_region text, skills text[], interests text[], interest_tags text[], sectors text[], impact_areas text[], impact_regions text[], sdg_focus text[], available_for text[], offers text[], needs text[], networking_goals text[], is_public boolean, created_at timestamp with time zone, email text, location text, current_location text, linkedin_url text, twitter_url text, website_url text, preferred_contact text, available_hours_per_month integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- Public safe fields - always visible
    p.username,
    p.display_name,
    p.full_name,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.profile_picture_url,
    p.banner_url,
    p.headline,
    p.bio,
    p.professional_role,
    p.profession,
    p.industry,
    p.years_experience,
    p.company,
    p.venture_name,
    p.venture_stage,
    -- Diaspora identity (re-pointed to member_heritage)
    (select mh.origin_country from public.member_heritage mh
       where mh.profile_id = p.id and mh.is_primary limit 1) AS primary_origin_country,
    p.current_country,
    p.current_country_name,
    p.current_city,
    p.current_region,
    -- Public arrays
    p.skills,
    p.interests,
    p.interest_tags,
    p.sectors,
    p.impact_areas,
    p.impact_regions,
    p.sdg_focus,
    p.available_for,
    p.offers,
    p.needs,
    p.networking_goals,
    -- Status
    p.is_public,
    p.created_at,
    -- Sensitive fields - only show to profile owner
    CASE WHEN p.id = viewer_id THEN p.email ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.location ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.current_location ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.linkedin_url ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.twitter_url ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.website_url ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.preferred_contact ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.available_hours_per_month ELSE NULL END
  FROM profiles p
  WHERE p.id = profile_id
    AND (p.is_public = true OR p.id = viewer_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_fields(uuid, uuid) TO service_role;

-- 3. FUNCTION rpc_get_profile_bundle (CREATE OR REPLACE; remove single JSON key)
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

-- 4. FUNCTION calculate_profile_completion_score (remove diaspora_story 10pt block; no redistribution)
CREATE OR REPLACE FUNCTION public.calculate_profile_completion_score(profile_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
    
    -- Basic info (30 points)
    IF profile_record.full_name IS NOT NULL AND LENGTH(profile_record.full_name) > 0 THEN
        score := score + 10;
    END IF;
    
    IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 50 THEN
        score := score + 10;
    END IF;
    
    IF profile_record.headline IS NOT NULL AND LENGTH(profile_record.headline) > 0 THEN
        score := score + 10;
    END IF;
    
    -- Professional info (40 points)
    IF profile_record.profession IS NOT NULL AND LENGTH(profile_record.profession) > 0 THEN
        score := score + 10;
    END IF;
    
    IF profile_record.company IS NOT NULL AND LENGTH(profile_record.company) > 0 THEN
        score := score + 10;
    END IF;
    
    IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) >= 3 THEN
        score := score + 20;
    END IF;
    
    -- Diaspora info (30 points)
    IF exists (select 1 from public.member_heritage mh
                 where mh.profile_id = profile_record.id and mh.is_primary) THEN
        score := score + 10;
    END IF;
    
    IF profile_record.location IS NOT NULL AND LENGTH(profile_record.location) > 0 THEN
        score := score + 10;
    END IF;
    
    RETURN score;
END;
$function$;
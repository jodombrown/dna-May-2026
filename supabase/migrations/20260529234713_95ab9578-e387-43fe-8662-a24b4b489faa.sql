-- BD038 / 4b-03 — Re-point all country_of_origin readers to member_heritage (ISO-3).
-- Additive/rewrite only. No drops of profiles.country_of_origin in this migration.

-- =========================================================================
-- 1) Parallel verification refresh trigger on member_heritage
-- =========================================================================
CREATE OR REPLACE FUNCTION public.refresh_verification_on_heritage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET updated_at = now()
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_heritage_refresh_verification ON public.member_heritage;
CREATE TRIGGER trg_member_heritage_refresh_verification
  AFTER INSERT OR UPDATE OR DELETE ON public.member_heritage
  FOR EACH ROW EXECUTE FUNCTION public.refresh_verification_on_heritage();

-- =========================================================================
-- 2) calculate_match_score(uuid,uuid) — both reads -> FRAG-A; code=code
-- =========================================================================
CREATE OR REPLACE FUNCTION public.calculate_match_score(profile_id uuid, signal_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    score integer := 0;
    profile_data record;
    signal_data record;
BEGIN
    -- Get profile data
    SELECT skills, interests, professional_sectors, diaspora_networks, location,
           (select mh.origin_country from public.member_heritage mh
              where mh.profile_id = profiles.id and mh.is_primary limit 1) AS country_of_origin
    INTO profile_data
    FROM profiles 
    WHERE id = profile_id;
    
    -- Get signal data  
    SELECT skills_required, interests_relevant, sectors_relevant, locations_relevant, signal_type
    INTO signal_data
    FROM adin_signals
    WHERE id = signal_id;
    
    -- Calculate score based on matching criteria
    -- Skills match (40% weight)
    IF profile_data.skills && signal_data.skills_required THEN
        score := score + 40;
    END IF;
    
    -- Interests match (20% weight)
    IF profile_data.interests && signal_data.interests_relevant THEN
        score := score + 20;
    END IF;
    
    -- Sectors match (20% weight)
    IF profile_data.professional_sectors && signal_data.sectors_relevant THEN
        score := score + 20;
    END IF;
    
    -- Location match (20% weight)
    IF profile_data.location = ANY(signal_data.locations_relevant) OR 
       profile_data.country_of_origin = ANY(signal_data.locations_relevant) THEN
        score := score + 20;
    END IF;
    
    RETURN score;
END;
$function$;

-- =========================================================================
-- 3) calculate_profile_completion_percentage — presence -> FRAG-B
-- =========================================================================
CREATE OR REPLACE FUNCTION public.calculate_profile_completion_percentage(profile_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  score INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE id = profile_id;
  
  IF profile_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Core Information (40 points total - minimum to unlock other modules)
  IF profile_record.full_name IS NOT NULL AND length(profile_record.full_name) > 0 THEN score := score + 10; END IF;
  IF profile_record.headline IS NOT NULL AND length(profile_record.headline) > 0 THEN score := score + 10; END IF;
  IF profile_record.bio IS NOT NULL AND length(profile_record.bio) > 50 THEN score := score + 10; END IF;
  IF profile_record.location IS NOT NULL AND length(profile_record.location) > 0 THEN score := score + 10; END IF;
  
  -- Professional Details (20 points)
  IF profile_record.profession IS NOT NULL AND length(profile_record.profession) > 0 THEN score := score + 5; END IF;
  IF profile_record.company IS NOT NULL AND length(profile_record.company) > 0 THEN score := score + 5; END IF;
  IF profile_record.linkedin_url IS NOT NULL AND length(profile_record.linkedin_url) > 0 THEN score := score + 5; END IF;
  IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience > 0 THEN score := score + 5; END IF;
  
  -- Skills & Interests (15 points)
  IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) >= 3 THEN score := score + 10; END IF;
  IF profile_record.interests IS NOT NULL AND array_length(profile_record.interests, 1) >= 2 THEN score := score + 5; END IF;
  
  -- Heritage & Identity (10 points)
  IF exists (select 1 from public.member_heritage mh
               where mh.profile_id = profile_record.id and mh.is_primary) THEN score := score + 5; END IF;
  IF profile_record.current_country IS NOT NULL AND length(profile_record.current_country) > 0 THEN score := score + 5; END IF;
  
  -- Engagement Flags (10 points) - Use correct column names
  IF profile_record.mentorship_offering = true THEN score := score + 5; END IF;
  IF profile_record.open_to_opportunities = true THEN score := score + 5; END IF;
  
  -- Visual elements (5 points)
  IF profile_record.avatar_url IS NOT NULL AND length(profile_record.avatar_url) > 0 THEN score := score + 5; END IF;
  
  RETURN score;
END;
$function$;

-- =========================================================================
-- 4) calculate_profile_completion_score — presence -> FRAG-B
-- =========================================================================
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
    
    IF profile_record.diaspora_story IS NOT NULL AND LENGTH(profile_record.diaspora_story) > 0 THEN
        score := score + 10;
    END IF;
    
    RETURN score;
END;
$function$;

-- =========================================================================
-- 5) check_and_update_verification — NEW.country_of_origin -> FRAG-B keyed NEW.id
-- =========================================================================
CREATE OR REPLACE FUNCTION public.check_and_update_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  completion_score INT := 0;
  current_verification verification_status;
BEGIN
  -- Get current verification status
  current_verification := NEW.verification_status;
  
  -- If already fully_verified by admin, don't downgrade
  IF current_verification = 'fully_verified' THEN
    RETURN NEW;
  END IF;
  
  -- Calculate profile completion score (matching profileCompletion.ts logic)
  -- Pillar 1: Identity (25 pts)
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
    completion_score := completion_score + 10;
  END IF;
  IF NEW.full_name IS NOT NULL AND LENGTH(NEW.full_name) >= 2 THEN
    completion_score := completion_score + 5;
  END IF;
  IF NEW.headline IS NOT NULL AND LENGTH(NEW.headline) >= 5 THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Pillar 2: Professional (20 pts)
  IF NEW.profession IS NOT NULL AND NEW.profession != '' THEN
    completion_score := completion_score + 5;
  END IF;
  IF NEW.bio IS NOT NULL AND LENGTH(NEW.bio) >= 50 THEN
    completion_score := completion_score + 10;
  END IF;
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Pillar 3: Discovery (30 pts)
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) >= 3 THEN
    completion_score := completion_score + 10;
  END IF;
  IF NEW.focus_areas IS NOT NULL AND array_length(NEW.focus_areas, 1) >= 2 THEN
    completion_score := completion_score + 10;
  END IF;
  IF NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) >= 3 THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Pillar 4: Diaspora Context (15 pts)
  IF exists (select 1 from public.member_heritage mh
               where mh.profile_id = NEW.id and mh.is_primary) THEN
    completion_score := completion_score + 5;
  END IF;
  IF NEW.current_country IS NOT NULL AND NEW.current_country != '' THEN
    completion_score := completion_score + 5;
  END IF;
  IF NEW.languages IS NOT NULL AND array_length(NEW.languages, 1) >= 1 THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Pillar 5: Engagement (10 pts)
  IF NEW.banner_url IS NOT NULL AND NEW.banner_url != '' THEN
    completion_score := completion_score + 5;
  END IF;
  IF NEW.industries IS NOT NULL AND array_length(NEW.industries, 1) >= 1 THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Auto-verify if score reaches 100
  IF completion_score >= 100 AND current_verification = 'pending_verification' THEN
    NEW.verification_status := 'soft_verified';
    NEW.verification_updated_at := NOW();
    NEW.verification_method := 'auto_profile_completion';
    NEW.verified := TRUE;
    NEW.verified_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- =========================================================================
-- 6) compute_profile_completion_score(profiles) — presence -> FRAG-B keyed p.id
-- =========================================================================
CREATE OR REPLACE FUNCTION public.compute_profile_completion_score(profile_record profiles)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Identity & Hero (25 points)
  IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN score := score + 5; END IF;
  IF profile_record.avatar_url IS NOT NULL THEN score := score + 5; END IF;
  IF profile_record.headline IS NOT NULL AND profile_record.headline != '' THEN score := score + 5; END IF;
  IF profile_record.professional_role IS NOT NULL AND profile_record.professional_role != '' THEN score := score + 5; END IF;
  IF profile_record.current_country IS NOT NULL AND profile_record.current_country != '' THEN score := score + 5; END IF;
  
  -- Diaspora Story (20 points)
  IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 50 THEN score := score + 15; END IF;
  IF exists (select 1 from public.member_heritage mh
               where mh.profile_id = profile_record.id and mh.is_primary) THEN score := score + 5; END IF;
  
  -- Skills & Contributions (20 points)
  IF COALESCE(array_length(profile_record.skills, 1), 0) >= 3 THEN score := score + 15; END IF;
  IF COALESCE(array_length(profile_record.available_for, 1), 0) >= 1 THEN score := score + 5; END IF;
  
  -- Interests & Focus (15 points)
  IF COALESCE(array_length(profile_record.interests, 1), 0) >= 3 THEN score := score + 10; END IF;
  IF COALESCE(array_length(profile_record.impact_areas, 1), 0) >= 1 THEN score := score + 5; END IF;
  
  -- Experience (20 points)
  IF profile_record.profession IS NOT NULL AND profile_record.profession != '' THEN score := score + 7; END IF;
  IF profile_record.company IS NOT NULL AND profile_record.company != '' THEN score := score + 7; END IF;
  IF profile_record.years_experience IS NOT NULL AND profile_record.years_experience > 0 THEN score := score + 6; END IF;
  
  RETURN LEAST(score, 100);
END;
$function$;

-- =========================================================================
-- 7) discover_members — column rename in RETURNS TABLE forces DROP+CREATE.
-- Primary origin via FRAG-A as primary_origin_country; p_country_of_origin
-- compares ISO-3; scoring code=code; ORIGIN ILIKE dropped from free-text search.
-- =========================================================================
DROP FUNCTION IF EXISTS public.discover_members(uuid, text[], text[], text[], text, text, text[], text, text, integer, integer, text[]);

CREATE OR REPLACE FUNCTION public.discover_members(p_current_user_id uuid, p_focus_areas text[] DEFAULT NULL::text[], p_regional_expertise text[] DEFAULT NULL::text[], p_industries text[] DEFAULT NULL::text[], p_country_of_origin text DEFAULT NULL::text, p_location_country text DEFAULT NULL::text, p_skills text[] DEFAULT NULL::text[], p_search_query text DEFAULT NULL::text, p_sort_by text DEFAULT 'match'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_ethnic_heritage text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, banner_url text, banner_type text, banner_gradient text, banner_overlay boolean, headline text, profession text, location text, primary_origin_country text, focus_areas text[], regional_expertise text[], industries text[], profile_comp integer, created_at timestamp with time zone, calc_match_score integer, ethnic_heritage text[], available_for text[], skills text[], last_seen_at timestamp with time zone)
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
      (select mh.origin_country from public.member_heritage mh
         where mh.profile_id = pr.id and mh.is_primary limit 1) as user_country,
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
      (select mh.origin_country from public.member_heritage mh
         where mh.profile_id = pr.id and mh.is_primary limit 1) as primary_origin_country,
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
          WHEN (select mh.origin_country from public.member_heritage mh
                  where mh.profile_id = pr.id and mh.is_primary limit 1) IS NOT NULL 
               AND (select mh.origin_country from public.member_heritage mh
                      where mh.profile_id = pr.id and mh.is_primary limit 1)
                   = (SELECT user_country FROM current_user_profile) THEN 15
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
      AND (p_country_of_origin IS NULL OR (select mh.origin_country from public.member_heritage mh
                                             where mh.profile_id = pr.id and mh.is_primary limit 1) = p_country_of_origin)
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

-- =========================================================================
-- 8) get_safe_profile_fields — return primary_origin_country; drop origin_country_name
-- (RETURNS TABLE signature change forces DROP+CREATE)
-- =========================================================================
DROP FUNCTION IF EXISTS public.get_safe_profile_fields(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_safe_profile_fields(profile_id uuid, viewer_id uuid)
 RETURNS TABLE(id uuid, username text, display_name text, full_name text, first_name text, last_name text, avatar_url text, profile_picture_url text, banner_url text, headline text, bio text, professional_role text, profession text, industry text, years_experience integer, company text, venture_name text, venture_stage text, primary_origin_country text, diaspora_origin text, current_country text, current_country_name text, current_city text, current_region text, skills text[], interests text[], interest_tags text[], sectors text[], impact_areas text[], impact_regions text[], sdg_focus text[], available_for text[], offers text[], needs text[], networking_goals text[], is_public boolean, created_at timestamp with time zone, email text, location text, current_location text, linkedin_url text, twitter_url text, website_url text, preferred_contact text, available_hours_per_month integer)
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
    p.diaspora_origin,
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

-- =========================================================================
-- 9) get_suggested_connections — column rename in RETURNS TABLE forces DROP+CREATE
-- =========================================================================
DROP FUNCTION IF EXISTS public.get_suggested_connections(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_suggested_connections(p_user_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, headline text, profession text, location text, primary_origin_country text, focus_areas text[], industries text[], skills text[], match_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.headline,
    p.profession,
    p.location,
    (select mh.origin_country from public.member_heritage mh
       where mh.profile_id = p.id and mh.is_primary limit 1) AS primary_origin_country,
    p.focus_areas,
    p.industries,
    p.skills,
    50::integer as match_score
  FROM profiles p
  WHERE p.id != p_user_id
  AND p.id NOT IN (
    SELECT c.recipient_id FROM connections c WHERE c.requester_id = p_user_id
    UNION
    SELECT c.requester_id FROM connections c WHERE c.recipient_id = p_user_id
  )
  ORDER BY random()
  LIMIT p_limit;
END;
$function$;

-- =========================================================================
-- 10) rpc_get_profile_bundle — JSON key country_of_origin -> primary_origin_country (FRAG-A)
-- =========================================================================
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

-- =========================================================================
-- 11) View public.public_profiles — rebuild with primary_origin_country; drop origin_country_name
-- =========================================================================
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
    (select mh.origin_country from public.member_heritage mh
       where mh.profile_id = profiles.id and mh.is_primary limit 1) AS primary_origin_country,
    diaspora_origin,
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT ALL ON public.public_profiles TO service_role;
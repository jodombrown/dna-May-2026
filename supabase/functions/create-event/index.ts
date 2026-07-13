import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { corsHeaders } from '../_shared/cors.ts';
import {
  eventStateWrite,
  isEventStatus,
  isEventVisibility,
  type EventStatus,
  type EventVisibility,
} from '../_shared/event-state.ts';

interface AgendaItem {
  time: string;
  title: string;
}

interface Speaker {
  name: string;
  title?: string;
}

interface CreateEventRequest {
  title: string;
  description: string;
  event_type: 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'social' | 'other';
  format: 'in_person' | 'virtual' | 'hybrid';
  location_name?: string;
  location_address?: string;
  location_city?: string;
  location_country?: string;
  location_lat?: number;
  location_lng?: number;
  meeting_url?: string;
  meeting_platform?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  max_attendees?: number;
  status?: string;
  visibility?: string;
  /** Legacy audience flag — only consulted when `visibility` is absent. */
  is_public?: boolean;
  requires_approval?: boolean;
  allow_guests?: boolean;
  cover_image_url?: string;
  // New structured fields
  subtitle?: string;
  short_description?: string;
  agenda?: AgendaItem[];
  speakers?: Speaker[];
  dress_code?: string;
  tags?: string[];
  group_id?: string;
  is_flagship?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Creating event for user:', user.id);

    // Fetch user profile to check eligibility - use actual profile fields for calculation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, avatar_url, full_name, headline, profession, bio, linkedin_url, skills, focus_areas, interests, country, current_country, languages, banner_url, industries')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate profile completion using the same 5-pillar logic as frontend (max 100 pts)
    const calculateProfileCompletion = (p: typeof profile): number => {
      let points = 0;
      // Pillar 1: Identity (25 pts)
      if (p.avatar_url) points += 10;
      if (p.full_name && p.full_name.length >= 2) points += 5;
      if (p.headline && p.headline.length >= 5) points += 10;
      // Pillar 2: Professional (20 pts)
      if (p.profession) points += 5;
      if (p.bio && p.bio.length >= 50) points += 10;
      if (p.linkedin_url) points += 5;
      // Pillar 3: Discovery (30 pts)
      if (Array.isArray(p.skills) && p.skills.length >= 3) points += 10;
      if (Array.isArray(p.focus_areas) && p.focus_areas.length >= 2) points += 10;
      if (Array.isArray(p.interests) && p.interests.length >= 3) points += 10;
      // Pillar 4: Diaspora Context (15 pts)
      if (p.country) points += 5;
      if (p.current_country) points += 5;
      if (Array.isArray(p.languages) && p.languages.length >= 1) points += 5;
      // Pillar 5: Engagement (10 pts)
      if (p.banner_url) points += 5;
      if (Array.isArray(p.industries) && p.industries.length >= 1) points += 5;
      return Math.min(100, points);
    };

    const completionPercentage = calculateProfileCompletion(profile);
    console.log('Profile completion calculated:', completionPercentage, 'for user:', user.id);

    if (completionPercentage < 40) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Profile must be at least 40% complete to create events. Please complete your profile first.',
          required_completion: 40,
          current_completion: completionPercentage,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const eventData: CreateEventRequest = await req.json();

    // Validation — mirrors the DB CHECK constraints (and eventFormSchema),
    // ONE idea of what an event is: title 1..200, description 1..5000.
    if (!eventData.title?.trim() || eventData.title.length > 200) {
      throw new Error('Title must be between 1 and 200 characters');
    }

    if (!eventData.description?.trim() || eventData.description.length > 5000) {
      throw new Error('Description must be between 1 and 5,000 characters');
    }

    if (!eventData.start_time || !eventData.end_time) {
      throw new Error('Start and end times are required');
    }

    // Validate time range
    const startTime = new Date(eventData.start_time);
    const endTime = new Date(eventData.end_time);
    const now = new Date();

    if (startTime <= now) {
      throw new Error('Event start time must be in the future');
    }

    if (endTime <= startTime) {
      throw new Error('Event end time must be after start time');
    }

    // Validate format-specific requirements — matches the DB valid_location
    // CHECK: virtual, or a venue name or a city.
    if (eventData.format === 'in_person' || eventData.format === 'hybrid') {
      if (!eventData.location_name && !eventData.location_city) {
        throw new Error('In-person and hybrid events need a venue name or a city');
      }
    }

    if (eventData.format === 'virtual' || eventData.format === 'hybrid') {
      if (!eventData.meeting_url) {
        throw new Error('Meeting URL is required for virtual or hybrid events');
      }
    }

    if (eventData.max_attendees && eventData.max_attendees <= 0) {
      throw new Error('Max attendees must be greater than 0');
    }

    // Canonical event state. Default status to 'draft' and visibility to
    // 'public' when absent; a stale client that still sends only the legacy
    // is_public flag keeps its intended audience.
    if (eventData.status !== undefined && !isEventStatus(eventData.status)) {
      throw new Error('Invalid status: must be one of draft, published, cancelled, completed');
    }
    if (eventData.visibility !== undefined && !isEventVisibility(eventData.visibility)) {
      throw new Error('Invalid visibility: must be one of public, community, private');
    }
    const status: EventStatus = isEventStatus(eventData.status) ? eventData.status : 'draft';
    const visibility: EventVisibility = isEventVisibility(eventData.visibility)
      ? eventData.visibility
      : eventData.is_public === false
        ? 'private'
        : 'public';

    console.log('Validation passed, creating event...');

    // Generate SEO-friendly slug from title
    const eventYear = new Date(eventData.start_time).getFullYear();
    const { data: slugResult, error: slugError } = await supabase.rpc('generate_event_slug', {
      title: eventData.title,
      event_year: eventYear
    });
    if (slugError) {
      console.error('Slug generation error:', slugError);
    }
    const eventSlug = slugResult || null;
    console.log('Generated slug:', eventSlug);

    // Create event with all fields including new structured fields
    console.log('Event payload:', JSON.stringify(eventData, null, 2));
    
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        organizer_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.event_type,
        format: eventData.format,
        location_name: eventData.location_name || null,
        location_address: eventData.location_address || null,
        location_city: eventData.location_city || null,
        location_country: eventData.location_country || null,
        location_lat: eventData.location_lat ?? null,
        location_lng: eventData.location_lng ?? null,
        meeting_url: eventData.meeting_url || null,
        meeting_platform: eventData.meeting_platform || null,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        timezone: eventData.timezone || 'UTC',
        max_attendees: eventData.max_attendees || null,
        // (status, visibility) plus the transitional legacy mirror
        // (is_public / is_published / is_cancelled).
        ...eventStateWrite({ status, visibility }),
        requires_approval: eventData.requires_approval || false,
        allow_guests: eventData.allow_guests !== false,
        cover_image_url: eventData.cover_image_url || null,
        // SEO slug
        slug: eventSlug,
        // New structured fields
        subtitle: eventData.subtitle || null,
        short_description: eventData.short_description || null,
        agenda: eventData.agenda || [],
        speakers: eventData.speakers || [],
        dress_code: eventData.dress_code || null,
        tags: eventData.tags || [],
        group_id: eventData.group_id || null,
        is_flagship: eventData.is_flagship === true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to create event: ${insertError.message}`);
    }

    console.log('Event created successfully:', event.id);

    // Note: Feed post is automatically created by database trigger (trg_create_event_feed_post)
    // No need to manually insert here - the trigger ensures consistency across all event creation paths

    // Track event creation in analytics — a failure here must never fail the request
    const { error: analyticsError } = await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'event_created',
      event_metadata: {
        event_id: event.id,
        event_type: eventData.event_type,
        format: eventData.format,
      },
    });
    if (analyticsError) {
      console.error('Analytics insert error:', analyticsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-event function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

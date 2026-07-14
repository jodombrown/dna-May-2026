export interface Event {
  id: string;
  title: string;
  description: string;
  created_at: string;
  
  // New schema fields (optional for backward compatibility)
  organizer_id?: string;
  event_type?: 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'social' | 'other';
  format?: 'in_person' | 'virtual' | 'hybrid';
  location_name?: string | null;
  location_address?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  meeting_url?: string | null;
  meeting_platform?: string | null;
  start_time?: string;
  end_time?: string;
  time_confirmed?: boolean | null;
  timezone?: string;
  status?: string;
  visibility?: string;
  is_public?: boolean;
  requires_approval?: boolean;
  allow_guests?: boolean;
  is_cancelled?: boolean;
  cancellation_reason?: string | null;
  cover_image_url?: string | null;
  slug?: string | null;
  
  // Legacy fields (keeping for backward compatibility)
  date_time?: string;
  location?: string;
  type?: string;
  is_virtual?: boolean;
  is_featured?: boolean;
  max_attendees?: number | null;
  attendee_count?: number;
  image_url?: string;
  banner_url?: string;
  created_by?: string;
  updated_at?: string;
  waitlist_enabled?: boolean;
  registration_url?: string;
  
  creator_profile?: {
    id?: string;
    username?: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

export type EventAction = 'feature' | 'unfeature' | 'delete' | 'edit';

export interface EventFilters {
  searchTerm: string;
  typeFilter: string;
  activeTab: string;
}
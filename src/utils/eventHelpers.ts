import { Event } from '@/types/eventTypes';
import { Database } from '@/integrations/supabase/types';
import { formatEventPlace, pickEventPlace } from '@/lib/events/formatPlace';

type DbEvent = Database['public']['Tables']['events']['Row'];

/**
 * Transform database event to application Event format
 * Provides backward compatibility with legacy fields
 */
export const transformDbEvent = (dbEvent: DbEvent): Event => {
  const isVirtual = dbEvent.format === 'virtual' || dbEvent.format === 'hybrid';
  const location =
    dbEvent.location_name || formatEventPlace(pickEventPlace(dbEvent), 'compact');

  return {
    id: dbEvent.id,
    organizer_id: dbEvent.organizer_id,
    title: dbEvent.title,
    description: dbEvent.description,
    event_type: dbEvent.event_type as any,
    format: dbEvent.format as any,
    
    // Location fields
    location_name: dbEvent.location_name,
    location_address: dbEvent.location_address,
    location_city: dbEvent.location_city,
    location_state: dbEvent.location_state,
    location_country: dbEvent.location_country,
    location_lat: dbEvent.location_lat ? Number(dbEvent.location_lat) : null,
    location_lng: dbEvent.location_lng ? Number(dbEvent.location_lng) : null,
    
    // Virtual fields
    meeting_url: dbEvent.meeting_url,
    meeting_platform: dbEvent.meeting_platform,
    
    // Timing
    start_time: dbEvent.start_time,
    end_time: dbEvent.end_time,
    time_confirmed: dbEvent.time_confirmed,
    timezone: dbEvent.timezone,
    
    // Capacity
    max_attendees: dbEvent.max_attendees,
    
    // Media
    cover_image_url: dbEvent.cover_image_url,
    
    // Settings
    is_public: dbEvent.is_public,
    requires_approval: dbEvent.requires_approval,
    allow_guests: dbEvent.allow_guests,
    
    // Status
    is_cancelled: dbEvent.is_cancelled,
    cancellation_reason: dbEvent.cancellation_reason,
    
    created_at: dbEvent.created_at,
    updated_at: dbEvent.updated_at,
    
    // Legacy/compatibility fields
    date_time: dbEvent.start_time,
    location: location,
    type: dbEvent.event_type,
    is_virtual: isVirtual,
    image_url: dbEvent.cover_image_url,
    banner_url: dbEvent.cover_image_url,
    attendee_count: 0, // Will be computed from joins
    is_featured: false, // Can be added later
  };
};

/**
 * Transform application Event to database insert format
 */
export const transformToDbEvent = (event: Partial<Event> & { 
  title: string; 
  description: string; 
  organizer_id: string;
  start_time: string;
  end_time: string;
}): Database['public']['Tables']['events']['Insert'] => {
  // Determine format from legacy is_virtual or explicit format
  let format: 'in_person' | 'virtual' | 'hybrid' = 'in_person';
  if (event.format) {
    format = event.format as any;
  } else if (event.is_virtual) {
    format = 'virtual';
  }

  // Extract location components
  const locationParts = event.location?.split(',').map(s => s.trim()) || [];
  
  return {
    title: event.title,
    description: event.description,
    organizer_id: event.organizer_id,
    event_type: (event.event_type || event.type || 'other') as any,
    format,
    
    location_name: event.location_name || event.location || locationParts[0] || null,
    location_city: event.location_city || locationParts[0] || null,
    location_country: event.location_country || locationParts[1] || null,
    
    meeting_url: event.meeting_url || (format === 'virtual' ? event.location : null),
    meeting_platform: event.meeting_platform,
    
    start_time: event.start_time || event.date_time!,
    end_time: event.end_time,
    timezone: event.timezone || 'UTC',
    
    max_attendees: event.max_attendees,
    cover_image_url: event.cover_image_url || event.image_url || event.banner_url,
    
    is_public: event.is_public ?? true,
    requires_approval: event.requires_approval ?? false,
    allow_guests: event.allow_guests ?? false,
  };
};

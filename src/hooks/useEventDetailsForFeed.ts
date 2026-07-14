/**
 * DNA | FEED - Event Details Hook for Feed Cards
 * 
 * Fetches event details when rendering event cards in the feed.
 * The universal feed RPC doesn't include event-specific fields,
 * so we fetch them separately when needed.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeedEventDetails {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  format: 'in_person' | 'virtual' | 'hybrid' | null;
  location_name: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  meeting_url: string | null;
  meeting_platform: string | null;
  start_time: string | null;
  end_time: string | null;
  time_confirmed: boolean | null;
  date_confirmed: boolean | null;
  timezone: string | null;
  cover_image_url: string | null;
  max_attendees: number | null;
  event_type: string | null;
  slug: string | null;
  organizer_id: string;
  organizer_name?: string;
  organizer_avatar?: string;
  attendee_count: number;
  // Additional fields for expanded section
  is_free: boolean;
  ticket_price_cents: number | null;
  speakers: Array<{ name: string; title?: string; image_url?: string }> | null;
  tags: string[] | null;
}

export function useEventDetailsForFeed(eventId: string | null) {
  return useQuery({
    queryKey: ['event-details-feed', eventId],
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    queryFn: async (): Promise<FeedEventDetails | null> => {
      if (!eventId) return null;

      // Fetch event details with all needed fields
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          short_description,
          format,
          location_name,
          location_city,
          location_state,
          location_country,
          meeting_url,
          meeting_platform,
          start_time,
          end_time,
          time_confirmed,
          date_confirmed,
          timezone,
          cover_image_url,
          max_attendees,
          event_type,
          slug,
          organizer_id,
          speakers
        `)
        .eq('id', eventId)
        .single();

      if (error || !event) {
        return null;
      }

      // Fetch organizer profile
      const { data: organizer } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', event.organizer_id)
        .single();

      // Fetch attendee count
      const { count } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going');

      // Check for ticket types to determine if free
      const { data: ticketTypes } = await supabase
        .from('event_ticket_types')
        .select('price_cents')
        .eq('event_id', eventId)
        .order('price_cents', { ascending: true })
        .limit(1);

      const lowestPrice = ticketTypes?.[0]?.price_cents ?? 0;
      const isFree = lowestPrice === 0;

      // Parse speakers JSON safely
      let parsedSpeakers = null;
      if (event.speakers && Array.isArray(event.speakers)) {
        parsedSpeakers = event.speakers as Array<{ name: string; title?: string; image_url?: string }>;
      }

      return {
        ...event,
        organizer_name: organizer?.full_name || undefined,
        organizer_avatar: organizer?.avatar_url || undefined,
        attendee_count: count || 0,
        is_free: isFree,
        ticket_price_cents: isFree ? null : lowestPrice,
        speakers: parsedSpeakers,
        tags: null, // No tags column yet
      } as FeedEventDetails;
    },
  });
}

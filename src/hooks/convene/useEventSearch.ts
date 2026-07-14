/**
 * DNA | CONVENE — Event Search Hook
 * Debounced search across events with filter support.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_PLACE_SELECT } from '@/lib/events/formatPlace';
import { EVENT_TIME_SELECT } from '@/lib/events/eventTime';
import { useDebounce } from '@/hooks/useDebounce';

export interface EventSearchFilters {
  format?: 'virtual' | 'in_person' | 'hybrid' | null;
  timeRange?: 'today' | 'this_week' | 'this_month' | null;
  category?: string | null;
}

export interface SearchEventResult {
  id: string;
  title: string;
  slug: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  time_confirmed: boolean | null;
  date_confirmed: boolean | null;
  location_name: string | null;
  location_address: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  cover_image_url: string | null;
  event_type: string;
  format: string;
  max_attendees: number | null;
  organizer_id: string;
  attendee_count: number;
  organizer?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export function useEventSearch(searchTerm: string, filters: EventSearchFilters = {}) {
  const debouncedTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ['convene-search', debouncedTerm, filters],
    queryFn: async (): Promise<SearchEventResult[]> => {
      let query = supabase
        .from('events')
        .select(`
          id, title, slug, ${EVENT_TIME_SELECT}, ${EVENT_PLACE_SELECT},
          cover_image_url, event_type, format, max_attendees, organizer_id,
          event_attendees(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      // Text search
      if (debouncedTerm.trim()) {
        const term = debouncedTerm.trim();
        query = query.or(
          `title.ilike.%${term}%,description.ilike.%${term}%,location_city.ilike.%${term}%,location_name.ilike.%${term}%`
        );
      }

      // Format filter
      if (filters.format) {
        query = query.eq('format', filters.format);
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('event_type', filters.category as 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'social' | 'other');
      }

      // Time range filter
      if (filters.timeRange) {
        const now = new Date();
        let endDate: Date;
        switch (filters.timeRange) {
          case 'today':
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('start_time', endDate.toISOString());
            break;
          case 'this_week': {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('start_time', endDate.toISOString());
            break;
          }
          case 'this_month': {
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('start_time', endDate.toISOString());
            break;
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch organizer profiles
      const organizerIds = [...new Set((data || []).map((e: Record<string, unknown>) => e.organizer_id).filter(Boolean))] as string[];
      let organizerMap: Record<string, { id: string; full_name: string; avatar_url: string | null; username: string | null }> = {};
      if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', organizerIds);
        if (profiles) {
          organizerMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      return (data || []).map((e: Record<string, unknown>) => {
        const attendeesArr = e.event_attendees as Array<{ count: number }> | undefined;
        return {
          ...e,
          attendee_count: attendeesArr?.[0]?.count || 0,
          organizer: organizerMap[e.organizer_id as string] ?? null,
        } as SearchEventResult;
      });
    },
    enabled: debouncedTerm.trim().length > 0 || Object.values(filters).some(v => v !== null && v !== undefined),
    staleTime: 30_000,
  });
}

export function useTrendingEvents() {
  return useQuery({
    queryKey: ['convene-trending-events'],
    queryFn: async (): Promise<SearchEventResult[]> => {
      // Get events with most attendees, upcoming only
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, title, slug, ${EVENT_TIME_SELECT}, ${EVENT_PLACE_SELECT},
          cover_image_url, event_type, format, max_attendees, organizer_id,
          event_attendees(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      const organizerIds = [...new Set((data || []).map((e: Record<string, unknown>) => e.organizer_id).filter(Boolean))] as string[];
      let organizerMap: Record<string, { id: string; full_name: string; avatar_url: string | null; username: string | null }> = {};
      if (organizerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', organizerIds);
        if (profiles) {
          organizerMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      return (data || []).map((e: Record<string, unknown>) => {
        const attendeesArr = e.event_attendees as Array<{ count: number }> | undefined;
        return {
          ...e,
          attendee_count: attendeesArr?.[0]?.count || 0,
          organizer: organizerMap[e.organizer_id as string] ?? null,
        } as SearchEventResult;
      });
    },
    staleTime: 60_000,
  });
}

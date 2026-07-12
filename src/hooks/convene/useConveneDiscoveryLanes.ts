/**
 * DNA | CONVENE — Discovery Lane Queries
 * Fetches events organized into curated discovery sections:
 * - Hero (single featured)
 * - This Weekend
 * - Your Network Is Going
 * - Across the Diaspora (international)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay, nextSunday, isFriday, isSaturday, isSunday, addDays } from 'date-fns';
import { logger } from '@/lib/logger';

interface EventRow {
  id: string;
  title: string;
  slug: string | null;
  start_time: string;
  end_time: string | null;
  location_name: string | null;
  location_city: string | null;
  location_country: string | null;
  cover_image_url: string | null;
  event_type: string | null;
  format: string | null;
  is_cancelled: boolean;
  max_attendees: number | null;
  organizer_id: string | null;
  is_curated: boolean;
  curated_source: string | null;
  curated_source_url: string | null;
  description: string | null;
  short_description: string | null;
  event_attendees: Array<{ count: number }>;
  organizer?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

const BASE_SELECT = `
  id, title, slug, start_time, end_time, location_name, location_city,
  location_country, description, short_description,
  cover_image_url, event_type, format, is_cancelled, max_attendees,
  organizer_id, is_curated, curated_source, curated_source_url,
  event_attendees(count)
`;

async function attachOrganizers(events: Record<string, unknown>[]): Promise<EventRow[]> {
  const organizerIds = [...new Set(events.map(e => e.organizer_id).filter(Boolean))] as string[];
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
  return events.map(e => ({
    ...e,
    organizer: organizerMap[e.organizer_id as string] ?? null,
  })) as unknown as EventRow[];
}

/** Single hero event — the most imminent featured event */
export function useHeroEvent(selectedCity: string | null) {
  return useQuery({
    queryKey: ['convene-hero', selectedCity],
    queryFn: async (): Promise<EventRow | null> => {
      let query = supabase
        .from('events')
        .select(BASE_SELECT)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

      if (selectedCity) query = query.ilike('location_city', selectedCity);

      const { data, error } = await query;
      if (error || !data?.length) return null;
      const enriched = await attachOrganizers(data as Record<string, unknown>[]);
      return enriched[0] ?? null;
    },
    staleTime: 60_000,
  });
}

/** This Weekend — events from Friday 00:00 to Sunday 23:59 */
export function useWeekendEvents(selectedCity: string | null) {
  return useQuery({
    queryKey: ['convene-weekend', selectedCity],
    queryFn: async (): Promise<EventRow[]> => {
      const now = new Date();
      const today = now.getDay(); // 0=Sun

      // Calculate this weekend's range
      let fridayStart: Date;
      let sundayEnd: Date;

      if (isFriday(now) || isSaturday(now) || isSunday(now)) {
        // We're in the weekend already
        const daysUntilFriday = isFriday(now) ? 0 : isSaturday(now) ? -1 : -2;
        fridayStart = startOfDay(addDays(now, daysUntilFriday));
        sundayEnd = endOfDay(addDays(fridayStart, 2));
      } else {
        // Next weekend
        const daysUntilFriday = (5 - today + 7) % 7 || 7;
        fridayStart = startOfDay(addDays(now, daysUntilFriday));
        sundayEnd = endOfDay(addDays(fridayStart, 2));
      }

      let query = supabase
        .from('events')
        .select(BASE_SELECT)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', fridayStart.toISOString())
        .lte('start_time', sundayEnd.toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (selectedCity) query = query.ilike('location_city', selectedCity);

      const { data, error } = await query;
      if (error) return [];
      return attachOrganizers((data || []) as Record<string, unknown>[]);
    },
    staleTime: 120_000,
  });
}

/** Your Network Is Going — events where accepted connections have RSVP'd */
export function useNetworkEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['convene-network-going', user?.id],
    queryFn: async (): Promise<EventRow[]> => {
      if (!user?.id) return [];

      // Get user's accepted connection IDs
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!connections?.length) return [];

      const connectionIds = connections.map(c =>
        c.requester_id === user.id ? c.recipient_id : c.requester_id
      );

      // Get event_ids where connections are going
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('event_id')
        .in('user_id', connectionIds)
        .eq('status', 'going');

      if (!attendees?.length) return [];

      const eventIds = [...new Set(attendees.map(a => a.event_id))];

      // Fetch those events
      const { data: events, error } = await supabase
        .from('events')
        .select(BASE_SELECT)
        .in('id', eventIds)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) return [];
      return attachOrganizers((events || []) as Record<string, unknown>[]);
    },
    enabled: !!user?.id,
    staleTime: 120_000,
  });
}

/** Across the Diaspora — international events, no city filter */
export function useDiasporaEvents(excludeIds: string[] = []) {
  return useQuery({
    queryKey: ['convene-diaspora', excludeIds],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from('events')
        .select(BASE_SELECT)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(15);

      if (error) return [];

      // Filter out already-shown events and prioritize variety
      const filtered = (data || []).filter(
        (e: Record<string, unknown>) => !excludeIds.includes(e.id as string)
      );

      return attachOrganizers(filtered.slice(0, 8) as Record<string, unknown>[]);
    },
    staleTime: 120_000,
  });
}

/**
 * DNA | CONVENE — Organizer Stats Hook
 * Fetches aggregate metrics for the hosting tab stats header.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { eventStartMs } from '@/lib/events/eventTime';

export interface OrganizerStats {
  eventsHosted: number;
  totalAttendees: number;
  upcoming: number;
}

export function useOrganizerStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organizer-stats', user?.id],
    queryFn: async (): Promise<OrganizerStats> => {
      if (!user) return { eventsHosted: 0, totalAttendees: 0, upcoming: 0 };

      // Fetch all events by organizer in one query
      const { data: events, error } = await supabase
        .from('events')
        .select('id, start_time, is_cancelled, event_attendees(count)')
        .eq('organizer_id', user.id);

      if (error) throw error;

      const now = new Date();
      const eventsHosted = events?.length ?? 0;
      const upcoming = events?.filter((e) => {
        const start = eventStartMs(e);
        return !e.is_cancelled && start !== null && start > now.getTime();
      }).length ?? 0;
      const totalAttendees = events?.reduce((sum, e) => {
        const count = (e.event_attendees as Array<{ count: number }>)?.[0]?.count ?? 0;
        return sum + count;
      }, 0) ?? 0;

      return { eventsHosted, totalAttendees, upcoming };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

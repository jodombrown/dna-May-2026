/**
 * The DNA layer on a curated event — the reason the card exists.
 *
 * A curated event's facts (title, dates, city) belong to its source; what
 * DNA adds is who from the body is going: the total count and how many from
 * the viewer's own chapter (their city, profiles.current_city — the same
 * column Convene's city lanes read). Both are computed from the certified
 * primitives (event_attendees + profiles); nothing here writes schema.
 *
 * Signed-out viewers can't read attendee rows (RLS) — surfaces fall back to
 * the going_count carried by the get_public_event projection.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CuratedAttendee {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
}

export interface CuratedEventPulse {
  goingCount: number;
  /** Going members from the viewer's chapter (city). 0 when unknown. */
  chapterCount: number;
  /** The viewer's chapter city, when their profile names one. */
  chapterCity: string | null;
  attendees: CuratedAttendee[];
  isGoing: boolean;
}

const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();

// Enough rows to make the chapter count honest at community scale without
// unbounded reads; the total stays exact via the count header.
const ATTENDEE_SAMPLE = 200;

export function useCuratedEventPulse(eventId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['curated-event-pulse', eventId, user?.id],
    queryFn: async (): Promise<CuratedEventPulse> => {
      const [{ data: viewerProfile }, { data: rows, count, error }] = await Promise.all([
        supabase
          .from('profiles')
          .select('current_city, city')
          .eq('id', user!.id)
          .maybeSingle(),
        supabase
          .from('event_attendees')
          .select('user_id', { count: 'exact' })
          .eq('event_id', eventId!)
          .eq('status', 'going')
          .limit(ATTENDEE_SAMPLE),
      ]);
      if (error) throw error;

      const chapterCity = viewerProfile?.current_city || viewerProfile?.city || null;
      const userIds = (rows ?? []).map((r) => r.user_id);

      let attendees: CuratedAttendee[] = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, current_city, city')
          .in('id', userIds);
        attendees = (profiles ?? []).map((p) => ({
          id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          city: p.current_city || p.city || null,
        }));
      }

      const chapterCount = chapterCity
        ? attendees.filter((a) => norm(a.city) === norm(chapterCity)).length
        : 0;

      return {
        goingCount: count ?? userIds.length,
        chapterCount,
        chapterCity,
        attendees,
        isGoing: !!user && userIds.includes(user.id),
      };
    },
    enabled: !!eventId && !!user,
    staleTime: 60_000,
  });

  const goingMutation = useMutation({
    mutationFn: async (going: boolean) => {
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert(
          { event_id: eventId, user_id: user.id, status: going ? 'going' : 'not_going' },
          { onConflict: 'event_id,user_id' }
        );
      if (error) throw error;
      return going;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-event-pulse', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-rsvp', eventId, user?.id] });
    },
  });

  return {
    pulse: query.data ?? null,
    isLoading: query.isLoading,
    setGoing: goingMutation.mutate,
    isSettingGoing: goingMutation.isPending,
  };
}

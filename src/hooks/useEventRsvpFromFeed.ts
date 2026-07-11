/**
 * useEventRsvpFromFeed — one-tap RSVP straight from a feed card
 *
 * The feed's EventCard must never show a dead button: it RSVPs on its own,
 * without the page having to thread an onRsvp handler down to it. Same write
 * path as the event detail page (event_attendees upsert on event_id,user_id).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useEventRsvpFromFeed(eventId: string | null, userId: string) {
  const queryClient = useQueryClient();
  const enabled = !!eventId && !!userId;

  const { data: status } = useQuery({
    queryKey: ['feed-event-rsvp', eventId, userId],
    enabled,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', eventId!)
        .eq('user_id', userId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.status ?? null;
    },
  });

  const isAttending = status === 'going' || status === 'maybe';

  const mutation = useMutation({
    mutationFn: async (next: 'going' | 'not_going') => {
      if (!eventId || !userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert({ event_id: eventId, user_id: userId, status: next }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ['feed-event-rsvp', eventId, userId] });
      queryClient.invalidateQueries({ queryKey: ['event-details-feed', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
      toast(next === 'going' ? 'You’re going!' : 'RSVP removed');
    },
    onError: () => {
      toast.error('Could not update your RSVP — please try again.');
    },
  });

  return {
    isAttending,
    toggleRsvp: () => mutation.mutate(isAttending ? 'not_going' : 'going'),
    isPending: mutation.isPending,
  };
}

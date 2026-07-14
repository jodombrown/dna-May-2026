/**
 * "Notify me" on an event whose dates aren't announced yet.
 *
 * A row in event_date_subscriptions is a one-shot promise: when the event's
 * dates land (date_confirmed flips true with a real start_time), a database
 * trigger fans out a notification to every subscriber and clears the rows.
 * The client's only jobs are to know whether the viewer holds a promise and
 * to toggle it.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useEventDateNotify(eventId: string | null | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['event-date-notify', eventId, user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('event_date_subscriptions')
        .select('event_id')
        .eq('event_id', eventId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!eventId && !!user,
  });

  const mutation = useMutation({
    mutationFn: async (subscribe: boolean) => {
      if (subscribe) {
        const { error } = await supabase
          .from('event_date_subscriptions')
          .upsert({ event_id: eventId!, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_date_subscriptions')
          .delete()
          .eq('event_id', eventId!)
          .eq('user_id', user!.id);
        if (error) throw error;
      }
      return subscribe;
    },
    onSuccess: (subscribed) => {
      queryClient.setQueryData(queryKey, subscribed);
      if (subscribed) toast.success("We'll notify you when dates are announced");
    },
    onError: () => toast.error('Something went wrong — please try again'),
  });

  return {
    isSubscribed: query.data ?? false,
    toggle: () => mutation.mutate(!(query.data ?? false)),
    isToggling: mutation.isPending,
  };
}

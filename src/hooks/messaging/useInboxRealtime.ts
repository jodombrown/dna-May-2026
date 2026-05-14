import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to conversation row changes for the current user so that
 * tab badges (Primary / Requests / Spam / Archived) and the Unread/Mentions
 * filter chips stay accurate without a manual refresh.
 *
 * Performance Foundation rule 3: each channel includes a filter scoped
 * to the current user (user_a OR user_b), and we clean both up on unmount.
 *
 * Each effect run gets a unique suffix so React StrictMode double-mount
 * (or fast remount) cannot collide on the same channel topic and trigger
 * "subscribe can only be called a single time per channel instance".
 */
export function useInboxRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-archived'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-archived'] });
      queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
    };

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const chA = supabase
      .channel(`inbox:user_a:${userId}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_a=eq.${userId}`,
        },
        invalidate
      );

    const chB = supabase
      .channel(`inbox:user_b:${userId}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_b=eq.${userId}`,
        },
        invalidate
      );

    const chMentions = supabase
      .channel(`inbox:mentions:${userId}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_mentions',
          filter: `mentioned_user_id=eq.${userId}`,
        },
        invalidate
      );

    // Group activity: any change to my participant row (read cursor, pin/mute/archive,
    // newly added to a group). Filtered by user, so within budget.
    const chParticipants = supabase
      .channel(`inbox:participants:${userId}:${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${userId}`,
        },
        invalidate
      );

    // Subscribe each channel exactly once. Guard against any internal
    // re-entry by checking the channel's current state first.
    let cancelled = false;
    for (const ch of [chA, chB, chMentions, chParticipants]) {
      if (cancelled) break;
      if (ch.state === 'closed') {
        ch.subscribe();
      }
    }

    return () => {
      cancelled = true;
      supabase.removeChannel(chA);
      supabase.removeChannel(chB);
      supabase.removeChannel(chMentions);
      supabase.removeChannel(chParticipants);
    };
  }, [userId, queryClient]);
}

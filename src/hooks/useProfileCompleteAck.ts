/**
 * useProfileCompleteAck — tracks whether the user has dismissed the
 * "Profile at 100%" celebration card, persisted in
 * `user_onboarding_selections` (selection_type = 'profile_complete_acked').
 *
 * Behavior:
 *  - `acked` is true once the celebration has been dismissed.
 *  - `ack()` inserts the marker row (called from the celebration's Got it button).
 *  - The hook automatically deletes the marker if profile completion
 *    drops below 95%, so the next time the user reaches 100% they see
 *    the celebration once more.
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ACK_TYPE = 'profile_complete_acked';
const ACK_TITLE = 'v1';
const RESET_THRESHOLD = 95;

export function useProfileCompleteAck(currentPercent: number) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: acked = false, isLoading } = useQuery({
    queryKey: ['profile-complete-ack', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('user_onboarding_selections')
        .select('id')
        .eq('user_id', user!.id)
        .eq('selection_type', ACK_TYPE)
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    staleTime: 5 * 60_000,
  });

  const ack = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('user_onboarding_selections').insert([
        {
          user_id: user.id,
          selection_type: ACK_TYPE,
          target_title: ACK_TITLE,
          target_id: crypto.randomUUID(),
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-complete-ack', user?.id] });
    },
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from('user_onboarding_selections')
        .delete()
        .eq('user_id', user.id)
        .eq('selection_type', ACK_TYPE);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-complete-ack', user?.id] });
    },
  });

  // Auto-reset once when the user drops below the reset threshold.
  useEffect(() => {
    if (!user?.id || isLoading) return;
    if (acked && currentPercent < RESET_THRESHOLD && !clear.isPending) {
      clear.mutate();
    }
  }, [user?.id, acked, currentPercent, isLoading, clear]);

  return {
    acked,
    isLoading,
    ack: useCallback(() => ack.mutate(), [ack]),
  };
}

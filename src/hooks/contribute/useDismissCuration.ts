/**
 * CONTRIBUTE Phase 3 - useDismissCuration mutation hook.
 *
 * Optimistic: removes the card from the room cache before the server confirms,
 * rolls back on error, refetches on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contributeRoomService } from '@/services/contributeRoomService';
import type { RoomCuration } from '@/types/contribute';

function dayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDismissCuration() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryKey = ['contribute', 'room', userId, dayBucket()] as const;

  return useMutation({
    mutationFn: (curationId: string) => contributeRoomService.dismissCuration(curationId),
    onMutate: async (curationId: string) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<RoomCuration[]>(queryKey);
      qc.setQueryData<RoomCuration[]>(queryKey, (prev) =>
        (prev ?? []).filter((c) => c.curationId !== curationId),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}

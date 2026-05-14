import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contributeNeedService } from '@/services/contributeNeedService';
import type { NeedDeclaration, NeedFormValues } from '@/types/contribute';

const NEEDS_KEY = ['contribute', 'needs'] as const;

export function useOwnNeeds() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery<NeedDeclaration[]>({
    queryKey: [...NEEDS_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      return contributeNeedService.loadOwnNeeds(userId);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return { ...query, userId };
}

export function useUserNeeds(targetUserId: string | null | undefined) {
  return useQuery<NeedDeclaration[]>({
    queryKey: ['contribute', 'needs', 'user', targetUserId ?? null],
    queryFn: async () => {
      if (!targetUserId) return [];
      return contributeNeedService.getNeedsForUser(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 60_000,
  });
}

export function useNeedMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: [...NEEDS_KEY, userId] });
    if (userId) {
      qc.invalidateQueries({ queryKey: ['contribute', 'needs', 'user', userId] });
    }
  }, [qc, userId]);

  const createNeed = useMutation({
    mutationFn: async (vars: NeedFormValues) => {
      if (!userId) throw new Error('Not authenticated');
      return contributeNeedService.createNeed({ ...vars, userId });
    },
    onSuccess: invalidate,
  });

  const updateNeed = useMutation({
    mutationFn: (vars: { needId: string; patch: Partial<Omit<NeedFormValues, 'currency'>> }) =>
      contributeNeedService.updateNeed(vars.needId, vars.patch),
    onSuccess: invalidate,
  });

  const publishNeed = useMutation({
    mutationFn: (needId: string) => contributeNeedService.publishNeed(needId),
    onSuccess: invalidate,
  });

  const closeNeed = useMutation({
    mutationFn: (needId: string) => contributeNeedService.closeNeed(needId),
    onSuccess: invalidate,
  });

  const deleteNeed = useMutation({
    mutationFn: (needId: string) => contributeNeedService.deleteNeed(needId),
    onSuccess: invalidate,
  });

  return { createNeed, updateNeed, publishNeed, closeNeed, deleteNeed, invalidate };
}

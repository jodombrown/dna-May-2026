import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contributeManifestService } from '@/services/contributeManifestService';
import type { CurrencyStance, StanceFormValues } from '@/types/contribute';

const MANIFEST_KEY = ['contribute', 'manifest'] as const;

export function useStanceMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...MANIFEST_KEY, userId] });
    if (userId) {
      qc.invalidateQueries({ queryKey: ['contribute', 'manifest', 'user', userId] });
    }
  };

  const createStance = useMutation({
    mutationFn: async (vars: {
      values: StanceFormValues;
      manifestId: string;
      displayOrder: number;
    }): Promise<CurrencyStance> => {
      if (!userId) throw new Error('Sign in to add a stance.');
      return contributeManifestService.createStance({
        ...vars.values,
        manifestId: vars.manifestId,
        userId,
        displayOrder: vars.displayOrder,
      });
    },
    onSuccess: invalidate,
  });

  const updateStance = useMutation({
    mutationFn: (vars: {
      stanceId: string;
      values: Partial<Omit<StanceFormValues, 'currency'>>;
    }) => contributeManifestService.updateStance(vars.stanceId, vars.values),
    onSuccess: invalidate,
  });

  const archiveStance = useMutation({
    mutationFn: (stanceId: string) => contributeManifestService.archiveStance(stanceId),
    onSuccess: invalidate,
  });

  const unarchiveStance = useMutation({
    mutationFn: (stanceId: string) => contributeManifestService.unarchiveStance(stanceId),
    onSuccess: invalidate,
  });

  const reorderStances = useMutation({
    mutationFn: (orderedIds: string[]) =>
      contributeManifestService.reorderStances(orderedIds),
    onSuccess: invalidate,
  });

  return {
    createStance,
    updateStance,
    archiveStance,
    unarchiveStance,
    reorderStances,
  };
}

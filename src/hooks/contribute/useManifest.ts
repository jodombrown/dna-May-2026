import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contributeManifestService } from '@/services/contributeManifestService';
import type { ManifestWithStances } from '@/types/contribute';

const MANIFEST_KEY = ['contribute', 'manifest'] as const;

export function useOwnManifest() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery<ManifestWithStances | null>({
    queryKey: [...MANIFEST_KEY, userId],
    queryFn: async () => {
      if (!userId) return null;
      return contributeManifestService.loadOwnManifest(userId);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return { ...query, userId };
}

export function useUserManifest(targetUserId: string | null | undefined) {
  return useQuery<ManifestWithStances | null>({
    queryKey: ['contribute', 'manifest', 'user', targetUserId ?? null],
    queryFn: async () => {
      if (!targetUserId) return null;
      return contributeManifestService.getManifestForUser(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 60_000,
  });
}

export function useManifestMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: [...MANIFEST_KEY, userId] });
    if (userId) {
      qc.invalidateQueries({ queryKey: ['contribute', 'manifest', 'user', userId] });
    }
  }, [qc, userId]);

  const updateHeadline = useMutation({
    mutationFn: async (vars: { manifestId: string; headline: string }) => {
      await contributeManifestService.updateHeadline(vars.manifestId, vars.headline);
    },
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: () => contributeManifestService.publishManifest(),
    onSuccess: invalidate,
  });

  const unpublish = useMutation({
    mutationFn: (manifestId: string) =>
      contributeManifestService.unpublishManifest(manifestId),
    onSuccess: invalidate,
  });

  return { updateHeadline, publish, unpublish, invalidate };
}

/**
 * Debounced headline autosave. Returns a setter that schedules a save 600ms
 * after the last change. Cancels pending saves on unmount.
 */
export function useHeadlineAutosave(
  manifestId: string | null,
  onError: (err: unknown) => void,
) {
  const { updateHeadline } = useManifestMutations();

  const trigger = useCallback(
    (headline: string) => {
      if (!manifestId) return;
      updateHeadline.mutate(
        { manifestId, headline },
        { onError },
      );
    },
    [manifestId, updateHeadline, onError],
  );

  return trigger;
}

/**
 * useDebounced - returns a debounced version of a callback (600ms by default).
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delay = 600,
) {
  const handle = { current: null as ReturnType<typeof setTimeout> | null };

  useEffect(
    () => () => {
      if (handle.current) clearTimeout(handle.current);
    },
    // handle is a closure-stable ref-like object
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (handle.current) clearTimeout(handle.current);
      handle.current = setTimeout(() => fn(...args), delay);
    },
    // fn intentionally captured fresh each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, fn],
  );
}

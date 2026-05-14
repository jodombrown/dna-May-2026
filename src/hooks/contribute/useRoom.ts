/**
 * CONTRIBUTE Phase 3 - useRoom and useRoomReadiness hooks.
 *
 * The dayBucket in the query key (UTC YYYY-MM-DD) is the key correctness
 * detail: without it, the cache would serve yesterday's room indefinitely.
 *
 * Score gating happens here, not on the SQL side. The full curation set
 * stays in the database for analytics and matching-engine tuning; the UI
 * filters at the hook level via ROOM_SCORE_CUTOFF.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { contributeRoomService } from '@/services/contributeRoomService';
import {
  ROOM_SCORE_CUTOFF,
  type RoomCuration,
  type RoomReadiness,
  type RoomSubjectProfile,
} from '@/types/contribute';

function dayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useRoom() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const day = dayBucket();

  const query = useQuery<RoomCuration[]>({
    queryKey: ['contribute', 'room', userId, day],
    queryFn: () => contributeRoomService.getRoomForViewer(),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const visible = useMemo(
    () => (query.data ?? []).filter((c) => c.score >= ROOM_SCORE_CUTOFF),
    [query.data],
  );

  return { ...query, curations: visible, allCurations: query.data ?? [] };
}

export function useRoomReadiness() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<RoomReadiness>({
    queryKey: ['contribute', 'room', 'readiness', userId],
    queryFn: () => contributeRoomService.getRoomReadiness(),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useRoomSubjects(userIds: string[]) {
  const day = dayBucket();
  const key = useMemo(() => Array.from(new Set(userIds)).sort().join(','), [userIds]);

  return useQuery<Record<string, RoomSubjectProfile>>({
    queryKey: ['contribute', 'room', 'subjects', day, key],
    queryFn: () => contributeRoomService.getSubjectProfiles(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60_000,
  });
}

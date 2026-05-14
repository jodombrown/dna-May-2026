import { useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRoom, useRoomReadiness, useRoomSubjects } from '@/hooks/contribute/useRoom';
import { useDismissCuration } from '@/hooks/contribute/useDismissCuration';
import { contributeRoomService } from '@/services/contributeRoomService';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import { PeopleZone } from './PeopleZone';
import { MatchedNeedsZone } from './MatchedNeedsZone';
import { RoomEmptyStates } from './RoomEmptyStates';
import type { RoomCuration } from '@/types/contribute';

interface RoomHubProps {
  onOpenManifestEditor: () => void;
  onOpenStanceEditor: () => void;
}

/**
 * The CONTRIBUTE Phase 3 hub surface. Orchestrates readiness, curation
 * fetching, zone rendering, and dismiss flow. Mounted on /dna/contribute
 * between the Manifest section and the Your Needs section.
 */
export function RoomHub({ onOpenManifestEditor, onOpenStanceEditor }: RoomHubProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const readinessQuery = useRoomReadiness();
  const roomQuery = useRoom();
  const dismiss = useDismissCuration();

  const subjectIds = useMemo(
    () => roomQuery.curations.map((c) => c.subjectUserId),
    [roomQuery.curations],
  );
  const subjectsQuery = useRoomSubjects(subjectIds);
  const subjects = subjectsQuery.data ?? {};

  // Curating retry: if readiness is good but no curations today, kick the
  // curator once and refetch. The Phase 3 SQL also auto-runs on first call to
  // get_room_for_viewer; this is the second-chance path.
  const retriedRef = useRef(false);
  useEffect(() => {
    const r = readinessQuery.data;
    if (!r) return;
    const ready = r.hasManifest && r.manifestPublished && r.activeStanceCount > 0;
    if (!ready) return;
    if (r.curationCountToday > 0) return;
    if (retriedRef.current) return;
    retriedRef.current = true;
    const t = setTimeout(async () => {
      try {
        const count = await contributeRoomService.curateRoomForUser(5);
        trackContributeEvent({
          type: 'room_curation_triggered',
          trigger: 'auto_first_visit_today',
          curation_count: count,
        });
      } catch {
        // swallow - the empty state will surface the failure mode visually
      } finally {
        qc.invalidateQueries({ queryKey: ['contribute', 'room', 'readiness', user?.id ?? null] });
        qc.invalidateQueries({ queryKey: ['contribute', 'room', user?.id ?? null] });
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [readinessQuery.data, qc, user?.id]);

  // Mount-time analytics (once readiness resolves)
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    if (readinessQuery.isLoading || roomQuery.isLoading) return;
    openedRef.current = true;
    const r = readinessQuery.data;
    const state = pickReadinessState(r, roomQuery.curations.length);
    const peopleKinds: RoomCuration['kind'][] = ['their_stance_my_need', 'mutual', 'tag_affinity'];
    const mutualCount = roomQuery.curations.filter((c) => c.kind === 'mutual').length;
    const stanceMatchCount = roomQuery.curations.filter((c) => peopleKinds.includes(c.kind)).length;
    const needMatchCount = roomQuery.curations.filter((c) => c.kind === 'their_need_my_stance').length;
    trackContributeEvent({
      type: 'room_hub_opened',
      readiness_state: state,
      curation_count: roomQuery.curations.length,
      mutual_count: mutualCount,
      stance_match_count: stanceMatchCount,
      need_match_count: needMatchCount,
    });
  }, [readinessQuery.isLoading, roomQuery.isLoading, readinessQuery.data, roomQuery.curations]);

  const handleDismiss = (curationId: string) => {
    const curation = roomQuery.curations.find((c) => c.curationId === curationId);
    if (curation) {
      trackContributeEvent({
        type: 'curation_dismissed',
        curation_id: curationId,
        kind: curation.kind,
        currency: curation.currency,
        source: 'card',
      });
    }
    dismiss.mutate(curationId, {
      onSuccess: () => toast({ title: 'Dismissed for today' }),
      onError: () => toast({ title: 'Could not dismiss', variant: 'destructive' }),
    });
  };

  if (readinessQuery.isLoading) {
    return (
      <section aria-label="Today's room" className="rounded-lg border border-border/70 bg-background p-5">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-muted/70" />
      </section>
    );
  }

  const r = readinessQuery.data;
  if (!r || !r.hasManifest) {
    return (
      <RoomEmptyStates
        kind="no_manifest"
        readiness={r}
        onOpenManifestEditor={onOpenManifestEditor}
        onOpenStanceEditor={onOpenStanceEditor}
      />
    );
  }
  if (!r.manifestPublished) {
    return (
      <RoomEmptyStates
        kind="unpublished_manifest"
        readiness={r}
        onOpenManifestEditor={onOpenManifestEditor}
        onOpenStanceEditor={onOpenStanceEditor}
      />
    );
  }
  if (r.activeStanceCount === 0) {
    return (
      <RoomEmptyStates
        kind="no_stances"
        readiness={r}
        onOpenManifestEditor={onOpenManifestEditor}
        onOpenStanceEditor={onOpenStanceEditor}
      />
    );
  }
  if (roomQuery.isLoading || roomQuery.curations.length === 0) {
    return (
      <RoomEmptyStates
        kind="curating"
        readiness={r}
        onOpenManifestEditor={onOpenManifestEditor}
        onOpenStanceEditor={onOpenStanceEditor}
      />
    );
  }

  const peopleCurations = roomQuery.curations.filter(
    (c) => c.kind === 'their_stance_my_need' || c.kind === 'mutual' || c.kind === 'tag_affinity',
  );
  const needCurations = roomQuery.curations.filter((c) => c.kind === 'their_need_my_stance');

  return (
    <section aria-label="Today's room" className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Today's room</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated for you. Refreshed daily.
          </p>
        </div>
        <span className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Curated today
        </span>
      </header>

      <PeopleZone curations={peopleCurations} subjects={subjects} onDismiss={handleDismiss} />
      <MatchedNeedsZone curations={needCurations} subjects={subjects} onDismiss={handleDismiss} />
    </section>
  );
}

function pickReadinessState(
  r: { hasManifest: boolean; manifestPublished: boolean; activeStanceCount: number } | undefined,
  curationCount: number,
): 'no_manifest' | 'unpublished_manifest' | 'no_stances' | 'curating' | 'ready' {
  if (!r || !r.hasManifest) return 'no_manifest';
  if (!r.manifestPublished) return 'unpublished_manifest';
  if (r.activeStanceCount === 0) return 'no_stances';
  if (curationCount === 0) return 'curating';
  return 'ready';
}

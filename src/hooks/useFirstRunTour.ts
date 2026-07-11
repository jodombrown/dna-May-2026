/**
 * useFirstRunTour — 5-step action tour persisted to
 * `user_onboarding_selections`. Each step corresponds to a concrete
 * profile / engagement action; when the user finishes it (or explicitly
 * marks it done) we insert a row so the tour is resumable across
 * devices and sessions.
 *
 * Storage model (uses the existing table as-is):
 *   selection_type = 'first_run_tour_step'   target_title = <step id>
 *   selection_type = 'first_run_tour_skip'   target_title = 'all'
 *
 * The step is considered auto-complete when its underlying profile
 * field is filled in (checked against `useOnboardingState.completed`).
 * That means the tour reflects real progress even if the user finished
 * the action outside the tour surface.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingState } from './useOnboardingState';

export type TourStepId =
  | 'sectors'
  | 'bio'
  | 'skills'
  | 'first_connection'
  | 'first_event';

export interface TourStep {
  id: TourStepId;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  /** profileCompletion field that satisfies this step, if any */
  satisfiesField?: string;
  /** Short line rendered under the step when it's not yet complete. */
  requirement: string;
}

export const FIRST_RUN_TOUR_STEPS: TourStep[] = [
  {
    id: 'sectors',
    title: 'Pick your sectors',
    description: 'Tell DIA what industries you care about so the feed and matches make sense.',
    ctaLabel: 'Add industries',
    href: '/dna/profile/edit#professional',
    satisfiesField: 'industries',
    requirement: 'Select at least one industry in your profile.',
  },
  {
    id: 'bio',
    title: 'Write a short bio',
    description: 'A few sentences about who you are and what you\'re building.',
    ctaLabel: 'Write bio',
    href: '/dna/profile/edit#professional',
    satisfiesField: 'bio',
    requirement: 'Add a bio (a couple of sentences) in your profile.',
  },
  {
    id: 'skills',
    title: 'List three skills',
    description: 'Skills unlock matches, collaboration invites, and Contribute opportunities.',
    ctaLabel: 'Add skills',
    href: '/dna/profile/edit#discovery',
    satisfiesField: 'skills',
    requirement: 'Add at least one skill in your profile.',
  },
  {
    id: 'first_connection',
    title: 'Make your first connection',
    description: 'DIA has suggested people you should meet. Send one request.',
    ctaLabel: 'Discover people',
    href: '/dna/connect/discover',
    requirement: 'Send and get one connection request accepted.',
  },
  {
    id: 'first_event',
    title: 'Find an event',
    description: 'Browse upcoming diaspora events and RSVP to one.',
    ctaLabel: 'Browse events',
    href: '/dna/convene/events',
    requirement: 'RSVP to at least one event.',
  },
];

interface SelectionRow {
  selection_type: string;
  target_title: string | null;
}

const STEP_TYPE = 'first_run_tour_step';
const SKIP_TYPE = 'first_run_tour_skip';
const COMPLETE_ACK_TYPE = 'first_run_tour_complete_acked';

export function useFirstRunTour() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { completed } = useOnboardingState();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['first-run-tour', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<SelectionRow[]> => {
      const { data, error } = await supabase
        .from('user_onboarding_selections')
        .select('selection_type,target_title')
        .eq('user_id', user!.id)
        .in('selection_type', [STEP_TYPE, SKIP_TYPE, COMPLETE_ACK_TYPE]);
      if (error) throw error;
      return (data ?? []) as SelectionRow[];
    },
    staleTime: 60_000,
  });

  // Real-signal detection so a step is marked done even if the user
  // performed the action outside this tour surface (e.g. accepted a
  // connection request from the pulse, or RSVP'd from Convene).
  const { data: signals } = useQuery({
    queryKey: ['first-run-tour-signals', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const [conn, evt] = await Promise.all([
        supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`),
        supabase
          .from('event_attendees')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id),
      ]);
      return {
        hasConnection: (conn.count ?? 0) > 0,
        hasEvent: (evt.count ?? 0) > 0,
      };
    },
  });

  // Realtime: invalidate signals + tour state the moment the user's
  // connections or event RSVPs change, so the panel updates without a
  // page refresh. The profile table already has its own realtime
  // subscription in useProfile, which drives satisfiesField steps.
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;
    const invalidateSignals = () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour-signals', uid] });
    };
    const connCh = supabase
      .channel(`first-run-tour:conn:${uid}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'connections',
        filter: `requester_id=eq.${uid}`,
      }, invalidateSignals)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'connections',
        filter: `recipient_id=eq.${uid}`,
      }, invalidateSignals)
      .subscribe();
    const evtCh = supabase
      .channel(`first-run-tour:evt:${uid}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'event_attendees',
        filter: `user_id=eq.${uid}`,
      }, invalidateSignals)
      .subscribe();
    return () => {
      supabase.removeChannel(connCh);
      supabase.removeChannel(evtCh);
    };
  }, [user?.id, qc]);

  const completedFieldIds = useMemo(
    () => new Set(completed.map((c) => c.field)),
    [completed],
  );

  const explicitlyDone = useMemo(
    () =>
      new Set(
        rows
          .filter((r) => r.selection_type === STEP_TYPE && r.target_title)
          .map((r) => r.target_title as string),
      ),
    [rows],
  );

  const skipped = useMemo(
    () => rows.some((r) => r.selection_type === SKIP_TYPE),
    [rows],
  );

  const stepStates = useMemo(
    () =>
      FIRST_RUN_TOUR_STEPS.map((s) => {
        let done =
          explicitlyDone.has(s.id) ||
          (s.satisfiesField ? completedFieldIds.has(s.satisfiesField) : false);
        if (!done && s.id === 'first_connection' && signals?.hasConnection) done = true;
        if (!done && s.id === 'first_event' && signals?.hasEvent) done = true;
        return { step: s, done };
      }),
    [completedFieldIds, explicitlyDone, signals],
  );

  const completedCount = stepStates.filter((s) => s.done).length;
  const nextStep = stepStates.find((s) => !s.done)?.step ?? null;

  const markStepDone = useMutation({
    mutationFn: async (stepId: TourStepId) => {
      if (!user?.id) return;
      await supabase.from('user_onboarding_selections').insert([
        {
          user_id: user.id,
          selection_type: STEP_TYPE,
          target_title: stepId,
          target_id: crypto.randomUUID(),
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour', user?.id] });
    },
  });

  const skipTour = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('user_onboarding_selections').insert([
        {
          user_id: user.id,
          selection_type: SKIP_TYPE,
          target_title: 'all',
          target_id: crypto.randomUUID(),
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour', user?.id] });
    },
  });

  const reopenTour = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from('user_onboarding_selections')
        .delete()
        .eq('user_id', user.id)
        .eq('selection_type', SKIP_TYPE);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour', user?.id] });
    },
  });

  const resetTour = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      // Wipe both the skip marker and every persisted step marker so
      // the tour comes back in its untouched state. Steps whose
      // underlying profile field is filled will still show as done
      // via satisfiesField auto-detect - that's intentional (real
      // progress isn't undone by resetting the tour).
      await supabase
        .from('user_onboarding_selections')
        .delete()
        .eq('user_id', user.id)
        .in('selection_type', [SKIP_TYPE, STEP_TYPE]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour', user?.id] });
    },
  });

  const isComplete = completedCount === FIRST_RUN_TOUR_STEPS.length;
  const completeAcked = useMemo(
    () => rows.some((r) => r.selection_type === COMPLETE_ACK_TYPE),
    [rows],
  );

  const ackComplete = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('user_onboarding_selections').insert([
        {
          user_id: user.id,
          selection_type: COMPLETE_ACK_TYPE,
          target_title: 'v1',
          target_id: crypto.randomUUID(),
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['first-run-tour', user?.id] });
    },
  });

  // Show while there's still work OR while we're celebrating the finish.
  const shouldShow =
    !!user && !isLoading && !skipped && (!isComplete || !completeAcked);

  return {
    isLoading,
    stepStates,
    nextStep,
    completedCount,
    totalCount: FIRST_RUN_TOUR_STEPS.length,
    skipped,
    isComplete,
    completeAcked,
    shouldShow,
    markStepDone: useCallback(
      (id: TourStepId) => markStepDone.mutate(id),
      [markStepDone],
    ),
    skipTour: useCallback(() => skipTour.mutate(), [skipTour]),
    reopenTour: useCallback(() => reopenTour.mutate(), [reopenTour]),
    resetTour: useCallback(() => resetTour.mutate(), [resetTour]),
    ackComplete: useCallback(() => ackComplete.mutate(), [ackComplete]),
    resetPending: resetTour.isPending,
  };
}

// ---------------------------------------------------------------------------
// Pure derivation helper (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Derive per-step done state given the persisted explicit-done step ids
 * and the set of profile completion field ids the user has satisfied.
 */
export function deriveTourStepStates(
  explicitlyDone: ReadonlySet<string>,
  completedFieldIds: ReadonlySet<string>,
): Array<{ step: TourStep; done: boolean }> {
  return FIRST_RUN_TOUR_STEPS.map((s) => ({
    step: s,
    done:
      explicitlyDone.has(s.id) ||
      (s.satisfiesField ? completedFieldIds.has(s.satisfiesField) : false),
  }));
}


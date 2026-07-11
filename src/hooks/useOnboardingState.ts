/**
 * useOnboardingState — Adaptive onboarding lifecycle hook
 *
 * Returns the user's current onboarding lifecycle stage plus the
 * derived profile completion percentage and prioritised missing fields.
 *
 * Stages:
 *  - `loading`          — auth or profile query still resolving
 *  - `signed_out`       — no authenticated user
 *  - `first_run`        — wizard not yet completed (`onboarding_completed_at` is null)
 *  - `getting_started`  — wizard done, completion < 60%
 *  - `active`           — 60% ≤ completion < 95%
 *  - `complete`         — completion ≥ 95%
 *
 * This is the single source of truth every adaptive surface should read
 * from (right rail, hero copy, welcome overlay, empty states, gates).
 */

import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateProfileCompletionPts,
  getMissingFields,
  getCompletedFields,
  type ProfileFieldCheck,
} from '@/lib/profileCompletion';

export type OnboardingStage =
  | 'loading'
  | 'signed_out'
  | 'first_run'
  | 'getting_started'
  | 'active'
  | 'complete';

export interface OnboardingState {
  stage: OnboardingStage;
  percent: number;
  missing: ProfileFieldCheck[];
  completed: ProfileFieldCheck[];
  nextField: ProfileFieldCheck | null;
  wizardCompleted: boolean;
  profileId: string | null;
}

const GETTING_STARTED_MAX = 60;
// `complete` only fires at a true 100%. This is intentional: users
// want a quick win once they hit 100 and shouldn't see any percentage
// or checklist again until their completion drops back below 100.
const ACTIVE_MAX = 100;


export function useOnboardingState(): OnboardingState {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  return useMemo<OnboardingState>(() => {
    if (authLoading) {
      return emptyState('loading');
    }
    if (!user) {
      return emptyState('signed_out');
    }
    if (profileLoading || !profile) {
      return emptyState('loading');
    }

    const percent = calculateProfileCompletionPts(profile as any);
    const missing = getMissingFields(profile as any);
    const completed = getCompletedFields(profile as any);
    const wizardCompleted = Boolean((profile as any).onboarding_completed_at);

    let stage: OnboardingStage;
    if (!wizardCompleted) {
      stage = 'first_run';
    } else if (percent >= ACTIVE_MAX) {
      stage = 'complete';
    } else if (percent >= GETTING_STARTED_MAX) {
      stage = 'active';
    } else {
      stage = 'getting_started';
    }

    return {
      stage,
      percent,
      missing,
      completed,
      nextField: missing[0] ?? null,
      wizardCompleted,
      profileId: user.id,
    };
  }, [user, authLoading, profile, profileLoading]);
}

function emptyState(stage: OnboardingStage): OnboardingState {
  return {
    stage,
    percent: 0,
    missing: [],
    completed: [],
    nextField: null,
    wizardCompleted: false,
    profileId: null,
  };
}

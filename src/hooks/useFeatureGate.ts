/**
 * useFeatureGate — evaluate a feature gate for the current user.
 *
 * Returns the same shape as `evaluateFeatureGate` plus a `loading`
 * flag while the profile query is in flight. Components should render
 * `<FeatureGateNotice />` (or their own copy) when `!allowed`.
 */

import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { evaluateFeatureGate, type GateResult } from '@/utils/featureGate';
import type { FeatureKey } from '@/config/profileGates';

export interface UseFeatureGateResult extends GateResult {
  loading: boolean;
}

export function useFeatureGate(feature: FeatureKey): UseFeatureGateResult {
  const { data: profile, isLoading } = useProfile();

  return useMemo(() => {
    const result = evaluateFeatureGate(profile ?? null, feature);
    return { ...result, loading: isLoading };
  }, [profile, isLoading, feature]);
}

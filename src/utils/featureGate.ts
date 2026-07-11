import { FEATURE_GATES, type FeatureKey } from '@/config/profileGates';
import {
  calculateProfileCompletionPts,
  getProfileFieldChecks,
} from '@/lib/profileCompletion';

export interface GateResult {
  feature: FeatureKey;
  label: string;
  allowed: boolean;
  percent: number;
  minPercent: number;
  missing: { field: string; label: string }[];
  reason: string;
}

export function evaluateFeatureGate(
  profile: unknown,
  feature: FeatureKey,
): GateResult {
  const spec = FEATURE_GATES[feature];
  const percent = calculateProfileCompletionPts(profile as any);
  const checks = getProfileFieldChecks(profile as any);
  const byField = new Map(checks.map((c) => [c.field, c]));

  const missing = spec.fields
    .map((f) => byField.get(f))
    .filter((c) => !!c && !c.complete)
    .map((c) => ({ field: c!.field, label: c!.label }));

  const allowed = percent >= spec.minPercent && missing.length === 0;

  return {
    feature,
    label: spec.label,
    allowed,
    percent,
    minPercent: spec.minPercent,
    missing,
    reason: spec.reason,
  };
}

/** @deprecated use `evaluateFeatureGate(...).missing.map(m => m.field)` */
export function missingFieldsForFeature(profile: unknown, feature: FeatureKey): string[] {
  return evaluateFeatureGate(profile, feature).missing.map((m) => m.field);
}

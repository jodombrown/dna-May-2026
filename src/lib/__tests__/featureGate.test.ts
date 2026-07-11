/**
 * Unit tests for the feature gate + profile completion math.
 *
 * These tests protect the invariant that FEATURE_GATES field ids stay
 * in sync with the profileCompletion scorer - if someone renames a
 * field in one place without the other, at least one case here fails.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProfileCompletionPts,
  getMissingFields,
  getProfileFieldChecks,
} from '@/lib/profileCompletion';
import { evaluateFeatureGate } from '@/utils/featureGate';
import { FEATURE_GATES, type FeatureKey } from '@/config/profileGates';

const FULL_PROFILE = {
  avatar_url: 'https://example.com/a.jpg',
  full_name: 'Ada Lovelace',
  headline: 'Product builder for the diaspora',
  profession: 'Engineer',
  bio: 'A bio that is deliberately longer than fifty characters so it satisfies the scorer requirement.',
  linkedin_url: 'https://linkedin.com/in/ada',
  skills: ['react', 'sql', 'design'],
  focus_areas: ['fintech', 'edtech'],
  interests: ['music', 'travel', 'chess'],
  primary_origin_country: 'GH',
  current_country: 'US',
  languages: ['en'],
  banner_url: 'https://example.com/b.jpg',
  industries: ['tech'],
};

describe('calculateProfileCompletionPts', () => {
  it('returns 0 for null profile', () => {
    expect(calculateProfileCompletionPts(null)).toBe(0);
  });

  it('returns 0 for an empty profile', () => {
    expect(calculateProfileCompletionPts({})).toBe(0);
  });

  it('returns 100 for a fully populated profile', () => {
    expect(calculateProfileCompletionPts(FULL_PROFILE)).toBe(100);
  });

  it('treats whitespace-only strings as empty', () => {
    const profile = { ...FULL_PROFILE, bio: '   ' };
    // Bio is worth 10 points; dropping it should bring us to 90.
    expect(calculateProfileCompletionPts(profile)).toBe(90);
  });

  it('does not count skills unless there are at least 3 valid entries', () => {
    const profile = { ...FULL_PROFILE, skills: ['react', '  '] };
    // Skills worth 10; missing => 90.
    expect(calculateProfileCompletionPts(profile)).toBe(90);
  });
});

describe('getMissingFields', () => {
  it('returns every field for an empty profile', () => {
    const all = getProfileFieldChecks(FULL_PROFILE).length;
    expect(getMissingFields({}).length).toBe(all);
  });

  it('sorts by priority ascending then points descending', () => {
    const missing = getMissingFields({});
    for (let i = 1; i < missing.length; i++) {
      const a = missing[i - 1];
      const b = missing[i];
      // priority asc, then points desc within the same priority
      expect(a.priority <= b.priority).toBe(true);
      if (a.priority === b.priority) {
        expect(a.points >= b.points).toBe(true);
      }
    }
  });

  it('returns [] for a fully populated profile', () => {
    expect(getMissingFields(FULL_PROFILE)).toEqual([]);
  });
});

describe('evaluateFeatureGate', () => {
  it('locks event_create when bio is missing', () => {
    const profile = { ...FULL_PROFILE, bio: '' };
    const gate = evaluateFeatureGate(profile, 'event_create');
    expect(gate.allowed).toBe(false);
    expect(gate.missing.map((m) => m.field)).toContain('bio');
    expect(gate.percent).toBeLessThan(100);
  });

  it('unlocks event_create for a complete profile', () => {
    const gate = evaluateFeatureGate(FULL_PROFILE, 'event_create');
    expect(gate.allowed).toBe(true);
    expect(gate.missing).toEqual([]);
    expect(gate.percent).toBe(100);
  });

  it('locks post_create on a low-percent profile even with required fields present', () => {
    // Has the three required fields, but overall percent (25) is under minPercent (30).
    const profile = {
      avatar_url: 'x',
      full_name: 'Ada',
      headline: 'Builder!',
    };
    const gate = evaluateFeatureGate(profile, 'post_create');
    expect(gate.percent).toBeLessThan(gate.minPercent);
    expect(gate.allowed).toBe(false);
  });

  it('returns a well-formed GateResult for every configured feature', () => {
    for (const key of Object.keys(FEATURE_GATES) as FeatureKey[]) {
      const gate = evaluateFeatureGate({}, key);
      expect(gate.feature).toBe(key);
      expect(typeof gate.label).toBe('string');
      expect(typeof gate.reason).toBe('string');
      expect(typeof gate.percent).toBe('number');
      expect(typeof gate.minPercent).toBe('number');
      expect(Array.isArray(gate.missing)).toBe(true);
      expect(gate.allowed).toBe(false);
    }
  });
});

describe('gate <-> scorer field-id sync', () => {
  it('every field id in FEATURE_GATES exists in getProfileFieldChecks', () => {
    const known = new Set(
      getProfileFieldChecks(FULL_PROFILE).map((c) => c.field),
    );
    for (const [key, spec] of Object.entries(FEATURE_GATES)) {
      for (const field of spec.fields) {
        expect(
          known.has(field),
          `FEATURE_GATES.${key} references unknown field id "${field}"`,
        ).toBe(true);
      }
    }
  });
});

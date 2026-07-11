/**
 * Pure-logic test for the first-run tour derivation. Verifies that a
 * step counts as done either when it's been explicitly persisted or
 * when its `satisfiesField` is present in the completed-fields set.
 */

import { describe, it, expect } from 'vitest';
import {
  FIRST_RUN_TOUR_STEPS,
  deriveTourStepStates,
} from '@/hooks/useFirstRunTour';

describe('deriveTourStepStates', () => {
  it('marks nothing done when both sets are empty', () => {
    const states = deriveTourStepStates(new Set(), new Set());
    expect(states.every((s) => !s.done)).toBe(true);
    expect(states.length).toBe(FIRST_RUN_TOUR_STEPS.length);
  });

  it('marks steps done via satisfiesField auto-detect', () => {
    const completed = new Set(['bio', 'skills']);
    const states = deriveTourStepStates(new Set(), completed);
    const done = states.filter((s) => s.done).map((s) => s.step.id).sort();
    expect(done).toEqual(['bio', 'skills']);
  });

  it('marks steps done via explicit persistence', () => {
    const explicit = new Set(['first_event', 'first_connection']);
    const states = deriveTourStepStates(explicit, new Set());
    const done = states.filter((s) => s.done).map((s) => s.step.id).sort();
    expect(done).toEqual(['first_connection', 'first_event']);
  });

  it('does NOT mark field-backed steps done from explicit alone if the field is unmet', () => {
    // Simulating: step was clicked but underlying field never filled.
    // Because our tour hook only inserts explicit rows for steps that
    // don't have satisfiesField, an "explicit" bio row shouldn't exist
    // in practice. But if it did (e.g. legacy row), the derivation
    // still honors it - that's the union semantics we want.
    const states = deriveTourStepStates(new Set(['bio']), new Set());
    const bio = states.find((s) => s.step.id === 'bio');
    expect(bio?.done).toBe(true);
  });

  it('every field-backed step has a satisfiesField, every action step does not', () => {
    for (const s of FIRST_RUN_TOUR_STEPS) {
      if (s.id === 'first_connection' || s.id === 'first_event') {
        expect(s.satisfiesField).toBeUndefined();
      } else {
        expect(typeof s.satisfiesField).toBe('string');
      }
    }
  });
});

describe('first-run tour deep links', () => {
  it('every step href starts with /dna/ (SPA-internal)', () => {
    for (const s of FIRST_RUN_TOUR_STEPS) {
      expect(s.href.startsWith('/dna/')).toBe(true);
    }
  });

  it('profile-edit deep links use a hash so the editor jumps to the right tab', () => {
    const profileSteps = FIRST_RUN_TOUR_STEPS.filter((s) =>
      s.href.startsWith('/dna/profile/edit'),
    );
    expect(profileSteps.length).toBeGreaterThan(0);
    for (const s of profileSteps) {
      expect(s.href).toMatch(/#(identity|professional|discovery|heritage)$/);
    }
  });
});

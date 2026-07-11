/**
 * parseNaturalWhen — the bridge between DIA's natural-language "when" and the
 * events substrate. A wrong date on an invitation is worse than a question,
 * so unparseable input MUST return null, never a guess.
 */

import { describe, expect, it } from 'vitest';
import { parseNaturalWhen } from '@/lib/parseNaturalWhen';

// A fixed "now": Wednesday, 2026-07-08, 10:00 local.
const NOW = new Date(2026, 6, 8, 10, 0, 0);

describe('parseNaturalWhen', () => {
  it('reads the DIA placeholder format "Sat, Mar 15 · 6:00pm"', () => {
    const r = parseNaturalWhen('Sat, Mar 15 · 6:00pm', NOW);
    expect(r).not.toBeNull();
    expect(r!.date.endsWith('-03-15')).toBe(true);
    expect(r!.time).toBe('18:00');
  });

  it('reads "March 15" without a time', () => {
    const r = parseNaturalWhen('March 15', NOW);
    expect(r).not.toBeNull();
    expect(r!.date.endsWith('-03-15')).toBe(true);
    expect(r!.time).toBeUndefined();
  });

  it('rolls a past month-day into the next year rather than the past', () => {
    const r = parseNaturalWhen('March 15', NOW); // March already passed in July
    expect(r!.date).toBe('2027-03-15');
  });

  it('reads a bare weekday as the NEXT one ("Saturday at 6pm")', () => {
    const r = parseNaturalWhen('Saturday at 6pm', NOW);
    expect(r).not.toBeNull();
    expect(r!.date).toBe('2026-07-11'); // the Saturday after Wed Jul 8
    expect(r!.time).toBe('18:00');
  });

  it('reads "tomorrow 9am"', () => {
    const r = parseNaturalWhen('tomorrow 9am', NOW);
    expect(r).toEqual({ date: '2026-07-09', time: '09:00' });
  });

  it('reads an explicit year and 24h time', () => {
    const r = parseNaturalWhen('Dec 1 2026 18:30', NOW);
    expect(r).toEqual({ date: '2026-12-01', time: '18:30' });
  });

  it('returns null for noise instead of guessing', () => {
    expect(parseNaturalWhen('sometime soon', NOW)).toBeNull();
    expect(parseNaturalWhen('when the vibes are right', NOW)).toBeNull();
    expect(parseNaturalWhen('', NOW)).toBeNull();
  });
});

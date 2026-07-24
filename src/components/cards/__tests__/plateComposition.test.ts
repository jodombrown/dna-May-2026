import { describe, it, expect } from 'vitest';
import {
  composePlate,
  fnv1a,
  markForEventType,
  PLATE_FIELDS,
  PLATE_CROPS,
} from '../plateComposition';
import { Nkonsonkonson } from '@/components/icons/adinkra';

describe('fnv1a', () => {
  it('is a pure function of its input — same string, same hash, every time', () => {
    expect(fnv1a('event-123')).toBe(fnv1a('event-123'));
  });

  it('stays an unsigned 32-bit integer', () => {
    for (const s of ['', 'a', 'event-123', '🌍-unicode', 'x'.repeat(500)]) {
      const h = fnv1a(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('pins a known vector (FNV-1a of "hello")', () => {
    // Guards against an accidental change to the constants or the reducer.
    expect(fnv1a('hello')).toBe(0x4f9f2cab);
  });
});

describe('composePlate — BD191 Rule 1: deterministic, never random', () => {
  it('returns an identical composition across repeated calls', () => {
    const a = composePlate('abc-123', 'meetup');
    const b = composePlate('abc-123', 'meetup');
    expect(a).toEqual(b);
  });

  it('returns the same {field, crop} for the same id — the axes are stable', () => {
    // Exit-gate item 4: determinism preserved across both curated axes, by
    // reference identity (the presets are shared frozen objects).
    for (const id of ['abc-123', 'e-9', '🌍-unicode', 'x'.repeat(200)]) {
      const a = composePlate(id, 'meetup');
      const b = composePlate(id, 'conference'); // event_type must not move field/crop
      expect(a.field).toBe(b.field);
      expect(a.crop).toBe(b.crop);
    }
  });

  it('always selects from the curated presets — never an out-of-range index', () => {
    for (let i = 0; i < 1000; i += 1) {
      const { field, crop } = composePlate(`event-${i}`, 'conference');
      expect(PLATE_FIELDS).toContain(field);
      expect(PLATE_CROPS).toContain(crop);
    }
  });

  it('distributes across every field over a realistic id space', () => {
    const seen = new Set(PLATE_FIELDS.map((f) => PLATE_FIELDS.indexOf(f)));
    const hit = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      hit.add(PLATE_FIELDS.indexOf(composePlate(`id-${i}`, 'other').field));
    }
    expect(hit).toEqual(seen); // no dead field
  });

  it('reaches every crop over a realistic id space — no dead placement', () => {
    const seen = new Set(PLATE_CROPS.map((c) => PLATE_CROPS.indexOf(c)));
    const hit = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      hit.add(PLATE_CROPS.indexOf(composePlate(`id-${i}`, 'other').crop));
    }
    expect(hit).toEqual(seen); // no dead crop → the full 8×6 space is live
  });
});

/**
 * A uuid-shaped, deterministic id generator. Real `event.id` values are uuids,
 * not `event-${i}`; a hash sees the two very differently, so at least one joint
 * test must exercise the shape production actually feeds it. Derived from the
 * index via fnv1a so the sequence is fixed — no Math.random(), no flake.
 */
function uuidLike(i: number): string {
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const a = hex(fnv1a(`a-${i}`));
  const b = hex(fnv1a(`b-${i}`));
  const c = hex(fnv1a(`c-${i}`));
  const d = hex(fnv1a(`d-${i}`));
  return `${a}-${b.slice(0, 4)}-4${b.slice(5, 8)}-8${c.slice(1, 4)}-${c.slice(
    4,
    8,
  )}${d}`;
}

describe('composePlate — BD211: field and crop are independent, not correlated', () => {
  // FNV-1a's odd prime preserves the low bit, so before the fmix32 finalizer
  // both `:field` and `:crop` hashes shared a low bit and parity(field) locked
  // to parity(crop). With eight fields and six crops, only 24 of the 48 pairs
  // were reachable and every existing per-axis test still passed — each axis
  // reached all its own values in isolation. These assert the JOINT behaviour.

  it('reaches all 48 field × crop pairs over a realistic uuid id space', () => {
    const pairs = new Set<string>();
    for (let i = 0; i < 20000; i += 1) {
      const { field, crop } = composePlate(uuidLike(i), 'other');
      pairs.add(
        `${PLATE_FIELDS.indexOf(field)},${PLATE_CROPS.indexOf(crop)}`,
      );
    }
    // 8 × 6 = 48. Before the finalizer this maxed out at 24 (BD211).
    expect(pairs.size).toBe(PLATE_FIELDS.length * PLATE_CROPS.length);
  });

  it('does not lock parity(fieldIndex) to parity(cropIndex)', () => {
    // Banded, not pinned: independent axes agree on parity ~50% of the time.
    // 40–60% fails loudly on any re-correlation (before the fix this was 100%)
    // without flaking on ordinary sampling noise.
    const N = 20000;
    let parityAgrees = 0;
    for (let i = 0; i < N; i += 1) {
      const { field, crop } = composePlate(`event-${i}`, 'other');
      const fi = PLATE_FIELDS.indexOf(field);
      const ci = PLATE_CROPS.indexOf(crop);
      if ((fi & 1) === (ci & 1)) parityAgrees += 1;
    }
    const rate = parityAgrees / N;
    expect(rate).toBeGreaterThan(0.4);
    expect(rate).toBeLessThan(0.6);
  });

  it('stays deterministic through the finalizer — same uuid, same pair', () => {
    // Extends the Rule 1 determinism guarantee across the new hash path, on the
    // uuid shape rather than only on `event-${i}`.
    for (let i = 0; i < 500; i += 1) {
      const id = uuidLike(i);
      const a = composePlate(id, 'meetup');
      const b = composePlate(id, 'workshop'); // event_type must not move the axes
      expect(a.field).toBe(b.field);
      expect(a.crop).toBe(b.crop);
    }
  });
});

describe('PLATE_CROPS — BD191: curated crop axis, six placements', () => {
  it('carries exactly six presets', () => {
    expect(PLATE_CROPS).toHaveLength(6);
  });

  it('caps opacity at 0.20 and keeps scale a positive share of the plate', () => {
    for (const c of PLATE_CROPS) {
      expect(c.opacity).toBeGreaterThan(0);
      expect(c.opacity).toBeLessThanOrEqual(0.2);
      expect(c.scale).toBeGreaterThan(0);
      expect(c.scale).toBeLessThanOrEqual(1);
    }
  });
});

describe('PLATE_FIELDS — BD191: roughly a third deep', () => {
  it('carries some deep fields but not the majority', () => {
    const deep = PLATE_FIELDS.filter((f) => f.deep).length;
    expect(deep).toBeGreaterThan(0);
    expect(deep).toBeLessThan(PLATE_FIELDS.length / 2);
  });
});

describe('markForEventType — every enum value maps to Nkonsonkonson', () => {
  it('maps the live enum values', () => {
    for (const t of [
      'conference',
      'workshop',
      'meetup',
      'webinar',
      'networking',
      'social',
      'other',
    ]) {
      expect(markForEventType(t)).toBe(Nkonsonkonson);
    }
  });

  it('falls back to Nkonsonkonson for unknown or absent types', () => {
    expect(markForEventType(undefined)).toBe(Nkonsonkonson);
    expect(markForEventType(null)).toBe(Nkonsonkonson);
    expect(markForEventType('gala-not-in-enum')).toBe(Nkonsonkonson);
  });
});

import { describe, it, expect } from 'vitest';
import {
  composePlate,
  fnv1a,
  markForEventType,
  PLATE_FIELDS,
  MARK_SIZES,
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

  it('always selects from the curated presets — never an out-of-range index', () => {
    for (let i = 0; i < 1000; i += 1) {
      const { field, markSize } = composePlate(`event-${i}`, 'conference');
      expect(PLATE_FIELDS).toContain(field);
      expect(MARK_SIZES).toContain(markSize as (typeof MARK_SIZES)[number]);
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

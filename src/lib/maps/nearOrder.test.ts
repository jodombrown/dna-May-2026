import { describe, it, expect } from 'vitest';
import { formatDistanceM, buildNearOrdering, nearHeader } from './nearOrder';

describe('formatDistanceM', () => {
  it('coarsens sub-kilometre distances to 50m steps', () => {
    expect(formatDistanceM(0)).toBe('50 m');
    expect(formatDistanceM(120)).toBe('100 m');
    expect(formatDistanceM(140)).toBe('150 m');
    expect(formatDistanceM(999)).toBe('1000 m');
  });

  it('shows one decimal under 10km and whole km above', () => {
    expect(formatDistanceM(1200)).toBe('1.2 km');
    expect(formatDistanceM(9800)).toBe('9.8 km');
    expect(formatDistanceM(15400)).toBe('15 km');
  });

  it('returns empty for nonsense input', () => {
    expect(formatDistanceM(-5)).toBe('');
    expect(formatDistanceM(Number.NaN)).toBe('');
  });
});

describe('buildNearOrdering', () => {
  const events = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
  ];

  it('reorders matched events nearest-first and trails the rest in original order', () => {
    const order = [
      { eventId: 'c', distanceM: 500 },
      { eventId: 'a', distanceM: 2000 },
    ];
    const { ordered, matched } = buildNearOrdering(events, order);
    expect(ordered.map((e) => e.id)).toEqual(['c', 'a', 'b', 'd']);
    expect(matched).toBe(2);
  });

  it('labels only the events the RPC placed', () => {
    const order = [{ eventId: 'b', distanceM: 1200 }];
    const { distanceLabels } = buildNearOrdering(events, order);
    expect(distanceLabels).toEqual({ b: '1.2 km' });
  });

  it('is a no-op ordering with zero matches when the RPC returned nothing', () => {
    const { ordered, matched, distanceLabels } = buildNearOrdering(events, []);
    expect(ordered.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(matched).toBe(0);
    expect(distanceLabels).toEqual({});
  });

  it('ignores RPC ids that are not in the loaded set', () => {
    const order = [
      { eventId: 'zzz', distanceM: 10 },
      { eventId: 'd', distanceM: 800 },
    ];
    const { ordered, matched } = buildNearOrdering(events, order);
    expect(ordered.map((e) => e.id)).toEqual(['d', 'a', 'b', 'c']);
    expect(matched).toBe(1);
  });
});

describe('nearHeader', () => {
  it('names the anchor when something is near', () => {
    expect(nearHeader('device', 3)).toBe('Events near you');
    expect(nearHeader('declared', 1)).toBe('Near your saved location');
    expect(nearHeader('chapter', 2)).toBe('Near your chapter');
  });

  it('falls back to an honest empty header with no anchor or no matches', () => {
    expect(nearHeader('none', 0)).toBe('Nothing near you yet');
    expect(nearHeader('device', 0)).toBe('Nothing near you yet');
  });
});

// Pure helpers that turn an rpc_events_near ordering into something the UI can
// render: a reordered event list, per-event distance labels, and an honest
// header for the current anchor. Kept pure (no React, no Supabase) so the
// ordering + labelling contract is unit-tested without a DOM or a network.
import type { NearAnchor, NearOrder } from './eventsNear';

// Metres → a short, human label. Coarsened deliberately: a "near me" sort is a
// relative signal, not a survey reading, and 1387 m reads as false precision.
export function formatDistanceM(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) {
    const rounded = Math.max(50, Math.round(meters / 50) * 50);
    return `${rounded} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export interface NearOrdering<T> {
  /** events reordered by ascending RPC distance; unmatched keep original order at the end */
  ordered: T[];
  /** eventId → distance label, only for events the RPC actually placed */
  distanceLabels: Record<string, string>;
  /** how many of the loaded events the RPC ranked — 0 means "nothing near you" */
  matched: number;
}

// Reorder the loaded events by the RPC's ranking. Events the RPC returned come
// first, nearest-first; everything else keeps its original relative order and
// trails behind. A stable secondary sort on the original index guarantees the
// tail is not reshuffled (Array.prototype.sort is stable on modern engines, but
// the explicit tiebreak makes the intent unmistakable and test-provable).
export function buildNearOrdering<T extends { id: string }>(
  events: T[],
  order: NearOrder[],
): NearOrdering<T> {
  const rank = new Map<string, number>();
  const distance = new Map<string, number>();
  order.forEach((o, i) => {
    if (!rank.has(o.eventId)) rank.set(o.eventId, i);
    distance.set(o.eventId, o.distanceM);
  });

  const ordered = events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const ra = rank.has(a.e.id) ? (rank.get(a.e.id) as number) : Number.POSITIVE_INFINITY;
      const rb = rank.has(b.e.id) ? (rank.get(b.e.id) as number) : Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
      return a.i - b.i;
    })
    .map((x) => x.e);

  const distanceLabels: Record<string, string> = {};
  let matched = 0;
  for (const e of events) {
    if (distance.has(e.id)) {
      const label = formatDistanceM(distance.get(e.id) as number);
      if (label) {
        distanceLabels[e.id] = label;
        matched += 1;
      }
    }
  }

  return { ordered, distanceLabels, matched };
}

// The honest header. If we have no anchor, or the RPC placed none of the loaded
// events, we say so plainly — "Nothing near you yet" — rather than dressing the
// default upcoming list up as a proximity result.
export function nearHeader(anchor: NearAnchor, matched: number): string {
  if (anchor === 'none' || matched === 0) return 'Nothing near you yet';
  switch (anchor) {
    case 'device':
      return 'Events near you';
    case 'declared':
      return 'Near your saved location';
    case 'chapter':
      return 'Near your chapter';
    default:
      return 'Nothing near you yet';
  }
}

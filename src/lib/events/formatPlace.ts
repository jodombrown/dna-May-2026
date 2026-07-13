// The ONE formatter for an event's place.
//
// public.events carries location_name, location_address, location_city,
// location_state and location_country. Before this module, ~a dozen display
// components each did their own [city, country].filter(Boolean).join(', ')
// and none of them rendered location_state. Every display surface goes
// through formatEventPlace; no component joins place columns by hand.

export interface EventPlaceInput {
  location_name?: string | null;
  location_address?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
  format?: string | null;
  is_virtual?: boolean | null;
  meeting_platform?: string | null;
}

/** The detail-page block. Any of the three may be absent — render only what exists. */
export interface EventPlaceBlock {
  venue?: string;
  street?: string;
  locality?: string;
}

/**
 * The place columns every display query must fetch. Interpolate into
 * supabase .select() so no surface can forget location_state again.
 */
export const EVENT_PLACE_SELECT =
  'location_name, location_address, location_city, location_state, location_country' as const;

/** Place column names, for query filters that target a single column. */
export const EVENT_PLACE_COLUMNS = {
  name: 'location_name',
  address: 'location_address',
  city: 'location_city',
  state: 'location_state',
  country: 'location_country',
} as const;

type EventPlaceKey = (typeof EVENT_PLACE_COLUMNS)[keyof typeof EVENT_PLACE_COLUMNS];

export type EventPlaceFields = Record<EventPlaceKey, string | null>;

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * Join parts in order, dropping empties AND any part equal to the previous
 * part (case-insensitive). Lagos has state "Lagos" — "Lagos, Lagos" is not
 * a place.
 */
function dedupeJoin(parts: Array<string | null | undefined>): string {
  const out: string[] = [];
  for (const raw of parts) {
    const part = clean(raw);
    if (!part) continue;
    if (out.length > 0 && out[out.length - 1].toLowerCase() === part.toLowerCase()) continue;
    out.push(part);
  }
  return out.join(', ');
}

/**
 * Pick the place columns off any row shape (typed rows, Record<string, unknown>,
 * RPC results) — for spreading into card props or list-item mappings.
 */
export function pickEventPlace(row: { [K in EventPlaceKey]?: unknown }): EventPlaceFields {
  return {
    location_name: clean(row.location_name) || null,
    location_address: clean(row.location_address) || null,
    location_city: clean(row.location_city) || null,
    location_state: clean(row.location_state) || null,
    location_country: clean(row.location_country) || null,
  };
}

/**
 * 'compact' (cards, lists, pins, search results) → a single line:
 *   virtual → "Virtual" (+ " · {meeting_platform}" if present)
 *   hybrid  → "Hybrid · {city}" when a city exists, else "Hybrid"
 *   else    → "city, state" — or "city, country" when there is no usable
 *             state (missing, or deduped away because it equals the city)
 *
 * 'full' (the event detail page) → { venue, street, locality } where
 *   locality = "city, state, country" under the same dedupe rule.
 *
 * Empty inputs produce "" / an empty block — never "undefined".
 */
export function formatEventPlace(e: EventPlaceInput, mode: 'compact'): string;
export function formatEventPlace(e: EventPlaceInput, mode: 'full'): EventPlaceBlock;
export function formatEventPlace(
  e: EventPlaceInput,
  mode: 'compact' | 'full'
): string | EventPlaceBlock {
  if (mode === 'full') {
    const block: EventPlaceBlock = {};
    const venue = clean(e.location_name);
    const street = clean(e.location_address);
    const locality = dedupeJoin([e.location_city, e.location_state, e.location_country]);
    if (venue) block.venue = venue;
    if (street) block.street = street;
    if (locality) block.locality = locality;
    return block;
  }

  if (e.is_virtual === true || e.format === 'virtual') {
    const platform = clean(e.meeting_platform);
    return platform ? `Virtual · ${platform}` : 'Virtual';
  }
  if (e.format === 'hybrid') {
    const city = clean(e.location_city);
    return city ? `Hybrid · ${city}` : 'Hybrid';
  }

  const city = clean(e.location_city);
  const state = clean(e.location_state);
  const cityState = dedupeJoin([city, state]);
  // A state that survives the dedupe carries information ("Los Angeles,
  // California"). One that doesn't (Lagos, Lagos) leaves a bare city, which
  // needs its country instead.
  if (state && cityState.toLowerCase() !== city.toLowerCase()) return cityState;
  return dedupeJoin([city, e.location_country]);
}

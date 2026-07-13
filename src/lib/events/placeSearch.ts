// BD097 — the place-search contract, as the FRONT END understands it.
//
// The place-search edge function is the anti-corruption boundary: it speaks to
// Google server-side (the API key never reaches the browser) and returns
// places already in DNA's dialect — city ONLY (never city+state), state as its
// own rung, countryCode as ISO alpha-3. This module holds the response shape
// and the ONE mapping from a resolved place onto the event form's location
// fields, kept pure so it can be asserted in isolation.

import type { EventFormValues } from '@/lib/events/eventFormSchema';

/** One result from the place-search edge function. */
export interface PlaceSearchResult {
  placeId: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null; // ISO alpha-3 already — never convert
  lat: number | null;
  lng: number | null;
  formatted: string | null;
}

export interface PlaceSearchResponse {
  places?: PlaceSearchResult[];
  error?: string;
}

export type LocationPatch = Pick<
  EventFormValues,
  | 'location_name'
  | 'location_address'
  | 'location_city'
  | 'location_state'
  | 'location_country'
  | 'location_country_code'
  | 'location_place_id'
  | 'location_lat'
  | 'location_lng'
>;

/** Selecting a place writes EVERY location field at once — never a subset. */
export function placeToLocationPatch(place: PlaceSearchResult): LocationPatch {
  return {
    location_name: place.name ?? '',
    location_address: place.address ?? '',
    location_city: place.city ?? '',
    location_state: place.state ?? '',
    location_country: place.country ?? '',
    location_country_code: place.countryCode ?? '',
    location_place_id: place.placeId,
    location_lat: place.lat,
    location_lng: place.lng,
  };
}

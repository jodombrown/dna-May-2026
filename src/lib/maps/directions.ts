// The ONE place that builds Google/Apple Maps deep links for a place.
//
// Extracted verbatim from LocationMap (originally EventLocationMap) so there is
// a single implementation with two consumers — LocationMap and LocationLine —
// rather than a copy in each. Phase 1 deleted duplicate map renderers; this
// keeps Phase 2 from re-introducing duplicate deep-link builders.
//
// Behaviour is preserved exactly, including the search-by-name fallback used
// when coordinates are absent.

export interface DirectionsInput {
  locationName?: string;
  locationAddress?: string;
  /** Pre-formatted "city, state, country" line from formatEventPlace(e, 'full'). */
  locality?: string;
  lat?: number;
  lng?: number;
}

const hasCoordinates = (lat?: number, lng?: number): boolean =>
  lat !== undefined && lng !== undefined && lat !== null && lng !== null;

/**
 * Google Maps deep link. With real coordinates it uses the @lat,lng,zoom form;
 * without them it falls back to a place search built from the text fields.
 */
export function getGoogleMapsUrl({
  locationName,
  locationAddress,
  locality,
  lat,
  lng,
}: DirectionsInput): string {
  if (hasCoordinates(lat, lng)) {
    // Use @lat,lng,zoom format for direct coordinates
    return `https://www.google.com/maps/@${lat},${lng},17z`;
  }
  // Fallback to searching by name
  const searchQuery = [locationName, locationAddress, locality].filter(Boolean).join(', ');
  return `https://www.google.com/maps/place/${encodeURIComponent(searchQuery)}`;
}

/**
 * Apple Maps deep link. With coordinates it uses sll + a labelled query so the
 * link is directions-compatible; without them it falls back to an address search.
 */
export function getAppleMapsUrl({
  locationName,
  locationAddress,
  locality,
  lat,
  lng,
}: DirectionsInput): string {
  if (hasCoordinates(lat, lng)) {
    // Use sll (start latitude/longitude) parameter with a labelled query for a
    // directions-compatible link
    return `https://maps.apple.com/?sll=${lat},${lng}&z=17&q=${encodeURIComponent(locationName || locality || 'Event Location')}`;
  }
  const searchQuery = [locationName, locationAddress, locality].filter(Boolean).join(', ');
  return `https://maps.apple.com/?address=${encodeURIComponent(searchQuery)}`;
}

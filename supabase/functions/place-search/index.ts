// BD097 — place-search. A place is RESOLVED, never typed.
//
// One search box replaces three free-text inputs that corrupted the data three
// times running ("CA 90014" as a country; "Los Angeles, California" as a city).
// The organizer types "Jonathan Club Los Angeles", taps a result, and venue /
// street / city / state / country / coordinates fill themselves. They never see
// a country dropdown again.
//
// THE KEY LIVES ONLY HERE, as a Supabase secret. It never reaches the browser:
// a front-end key is scrapeable and billable even behind a referrer
// restriction. Mirrors how geocode-city already works.
//
// DIALECT: this function is the anti-corruption boundary. Google returns
// alpha-2; DNA speaks alpha-3 (BD039). alpha-2 stops here.
//
// CACHING: Google's terms permit caching place_id indefinitely but not the rest,
// so there is deliberately no cache table. place_id is stored on the event;
// everything else is re-resolved on demand. Nominatim + geocode_cache remain
// the fallback for plain city geocoding.

import { corsHeaders } from '../_shared/cors.ts';
import { toAlpha3 } from '../_shared/iso-alpha3.ts';

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: AddressComponent[];
}

/** What DNA understands a place to be. The provider's shape never escapes this file. */
interface ResolvedPlace {
  placeId: string;
  name: string | null;          // the venue: "The Jonathan Club"
  address: string | null;       // the street: "545 S Figueroa St"
  city: string | null;          // "Los Angeles" — city ONLY, never city+state
  state: string | null;         // "California" — the D029/D030 subdivision rung
  country: string | null;       // "United States"
  countryCode: string | null;   // "USA" — ISO alpha-3, canonical (BD039)
  lat: number | null;
  lng: number | null;
  formatted: string | null;     // what the picker shows in the dropdown
}

function pick(components: AddressComponent[], type: string): AddressComponent | undefined {
  return components.find((c) => Array.isArray(c.types) && c.types.includes(type));
}

function normalize(place: GooglePlace): ResolvedPlace | null {
  if (!place.id) return null;
  const components = place.addressComponents ?? [];

  // City: locality first, then the fallbacks other countries actually use.
  const city =
    pick(components, 'locality')?.longText ??
    pick(components, 'postal_town')?.longText ??
    pick(components, 'administrative_area_level_2')?.longText ??
    pick(components, 'sublocality')?.longText ??
    null;

  // State / province / prefecture — the D029/D030 subdivision rung. Long form,
  // because a human reads it on a public event page.
  const state = pick(components, 'administrative_area_level_1')?.longText ?? null;

  const countryComponent = pick(components, 'country');
  const country = countryComponent?.longText ?? null;
  const countryCode = toAlpha3(countryComponent?.shortText ?? null);

  // Street, assembled — never formattedAddress, which repeats city and state.
  const streetNumber = pick(components, 'street_number')?.longText ?? '';
  const route = pick(components, 'route')?.longText ?? '';
  const address = [streetNumber, route].filter(Boolean).join(' ').trim() || null;

  return {
    placeId: place.id,
    name: place.displayName?.text ?? null,
    address,
    city,
    state,
    country,
    countryCode,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    formatted: place.formattedAddress ?? null,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // The key is a server-side secret. If it is missing, SAY SO — a silent empty
    // result would look like "no places found" forever, which is the exact class
    // of quiet lie that cost us an evening.
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('[place-search] GOOGLE_PLACES_API_KEY is not set');
      return json(
        { error: 'Place search is not configured (GOOGLE_PLACES_API_KEY missing).', places: [] },
        500
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (query.length < 2) return json({ places: [] });

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.addressComponents',
        ].join(','),
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 6 }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[place-search] Google returned', res.status, detail);
      return json({ error: `Place search failed (${res.status}).`, places: [] }, 502);
    }

    const data = await res.json();
    const places = Array.isArray(data?.places)
      ? data.places
          .map(normalize)
          .filter((p: ResolvedPlace | null): p is ResolvedPlace => p !== null)
      : [];

    console.log('[place-search] query=%s results=%d', query, places.length);
    return json({ places });
  } catch (error) {
    // Never swallow. A caught error that vanishes is a lie.
    console.error('[place-search] threw:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: message, places: [] }, 500);
  }
});

// Geocode City — a city name → a real point on the map, server-side (BD089)
//
// The composer used to call Nominatim directly from the browser. Nominatim's
// usage policy discourages application traffic from the browser and rate-limits
// by IP, so client-side geocoding is fragile even when CORS allows it. This
// function moves the call server-side: one descriptive User-Agent identifying
// DNA, a small cache (geocode_cache) so a repeat city skips a second request,
// and — like the DIA functions — GRACEFUL FAILURE. A geocode never blocks a
// post, so any error returns null (200), never a 5xx.
//
// Contract: takes { city, country? }, returns
//   { city, country, countryCode, lat, lng, displayName }  — a match
//   null                                                    — no match / failure
// The shape mirrors composeResolvers.ResolvedPlace so nothing downstream changes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nominatim asks for a descriptive User-Agent that identifies the application.
const USER_AGENT =
  'DNA-DiasporaNetworkOfAfrica/1.0 (https://github.com/jodombrown/dna-May-2026; composer geocode)';

interface GeocodeResult {
  city: string;
  country: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  displayName: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** Same normalization on read and write so the cache key is stable. */
const normalizeKey = (city: string, country: string) =>
  [city, country].filter(Boolean).join(', ').toLowerCase().replace(/\s+/g, ' ').trim();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // verify_jwt = true gates this function, so an unauthenticated request never
    // reaches here. Belt-and-suspenders: refuse if the header is somehow absent.
    if (!req.headers.get('Authorization')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const body = await req.json().catch(() => ({}));
    const city = typeof body?.city === 'string' ? body.city.trim() : '';
    const country = typeof body?.country === 'string' ? body.country.trim() : '';
    if (!city) return json(null); // nothing to geocode — not an error

    const key = normalizeKey(city, country);

    // The cache is RLS-locked to server-only; reach it with the service role,
    // which bypasses RLS. Never pass the caller's JWT to this client.
    const admin =
      SUPABASE_URL && SERVICE_ROLE ? createClient(SUPABASE_URL, SERVICE_ROLE) : null;

    if (admin) {
      const { data: cached } = await admin
        .from('geocode_cache')
        .select('city, country, country_code, lat, lng, display_name')
        .eq('query', key)
        .maybeSingle();
      if (cached) {
        return json({
          city: cached.city,
          country: cached.country ?? '',
          countryCode: cached.country_code ?? null,
          lat: Number(cached.lat),
          lng: Number(cached.lng),
          displayName: cached.display_name ?? key,
        } satisfies GeocodeResult);
      }
    }

    // Cache miss — ask Nominatim, server-side, with a descriptive UA.
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', [city, country].filter(Boolean).join(', '));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.error('geocode-city: nominatim', res.status);
      return json(null); // degrade, never block a post
    }

    const results = await res.json();
    const hit = Array.isArray(results) ? results[0] : null;
    const lat = hit ? parseFloat(hit.lat) : NaN;
    const lng = hit ? parseFloat(hit.lon) : NaN;
    if (!hit || Number.isNaN(lat) || Number.isNaN(lng)) {
      return json(null); // no match — keep the typed city, write NULL coords
    }

    const addr = hit.address ?? {};
    const result: GeocodeResult = {
      city: addr.city || addr.town || addr.village || addr.state || city,
      country: addr.country ?? country ?? '',
      countryCode: addr.country_code ? String(addr.country_code).toUpperCase() : null,
      lat,
      lng,
      displayName: hit.display_name ?? key,
    };

    // Cache the hit (best-effort). Only successful geocodes are stored, so a
    // transient Nominatim failure is retried next time rather than remembered.
    if (admin) {
      const { error: cacheError } = await admin.from('geocode_cache').upsert(
        {
          query: key,
          city: result.city,
          country: result.country,
          country_code: result.countryCode,
          lat: result.lat,
          lng: result.lng,
          display_name: result.displayName,
        },
        { onConflict: 'query' }
      );
      if (cacheError) console.error('geocode-city: cache write', cacheError.message);
    }

    return json(result);
  } catch (err) {
    console.error('geocode-city:', err);
    return json(null); // a geocode never blocks a post
  }
});

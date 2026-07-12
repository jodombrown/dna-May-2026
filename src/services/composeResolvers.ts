/**
 * Compose Resolvers — DIA hands you an answer, not a field (BD089)
 *
 * Two resolvers that turn what a member *wrote* into what the database *needs*.
 *
 * WHY THIS EXISTS: the composer was collecting "Saturday at 6pm" as a string and
 * "Lagos" as a string. The events table has `start_time timestamptz`, `timezone`,
 * `location_lat`, and `location_lng` — real columns, sitting unused. A string
 * date fails at submit (the worst possible moment to find out); a string city
 * cannot be found by anyone browsing Lagos.
 *
 * The member sees the RESOLVED value and confirms it. A wrong parse is obvious
 * immediately, not after they hit Post.
 */

import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Date — natural language → a real instant the member can see and correct
// ---------------------------------------------------------------------------

export interface ResolvedDate {
  /** ISO 8601, ready for `start_time timestamptz`. */
  iso: string;
  /** "Sat, Mar 15 · 6:00 PM" — what the member confirms. */
  label: string;
  /** "in 4 days" — makes a wrong year or a stale weekday obvious at a glance. */
  distance: string;
  /** The member's IANA zone, ready for `events.timezone`. */
  timezone: string;
  /** A date in the past is almost always a mis-parse. Warn, do not block. */
  isPast: boolean;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Resolves DIA's natural-language `when` ("Saturday at 6pm", "March 15 at 7").
 * Returns null when it cannot be read — in which case the composer shows a real
 * date picker instead of guessing.
 */
export function resolveDate(input: string, now: Date = new Date()): ResolvedDate | null {
  if (!input?.trim()) return null;

  const text = input.trim().toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Time of day. Default 6pm — the hour most diaspora events actually start.
  let hour = 18;
  let minute = 0;
  const t = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (t) {
    hour = parseInt(t[1], 10) % 12;
    if (t[3] === 'pm') hour += 12;
    minute = t[2] ? parseInt(t[2], 10) : 0;
  } else {
    const t24 = text.match(/\b(\d{1,2}):(\d{2})\b/);
    if (t24) {
      hour = parseInt(t24[1], 10);
      minute = parseInt(t24[2], 10);
    }
  }

  let target: Date | null = null;

  // "tomorrow", "today", "tonight"
  if (/\btomorrow\b/.test(text)) {
    target = new Date(now);
    target.setDate(now.getDate() + 1);
  } else if (/\b(today|tonight)\b/.test(text)) {
    target = new Date(now);
  }

  // "next saturday" / "saturday" → the NEXT one, never today
  if (!target) {
    const d = DAYS.findIndex((day) => new RegExp(`\\b${day}\\b`).test(text));
    if (d >= 0) {
      target = new Date(now);
      let delta = (d - now.getDay() + 7) % 7;
      if (delta === 0) delta = 7; // "Saturday" said on a Saturday means next Saturday
      if (/\bnext\b/.test(text) && delta < 7) delta += 7;
      target.setDate(now.getDate() + delta);
    }
  }

  // "March 15", "15 March", "3/15"
  if (!target) {
    const parsed = Date.parse(
      /\d{4}/.test(input) ? input : `${input} ${now.getFullYear()}`
    );
    if (!Number.isNaN(parsed)) {
      target = new Date(parsed);
      // A bare month/day that already passed almost always means next year.
      if (target < now && !/\d{4}/.test(input)) {
        target.setFullYear(now.getFullYear() + 1);
      }
    }
  }

  if (!target || Number.isNaN(target.getTime())) return null;

  target.setHours(hour, minute, 0, 0);
  return describeDate(target, timezone, now);
}

/** Formats an instant for confirmation. Used for both DIA's parse and the picker. */
export function describeDate(
  date: Date,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now: Date = new Date()
): ResolvedDate {
  const label = `${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  const days = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  const distance =
    days < 0
      ? 'that date has passed'
      : days === 0
        ? 'today'
        : days === 1
          ? 'tomorrow'
          : days < 14
            ? `in ${days} days`
            : days < 60
              ? `in ${Math.round(days / 7)} weeks`
              : `in ${Math.round(days / 30)} months`;

  return {
    iso: date.toISOString(),
    label,
    distance,
    timezone,
    isPast: date < now,
  };
}

// ---------------------------------------------------------------------------
// Place — a city name → a real point on the map
// ---------------------------------------------------------------------------

export interface ResolvedPlace {
  city: string;
  country: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  /** The provider's full name — shown so a wrong match is visible. */
  displayName: string;
}

/**
 * Geocodes a city via OpenStreetMap Nominatim — server-side (BD089).
 *
 * Nominatim (free, no API key, no vendor lock) is called from the `geocode-city`
 * edge function, NOT the browser: Nominatim's usage policy discourages direct
 * application traffic from the client and rate-limits by IP, so a client-side
 * call is fragile even where CORS allows it. The function adds a descriptive
 * User-Agent identifying DNA and a small cache so a repeat city skips a second
 * request. The alternative was leaving `location_lat`/`location_lng` NULL — a
 * data gap that is more expensive than a geocode.
 *
 * The function returns the same shape this used to build directly, so nothing
 * downstream (ComposerPlaceField, the map, the submit mapping) changes.
 *
 * Returns null on failure — the composer keeps the typed city and writes NULL
 * coordinates rather than blocking the post.
 */
export async function geocodeCity(
  city: string,
  country?: string
): Promise<ResolvedPlace | null> {
  const q = [city, country].filter(Boolean).join(', ');
  if (!q.trim()) return null;

  try {
    const { data, error } = await supabase.functions.invoke('geocode-city', {
      body: { city, country },
    });
    if (error || !data) return null;

    const hit = data as Partial<ResolvedPlace>;
    if (typeof hit.lat !== 'number' || typeof hit.lng !== 'number') return null;

    return {
      city: hit.city || city,
      country: hit.country ?? country ?? '',
      countryCode: hit.countryCode ?? null,
      lat: hit.lat,
      lng: hit.lng,
      displayName: hit.displayName ?? q,
    };
  } catch {
    return null; // never block a post on a geocode
  }
}

/** A static map image for confirmation. No JS map library, no API key. */
export function staticMapUrl(lat: number, lng: number, zoom = 11): string {
  const d = 0.04 * (12 - zoom + 1);
  const bbox = [lng - d, lat - d / 2, lng + d, lat + d / 2].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

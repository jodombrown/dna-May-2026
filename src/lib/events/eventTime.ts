// The ONE formatter for an event's date and time.
//
// public.events carries two truth flags, and the rules live here, once:
//
//   time_confirmed === false → the source published a date but no hour; a
//   stored 09:00 is a fabrication. Render the date or date range only, and
//   NOTHING where the clock would be.
//
//   date_confirmed === false (or start_time IS NULL) → the source hasn't
//   announced dates at all. Nothing here is printable: format functions
//   return '', and the <EventTime> component renders "Dates not yet
//   announced" with a Notify-me action in its place. A single unguarded
//   new Date(null) puts "Invalid Date" on a card, so no call site may
//   construct a Date from start_time by hand — sorts and comparisons go
//   through eventStartMs/eventEndMs below.
//
// Both flags are REQUIRED properties of EventTimeInput (their values may be
// null/undefined, but the keys must be present), so no call site can format
// a start_time without having consulted them. Every display surface goes
// through formatEventDateTime or the <EventTime> component; no component
// calls format(start_time, 'h:mm a') by hand.

import { format, isToday, isTomorrow, isThisWeek, isSameDay, isSameYear } from 'date-fns';

export interface EventTimeInput {
  start_time?: string | null;
  end_time?: string | null;
  /**
   * false → the hour is unverified; render dates only. true/null/undefined →
   * the hour is trusted (the column defaults to true; a projection that
   * omits it only ever carries member-authored events, which set their own
   * times). Required so the compiler rejects call sites that never looked.
   */
  time_confirmed: boolean | null | undefined;
  /**
   * false → the source hasn't announced dates; any stored start_time is a
   * placeholder and must never print. true/null/undefined → dates are real
   * (the column defaults to true). Required, same contract as
   * time_confirmed: the compiler rejects call sites that never looked.
   */
  date_confirmed: boolean | null | undefined;
  /** Optional IANA zone label, appended to 'clock' output when present. */
  timezone?: string | null;
}

/**
 * The time columns every display query must fetch. Interpolate into
 * supabase .select() so no surface can forget the truth flags.
 */
export const EVENT_TIME_SELECT =
  'start_time, end_time, timezone, time_confirmed, date_confirmed' as const;

/** The one phrase for an event whose dates aren't announced. */
export const DATES_TBA = 'Dates not yet announced';

/** Shape for the null-safe helpers below — no truth flags required, since
 *  a null result already says "don't treat this as a point in time". */
export interface EventDatesInput {
  start_time?: string | null;
  end_time?: string | null;
  date_confirmed?: boolean | null;
}

/**
 * true → the event has real, printable dates. false → undated: it belongs
 * in its own lane, never sorted into a timeline or a calendar.
 */
export function datesAnnounced(e: EventDatesInput): boolean {
  return e.date_confirmed !== false && !!e.start_time;
}

/**
 * Null-safe epoch millis for sorting and comparison. Returns null when the
 * event is undated (or the timestamp is invalid) — never NaN, never 1970.
 */
export function eventStartMs(e: EventDatesInput): number | null {
  if (!datesAnnounced(e)) return null;
  const ms = new Date(e.start_time!).getTime();
  return isNaN(ms) ? null : ms;
}

/** Null-safe epoch millis for end_time; null on undated/absent/invalid. */
export function eventEndMs(e: EventDatesInput): number | null {
  if (e.date_confirmed === false || !e.end_time) return null;
  const ms = new Date(e.end_time).getTime();
  return isNaN(ms) ? null : ms;
}

export type EventTimeVariant =
  /** Card one-liner: "Today, 7:00 PM" / "Tomorrow" / "Sat, Nov 1–Nov 5". */
  | 'compact'
  /** One line with clock when trusted: "Sat, Nov 1 · 7:00 PM" / "Sat, Nov 1". */
  | 'datetime'
  /** The date line alone: "Sunday, November 1, 2026" / "November 1–5, 2026". */
  | 'date'
  /** The clock line alone: "7:00 PM – 9:00 PM" (+ zone). '' when unverified. */
  | 'clock';

const clockConfirmed = (e: EventTimeInput): boolean => e.time_confirmed !== false;

function dateRange(start: Date, end: Date): string {
  if (!isSameYear(start, end)) {
    return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
  }
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMMM d')}–${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function formatEventDateTime(e: EventTimeInput, variant: EventTimeVariant): string {
  // Unannounced dates never print — not even a stored placeholder. String
  // contexts get ''; the <EventTime> component renders DATES_TBA instead.
  if (!datesAnnounced(e)) return '';

  const start = new Date(e.start_time!);
  if (isNaN(start.getTime())) return '';
  const end = e.end_time ? new Date(e.end_time) : null;
  const validEnd = end && !isNaN(end.getTime()) ? end : null;
  const multiDay = !!validEnd && !isSameDay(start, validEnd);
  const withClock = clockConfirmed(e);

  switch (variant) {
    case 'clock': {
      if (!withClock) return '';
      const startClock = format(start, 'h:mm a');
      const range =
        validEnd && !multiDay ? `${startClock} – ${format(validEnd, 'h:mm a')}` : startClock;
      return e.timezone ? `${range} (${e.timezone})` : range;
    }

    case 'date': {
      if (multiDay && validEnd) return dateRange(start, validEnd);
      return format(start, 'EEEE, MMMM d, yyyy');
    }

    case 'datetime': {
      if (multiDay && validEnd) return `${format(start, 'MMM d')} – ${format(validEnd, 'MMM d')}`;
      const day = format(start, 'EEE, MMM d');
      return withClock ? `${day} · ${format(start, 'h:mm a')}` : day;
    }

    case 'compact': {
      if (multiDay && validEnd) return `${format(start, 'MMM d')}–${format(validEnd, 'MMM d')}`;
      const clock = withClock ? `, ${format(start, 'h:mm a')}` : '';
      if (isToday(start)) return `Today${clock}`;
      if (isTomorrow(start)) return `Tomorrow${clock}`;
      if (isThisWeek(start)) return `${format(start, 'EEEE')}${clock}`;
      return format(start, 'EEE, MMM d');
    }
  }
}

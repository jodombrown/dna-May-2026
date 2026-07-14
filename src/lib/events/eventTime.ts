// The ONE formatter for an event's date and time.
//
// public.events carries time_confirmed (default true; false on curated rows
// whose source published a date but no hour). A stored 09:00 on an
// unconfirmed row is a load-bearing lie: rendering it manufactures an hour
// DNA never verified. So the rule lives here, once:
//
//   time_confirmed === false → the date or date range only, and NOTHING
//   where the clock would be.
//
// `time_confirmed` is a REQUIRED property of EventTimeInput (its value may
// be null/undefined, but the key must be present), so no call site can
// format a start_time without having consulted the flag. Every display
// surface goes through formatEventDateTime or the <EventTime> component;
// no component calls format(start_time, 'h:mm a') by hand.

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
  /** Optional IANA zone label, appended to 'clock' output when present. */
  timezone?: string | null;
}

/**
 * The time columns every display query must fetch. Interpolate into
 * supabase .select() so no surface can forget time_confirmed.
 */
export const EVENT_TIME_SELECT = 'start_time, end_time, timezone, time_confirmed' as const;

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
  if (!e.start_time) return '';

  const start = new Date(e.start_time);
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

/**
 * The ONE renderer for an event's date and time — every surface that shows
 * when an event happens renders this component (or, in string-only contexts,
 * calls formatEventDateTime from @/lib/events/eventTime, which it wraps).
 *
 * time_confirmed === false → the date or date range only, and nothing where
 * the clock would be.
 *
 * date_confirmed === false (or a null start_time) → "Dates not yet
 * announced" and a Notify-me action, never a formatted placeholder and never
 * "Invalid Date". The prop type makes both flags mandatory, so a card cannot
 * print an hour — or a date — it never checked.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  datesAnnounced,
  DATES_TBA,
  formatEventDateTime,
  type EventTimeInput,
  type EventTimeVariant,
} from '@/lib/events/eventTime';
import { EventDateNotifyButton } from '@/components/events/EventDateNotifyButton';

export interface EventTimeProps {
  event: EventTimeInput & { id?: string };
  variant?: EventTimeVariant;
  className?: string;
  /**
   * Event id for the Notify-me action on unannounced dates. Falls back to
   * event.id; with neither, the TBA line renders without the action.
   */
  eventId?: string;
  /** Set false to suppress the Notify-me action in dense contexts. */
  notifyAction?: boolean;
}

export function EventTime({
  event,
  variant = 'compact',
  className,
  eventId,
  notifyAction = true,
}: EventTimeProps) {
  if (!datesAnnounced(event)) {
    // Nothing goes where a clock would be — the date line owns the TBA copy.
    if (variant === 'clock') return null;
    const id = eventId ?? event.id;
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-0.5', className)}>
        <span>{DATES_TBA}</span>
        {notifyAction && id && <EventDateNotifyButton eventId={id} />}
      </span>
    );
  }

  const text = formatEventDateTime(event, variant);
  if (!text) return null;
  return <span className={className}>{text}</span>;
}

export default EventTime;

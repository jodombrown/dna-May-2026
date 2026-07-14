/**
 * The ONE renderer for an event's date and time — every surface that shows
 * when an event happens renders this component (or, in string-only contexts,
 * calls formatEventDateTime from @/lib/events/eventTime, which it wraps).
 *
 * time_confirmed === false → the date or date range only, and nothing where
 * the clock would be. The prop type makes the flag mandatory, so a card
 * cannot print an hour it never checked.
 */

import React from 'react';
import {
  formatEventDateTime,
  type EventTimeInput,
  type EventTimeVariant,
} from '@/lib/events/eventTime';

export interface EventTimeProps {
  event: EventTimeInput;
  variant?: EventTimeVariant;
  className?: string;
}

export function EventTime({ event, variant = 'compact', className }: EventTimeProps) {
  const text = formatEventDateTime(event, variant);
  if (!text) return null;
  return <span className={className}>{text}</span>;
}

export default EventTime;

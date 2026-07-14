/**
 * DNA | CONVENE — Event Status Logic
 * Returns status badge info for event cards.
 */

import { eventEndMs, eventStartMs } from '@/lib/events/eventTime';

export type EventStatusType =
  | 'happening_now'
  | 'near_capacity'
  | 'waitlist'
  | 'sold_out'
  | 'free'
  | 'past'
  | 'cancelled'
  | null;

export interface EventStatus {
  type: EventStatusType;
  label: string;
  variant: 'happening' | 'urgent' | 'info' | 'neutral' | 'destructive';
}

interface EventStatusInput {
  start_time?: string | null;
  end_time?: string | null;
  date_confirmed?: boolean | null;
  is_cancelled?: boolean;
  max_attendees?: number | null;
  attendee_count?: number;
  waitlist_enabled?: boolean;
}

export function getEventStatus(
  event: EventStatusInput,
  attendeeCount?: number
): EventStatus | null {
  const count = attendeeCount ?? event.attendee_count ?? 0;
  const now = new Date();

  if (event.is_cancelled) {
    return { type: 'cancelled', label: 'Cancelled', variant: 'destructive' };
  }

  // Past — null-safe: an undated event (or an unannounced placeholder time)
  // has no clock position and never reads as past or happening.
  const endMs = eventEndMs(event);
  const startMs = eventStartMs(event);
  const endTime = endMs !== null ? new Date(endMs) : null;
  const startTime = startMs !== null ? new Date(startMs) : null;

  if (endTime && endTime < now) {
    return { type: 'past', label: 'Past', variant: 'neutral' };
  }
  if (!endTime && startTime && startTime < now) {
    // If no end_time, treat as past if start is > 4 hours ago
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    if (startTime < fourHoursAgo) {
      return { type: 'past', label: 'Past', variant: 'neutral' };
    }
  }

  // Happening now
  if (startTime && startTime <= now && endTime && endTime > now) {
    return { type: 'happening_now', label: 'Happening Now', variant: 'happening' };
  }
  if (startTime && startTime <= now && !endTime) {
    return { type: 'happening_now', label: 'Happening Now', variant: 'happening' };
  }

  // Capacity-based
  if (event.max_attendees && event.max_attendees > 0) {
    if (count >= event.max_attendees) {
      if (event.waitlist_enabled) {
        return { type: 'waitlist', label: 'Waitlist Open', variant: 'urgent' };
      }
      return { type: 'sold_out', label: 'Sold Out', variant: 'destructive' };
    }
    if (count >= event.max_attendees * 0.9) {
      return { type: 'near_capacity', label: 'Near Capacity', variant: 'urgent' };
    }
  }

  // Free event (no ticket price — for now all events are free)
  return { type: 'free', label: 'Free', variant: 'info' };
}

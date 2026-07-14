// Completed is a fact about the clock, not a decision. Zero events have
// ever been marked status='completed' in this project's life, and no
// scheduler exists to do it — a status column holding a clock fact needs a
// job to keep it honest. So every surface DERIVES completed from the clock:
//
//   isCompleted = status === 'completed' || end_time is in the past
//
// (status='completed' is still honored so an explicit mark, should one ever
// be written, wins.) An unannounced placeholder end_time never completes an
// event — eventEndMs already returns null for date_confirmed === false.

import { eventEndMs, type EventDatesInput } from '@/lib/events/eventTime';

export interface EventLifecycleInput extends EventDatesInput {
  status?: string | null;
}

export function isEventCompleted(e: EventLifecycleInput, now: Date = new Date()): boolean {
  if (e.status === 'completed') return true;
  const end = eventEndMs(e);
  return end !== null && end < now.getTime();
}

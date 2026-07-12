/**
 * DIA | Periodic Check Service — Sprint 4B
 *
 * Time-based event detection for conditions that aren't triggered by
 * explicit user actions. Runs on app load and every 30 minutes while
 * the app is open.
 *
 * Checks:
 * - Stalled spaces (no activity in 7+ days)
 * - Overdue tasks (past due_date, not completed)
 * - Expiring opportunities (within 7 days of valid_until)
 * - Upcoming events (starting within 60 minutes)
 */

import { supabase } from '@/integrations/supabase/client';
import { diaEventBus } from './diaEventBus';

// ── Types for query results ───────────────────────────────

interface StalledSpace {
  id: string;
  created_by: string;
  daysSinceActivity: number;
}

interface OverdueTask {
  id: string;
  assignee_id: string;
  space_id: string;
}

interface ExpiringOpportunity {
  id: string;
  created_by: string;
  daysLeft: number;
}

interface UpcomingEvent {
  id: string;
  organizer_id: string;
  minutesUntilStart: number;
}

// ── Check: Stalled Spaces ─────────────────────────────────

async function checkStalledSpaces(_userId: string): Promise<StalledSpace[]> {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  console.debug('[Periodic check stubbed]', 'stalled_spaces');
  return [];
}

// ── Check: Overdue Tasks ──────────────────────────────────

async function checkOverdueTasks(_userId: string): Promise<OverdueTask[]> {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  console.debug('[Periodic check stubbed]', 'overdue_tasks');
  return [];
}

// ── Check: Expiring Opportunities ─────────────────────────

async function checkExpiringOpportunities(_userId: string): Promise<ExpiringOpportunity[]> {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  console.debug('[Periodic check stubbed]', 'expiring_opportunities');
  return [];
}

// ── Check: Upcoming Events ────────────────────────────────

async function checkUpcomingEvents(userId: string): Promise<UpcomingEvent[]> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select('id, organizer_id, start_time')
    .eq('organizer_id', userId)
    .neq('status', 'cancelled')
    .gt('start_time', now.toISOString())
    .lt('start_time', oneHourFromNow)
    .limit(5);

  if (!events) return [];

  return events.map(event => ({
    id: event.id as string,
    organizer_id: event.organizer_id as string,
    minutesUntilStart: Math.round(
      (new Date(event.start_time as string).getTime() - now.getTime()) / (60 * 1000),
    ),
  }));
}

// ── Main Periodic Check Runner ────────────────────────────

async function runPeriodicChecks(userId: string): Promise<void> {
  // Run all checks concurrently
  const [stalledSpaces, overdueTasks, expiringOpps, upcomingEvents] = await Promise.all([
    checkStalledSpaces(userId).catch(() => [] as StalledSpace[]),
    checkOverdueTasks(userId).catch(() => [] as OverdueTask[]),
    checkExpiringOpportunities(userId).catch(() => [] as ExpiringOpportunity[]),
    checkUpcomingEvents(userId).catch(() => [] as UpcomingEvent[]),
  ]);

  // Emit events for stalled spaces
  for (const space of stalledSpaces) {
    diaEventBus.emit({
      type: 'space_inactive',
      spaceId: space.id,
      creatorId: space.created_by,
      daysSinceActivity: space.daysSinceActivity,
    });
  }

  // Emit events for overdue tasks
  for (const task of overdueTasks) {
    diaEventBus.emit({
      type: 'task_overdue',
      taskId: task.id,
      assigneeId: task.assignee_id,
      spaceId: task.space_id,
    });
  }

  // Emit events for expiring opportunities
  for (const opp of expiringOpps) {
    diaEventBus.emit({
      type: 'opportunity_expiring',
      opportunityId: opp.id,
      ownerId: opp.created_by,
      daysLeft: opp.daysLeft,
    });
  }

  // Emit events for upcoming events
  for (const event of upcomingEvents) {
    diaEventBus.emit({
      type: 'event_starting_soon',
      eventId: event.id,
      hostId: event.organizer_id,
      startsIn: event.minutesUntilStart,
    });
  }
}

// ── Initialization ────────────────────────────────────────

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Initialize periodic checks for a user.
 * Runs immediately on call, then every 30 minutes.
 * Returns a cleanup function to stop the interval.
 */
export function initDIAPeriodicChecks(userId: string): () => void {
  // Defer initial check so it doesn't compete with page navigation queries
  const initialTimeout = setTimeout(() => {
    runPeriodicChecks(userId).catch(() => {
      // Silently fail — periodic checks are non-critical
    });
  }, 10_000); // 10 second delay after mount

  // Set up recurring interval
  const interval = setInterval(() => {
    runPeriodicChecks(userId).catch(() => {
      // Silently fail — periodic checks are non-critical
    });
  }, CHECK_INTERVAL_MS);

  // Return cleanup function
  return () => {
    clearTimeout(initialTimeout);
    clearInterval(interval);
  };
}

export const diaPeriodicCheck = {
  initDIAPeriodicChecks,
  runPeriodicChecks,
  checkStalledSpaces,
  checkOverdueTasks,
  checkExpiringOpportunities,
  checkUpcomingEvents,
};

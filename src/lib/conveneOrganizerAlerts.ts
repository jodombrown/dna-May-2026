/**
 * Convene Organizer Alerts
 *
 * Scans an organizer's upcoming events against their own historical
 * baseline and flags ones that need attention. Pure function over the
 * organizer analytics payload - no extra fetches, no realtime channels.
 */

import type { OrganizerAnalytics } from '@/hooks/useEventAnalytics';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface OrganizerAlert {
  eventId: string;
  title: string;
  startTime: string;
  daysUntil: number;
  goingCount: number;
  severity: AlertSeverity;
  headline: string;
  detail: string;
  cta: 'invite' | 'message' | 'review';
}

const daysBetween = (iso: string): number => {
  const start = new Date(iso).getTime();
  return Math.ceil((start - Date.now()) / (1000 * 60 * 60 * 24));
};

export function computeOrganizerAlerts(
  analytics: OrganizerAnalytics,
): OrganizerAlert[] {
  const baseline = analytics.avg_going_per_event || 0;
  const upcoming = (analytics.event_list ?? []).filter(
    (e) => new Date(e.start_time) > new Date(),
  );

  const alerts: OrganizerAlert[] = [];

  for (const event of upcoming) {
    const daysUntil = daysBetween(event.start_time);
    if (daysUntil < 0) continue;

    // Critical: less than a week out and severely under baseline.
    if (
      baseline > 0 &&
      daysUntil <= 7 &&
      event.going_count < baseline * 0.3
    ) {
      alerts.push({
        eventId: event.event_id,
        title: event.title,
        startTime: event.start_time,
        daysUntil,
        goingCount: event.going_count,
        severity: 'critical',
        headline: 'Attendance is tracking low',
        detail: `Only ${event.going_count} going with ${daysUntil} day${daysUntil === 1 ? '' : 's'} left. Your average is ${Math.round(baseline)}.`,
        cta: 'invite',
      });
      continue;
    }

    // Warning: 8-14 days out and below half the baseline.
    if (
      baseline > 0 &&
      daysUntil <= 14 &&
      daysUntil > 7 &&
      event.going_count < baseline * 0.5
    ) {
      alerts.push({
        eventId: event.event_id,
        title: event.title,
        startTime: event.start_time,
        daysUntil,
        goingCount: event.going_count,
        severity: 'warning',
        headline: 'Pace is slower than usual',
        detail: `${event.going_count} going so far. Two weeks out, you typically see ~${Math.round(baseline / 2)}.`,
        cta: 'invite',
      });
      continue;
    }

    // Info (good news): outperforming by 50% or more, far enough out to act.
    if (
      baseline > 0 &&
      daysUntil >= 3 &&
      event.going_count > baseline * 1.5
    ) {
      alerts.push({
        eventId: event.event_id,
        title: event.title,
        startTime: event.start_time,
        daysUntil,
        goingCount: event.going_count,
        severity: 'info',
        headline: 'This one is heating up',
        detail: `${event.going_count} going - ${Math.round((event.going_count / baseline - 1) * 100)}% above your norm. Consider raising capacity or sending a thank-you note to early RSVPs.`,
        cta: 'message',
      });
      continue;
    }

    // Final review nudge: event in 24-48h, no critical issues.
    if (daysUntil <= 2 && daysUntil >= 0 && event.going_count > 0) {
      alerts.push({
        eventId: event.event_id,
        title: event.title,
        startTime: event.start_time,
        daysUntil,
        goingCount: event.going_count,
        severity: 'info',
        headline: 'Final prep window',
        detail: `${event.going_count} going. Send a reminder, confirm logistics, prep check-in.`,
        cta: 'review',
      });
    }
  }

  // Sort: critical first, then warning, then info; within each, soonest first.
  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.daysUntil - b.daysUntil,
  );
}

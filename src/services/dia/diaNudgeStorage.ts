/**
 * DIA | Nudge Storage — Sprint 4B
 *
 * localStorage-based nudge persistence for the alpha release.
 * Stores nudges with automatic expiration and per-user filtering.
 *
 * Future: Migrate to Supabase-backed storage for cross-device sync.
 */

import type { DIACard } from '@/services/diaCardService';
import type { DIAPlatformEvent } from './diaEventTypes';

// ── Nudge Types ───────────────────────────────────────────

export interface DIAProactiveNudge {
  id: string;
  recipientId: string;
  event: DIAPlatformEvent;
  card: DIACard;
  channel: 'feed' | 'notification' | 'both';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  expiresAt: string;
  status: NudgeDeliveryStatus;
}

export type NudgeDeliveryStatus = 'pending' | 'delivered' | 'seen' | 'acted' | 'dismissed';

// ── Storage Format ────────────────────────────────────────

interface StoredNudge {
  id: string;
  nudge: DIAProactiveNudge;
  storedAt: string;
}

// ── Constants ─────────────────────────────────────────────

const STORAGE_KEY = 'dia_nudges';
const MAX_STORED_NUDGES = 50;

// ── Storage Operations ────────────────────────────────────

function getStoredNudges(): StoredNudge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredNudge[];
  } catch {
    return [];
  }
}

function saveStoredNudges(nudges: StoredNudge[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nudges));
}

/**
 * Store a new nudge. Automatically prunes expired nudges
 * and keeps the collection under the max limit.
 */
export function storeNudge(nudge: DIAProactiveNudge): void {
  const stored = getStoredNudges();
  stored.push({
    id: nudge.id,
    nudge,
    storedAt: new Date().toISOString(),
  });

  // Prune expired nudges and enforce max limit
  const now = new Date().toISOString();
  const active = stored
    .filter(s => s.nudge.expiresAt > now)
    .slice(-MAX_STORED_NUDGES);

  saveStoredNudges(active);
}

/**
 * Get all pending/delivered nudges for a specific user.
 * Filters out expired and terminal-state nudges.
 */
export function getPendingNudgesForUser(userId: string): DIAProactiveNudge[] {
  const now = new Date().toISOString();
  return getStoredNudges()
    .filter(s => s.nudge.recipientId === userId)
    .filter(s => s.nudge.status === 'pending' || s.nudge.status === 'delivered')
    .filter(s => s.nudge.expiresAt > now)
    .map(s => s.nudge);
}

/**
 * Get nudges for a user filtered by delivery channel.
 */
export function getNudgesForChannel(
  userId: string,
  channel: 'feed' | 'notification' | 'both',
): DIAProactiveNudge[] {
  return getPendingNudgesForUser(userId).filter(
    n => n.channel === channel || n.channel === 'both',
  );
}

/**
 * Update the status of a specific nudge.
 */
export function updateNudgeStatus(
  nudgeId: string,
  status: NudgeDeliveryStatus,
): void {
  const stored = getStoredNudges();
  const updated = stored.map(s => {
    if (s.id === nudgeId) {
      return {
        ...s,
        nudge: { ...s.nudge, status },
      };
    }
    return s;
  });
  saveStoredNudges(updated);
}

/**
 * Count nudges delivered today for throttle checking.
 */
export function countNudgesToday(userId: string): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStr = todayStart.toISOString();

  return getStoredNudges().filter(
    s =>
      s.nudge.recipientId === userId &&
      s.storedAt >= todayStr &&
      s.nudge.status !== 'dismissed',
  ).length;
}

/**
 * Count nudges of a specific event type delivered to a user in the last N hours.
 */
export function countRecentNudgesByType(
  userId: string,
  eventType: string,
  withinHours: number,
): number {
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

  return getStoredNudges().filter(
    s =>
      s.nudge.recipientId === userId &&
      s.nudge.event.type === eventType &&
      s.storedAt >= cutoff,
  ).length;
}

/**
 * Count notification-channel nudges delivered in the last hour.
 */
export function countNotificationsLastHour(userId: string): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  return getStoredNudges().filter(
    s =>
      s.nudge.recipientId === userId &&
      (s.nudge.channel === 'notification' || s.nudge.channel === 'both') &&
      s.storedAt >= oneHourAgo,
  ).length;
}

/**
 * Remove all nudges for a user (e.g., on logout).
 */
export function clearNudgesForUser(userId: string): void {
  const stored = getStoredNudges();
  const filtered = stored.filter(s => s.nudge.recipientId !== userId);
  saveStoredNudges(filtered);
}

export const diaNudgeStorage = {
  storeNudge,
  getPendingNudgesForUser,
  getNudgesForChannel,
  updateNudgeStatus,
  countNudgesToday,
  countRecentNudgesByType,
  countNotificationsLastHour,
  clearNudgesForUser,
};

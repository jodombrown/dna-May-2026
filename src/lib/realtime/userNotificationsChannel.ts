/**
 * Shared user-notifications channel (Phase 2B consolidation).
 *
 * Before: BadgeToastListener, useUnreadCounts, and useUnifiedNotifications
 * each created their own Supabase channel listening to the `notifications`
 * table filtered by `user_id`. That's 3 channels carrying overlapping payloads
 * to the same browser tab.
 *
 * After: one channel per user, multiple in-process listeners. Listeners
 * receive the raw postgres_changes payload and decide what to do.
 *
 * Pattern: ref-counted singleton. First subscribe creates+subscribes the
 * channel; last unsubscribe tears it down.
 */
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type NotificationRow = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  type?: string;
  payload?: Record<string, unknown> | null;
};

export interface UserNotificationPayload {
  eventType: NotificationEvent;
  new: NotificationRow;
  old: NotificationRow;
}

export interface ParticipantPayload {
  eventType: NotificationEvent;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

type NotifListener = (e: UserNotificationPayload) => void;
type ParticipantListener = (e: ParticipantPayload) => void;

interface Entry {
  channel: RealtimeChannel;
  refs: number;
  notifListeners: Set<NotifListener>;
  participantListeners: Set<ParticipantListener>;
}

const registry = new Map<string, Entry>();

function ensureEntry(userId: string): Entry {
  const existing = registry.get(userId);
  if (existing) return existing;

  const notifListeners = new Set<NotifListener>();
  const participantListeners = new Set<ParticipantListener>();

  const channel = supabase
    .channel(`user-notifs:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const evt: UserNotificationPayload = {
          eventType: payload.eventType as NotificationEvent,
          new: (payload.new ?? {}) as NotificationRow,
          old: (payload.old ?? {}) as NotificationRow,
        };
        for (const l of notifListeners) {
          try {
            l(evt);
          } catch {
            /* swallow */
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const evt: ParticipantPayload = {
          eventType: payload.eventType as NotificationEvent,
          new: (payload.new ?? {}) as Record<string, unknown>,
          old: (payload.old ?? {}) as Record<string, unknown>,
        };
        for (const l of participantListeners) {
          try {
            l(evt);
          } catch {
            /* swallow */
          }
        }
      }
    )
    .subscribe();

  const entry: Entry = {
    channel,
    refs: 0,
    notifListeners,
    participantListeners,
  };
  registry.set(userId, entry);
  return entry;
}

function release(userId: string) {
  const e = registry.get(userId);
  if (!e) return;
  e.refs -= 1;
  if (e.refs <= 0) {
    supabase.removeChannel(e.channel);
    registry.delete(userId);
  }
}

export function subscribeUserNotifications(
  userId: string,
  listener: NotifListener
): () => void {
  const entry = ensureEntry(userId);
  entry.refs += 1;
  entry.notifListeners.add(listener);
  return () => {
    entry.notifListeners.delete(listener);
    release(userId);
  };
}

export function subscribeUserParticipants(
  userId: string,
  listener: ParticipantListener
): () => void {
  const entry = ensureEntry(userId);
  entry.refs += 1;
  entry.participantListeners.add(listener);
  return () => {
    entry.participantListeners.delete(listener);
    release(userId);
  };
}

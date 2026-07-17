/**
 * DNA | Unified Notification Service — Sprint 4C
 *
 * Bridges platform notifications (Supabase `notifications` table) with
 * DIA nudge notifications (localStorage from Sprint 4B) into a single
 * notification stream for the notification panel.
 *
 * For alpha: hybrid storage — Supabase for platform, localStorage for DIA.
 * Future: single Supabase-backed store for all notification types.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  getPendingNudgesForUser,
  updateNudgeStatus,
  type DIAProactiveNudge,
} from '@/services/dia/diaNudgeStorage';
import { MODULE_ACCENT_COLORS, type DIACardCategory } from '@/services/diaCardService';
import type { NotificationRow } from '@/types/notificationsV2';

// ============================================================
// UNIFIED NOTIFICATION TYPES
// ============================================================

export type UnifiedNotificationType = 'platform' | 'dia';

/**
 * Panel filter lanes:
 * - `all`    — every notification (read + unread), across sources
 * - `unread` — read = false only
 * - `dia`    — the DIA insight lane only
 */
export type UnifiedNotificationFilter = 'all' | 'unread' | 'dia';

export interface UnifiedNotification {
  id: string;
  type: UnifiedNotificationType;
  headline: string;
  body: string | null;
  icon: string;
  accentColor: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  primaryAction: {
    label: string;
    route: string;
  } | null;
  secondaryAction: {
    label: string;
    route: string;
  } | null;
  isRead: boolean;
  createdAt: string;
  diaCategory: DIACardCategory | null;
  diaNudgeId: string | null;
  platformNotificationId: string | null;
  sourceType: string;
}

// ============================================================
// PLATFORM NOTIFICATION CONVERSION
// ============================================================

function convertPlatformNotification(notif: NotificationRow): UnifiedNotification {
  const routeMap: Record<string, string> = {
    connection_request: '/dna/connect/network?tab=requests',
    connection_accepted: notif.actor_username
      ? `/u/${notif.actor_username}`
      : '/dna/connect/network',
    post_like: notif.entity_id
      ? `/dna/feed?post=${notif.entity_id}`
      : '/dna/feed',
    post_comment: notif.entity_id
      ? `/dna/feed?post=${notif.entity_id}`
      : '/dna/feed',
    comment_reply: notif.entity_id
      ? `/dna/feed?post=${notif.entity_id}`
      : '/dna/feed',
    mention: notif.entity_id
      ? `/dna/feed?post=${notif.entity_id}`
      : '/dna/feed',
    reshare: notif.entity_id
      ? `/dna/feed?post=${notif.entity_id}`
      : '/dna/feed',
    new_message: notif.entity_id
      ? `/dna/messages/${notif.entity_id}`
      : '/dna/messages',
    event_invite: notif.entity_id
      ? `/dna/convene/events/${notif.entity_id}`
      : '/dna/convene',
    event_reminder: notif.entity_id
      ? `/dna/convene/events/${notif.entity_id}`
      : '/dna/convene',
    group_invite: notif.entity_id
      ? `/dna/collaborate/spaces/${notif.entity_id}`
      : '/dna/collaborate',
    profile_view: notif.actor_username
      ? `/u/${notif.actor_username}`
      : '/dna/connect',
    feedback_status_change: '/dna/settings',
    // Sprint 13 additions
    badge_earned: notif.actor_username
      ? `/u/${notif.actor_username}`
      : '/dna/profile/edit',
    new_follower: notif.actor_username
      ? `/u/${notif.actor_username}`
      : '/dna/connect',
    opportunity_interest: '/dna/contribute',
    opportunity_interest_accepted: '/dna/contribute',
    opportunity_interest_declined: '/dna/contribute',
    opportunity_fulfilled: '/dna/contribute',
    event_rsvp: notif.entity_id
      ? `/dna/convene/events/${notif.entity_id}`
      : '/dna/convene',
  };

  const labelMap: Record<string, string> = {
    connection_request: 'View Request',
    connection_accepted: 'View Profile',
    post_like: 'View Post',
    post_comment: 'View Post',
    comment_reply: 'View Post',
    mention: 'View Post',
    reshare: 'View Post',
    new_message: 'Reply',
    event_invite: 'View Event',
    event_reminder: 'View Event',
    group_invite: 'View Space',
    profile_view: 'View Profile',
    feedback_status_change: 'View',
    // Sprint 13 additions
    badge_earned: 'View Badge',
    new_follower: 'View Profile',
    opportunity_interest: 'View Interest',
    opportunity_interest_accepted: 'View',
    opportunity_interest_declined: 'View',
    opportunity_fulfilled: 'View',
    event_rsvp: 'View Event',
  };

  return {
    id: `platform-${notif.notification_id}`,
    type: 'platform',
    headline: notif.title || notif.message,
    body: notif.title ? notif.message : null,
    icon: notif.type,
    accentColor: null,
    actorName: notif.actor_full_name || null,
    actorAvatarUrl: notif.actor_avatar_url || null,
    primaryAction: {
      label: labelMap[notif.type] || 'View',
      route: routeMap[notif.type] || notif.action_url || '/dna/feed',
    },
    secondaryAction: null,
    isRead: notif.read,
    createdAt: notif.created_at,
    diaCategory: null,
    diaNudgeId: null,
    platformNotificationId: notif.notification_id,
    sourceType: notif.type,
  };
}

// ============================================================
// DIA NUDGE CONVERSION
// ============================================================

function convertDiaNudge(nudge: DIAProactiveNudge): UnifiedNotification {
  const primaryAction = nudge.card.actions.find(a => a.isPrimary);
  const secondaryAction = nudge.card.actions.find(a => !a.isPrimary);

  return {
    id: `dia-${nudge.id}`,
    type: 'dia',
    headline: nudge.card.headline,
    body: nudge.card.body,
    icon: nudge.card.icon,
    accentColor: nudge.card.accentColor || MODULE_ACCENT_COLORS[nudge.card.category],
    actorName: null,
    actorAvatarUrl: null,
    primaryAction: primaryAction
      ? {
          label: primaryAction.label,
          route: (primaryAction.payload.url as string) || '/dna/feed',
        }
      : null,
    secondaryAction: secondaryAction
      ? {
          label: secondaryAction.label,
          route: (secondaryAction.payload.url as string) || '/dna/feed',
        }
      : null,
    isRead: nudge.status !== 'pending',
    createdAt: nudge.createdAt,
    diaCategory: nudge.card.category,
    diaNudgeId: nudge.id,
    platformNotificationId: null,
    sourceType: 'dia_nudge',
  };
}

// ============================================================
// SERVICE
// ============================================================

export const unifiedNotificationService = {
  /**
   * Get unified notifications from both platform and DIA sources.
   *
   * `filter` selects the lane:
   * - `all`    → all platform + DIA notifications (paginated by `limit`/`offset`)
   * - `unread` → read = false only
   * - `dia`    → DIA lane only
   */
  async getNotifications(
    userId: string,
    filter: UnifiedNotificationFilter = 'all',
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<UnifiedNotification[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const unreadOnly = filter === 'unread';
    const notifications: UnifiedNotification[] = [];

    // Get platform notifications (skipped only for the DIA-only lane)
    if (filter !== 'dia') {
      try {
        const { data, error } = await (supabase.rpc as Function)(
          'get_user_notifications',
          {
            p_user_id: userId,
            p_unread_only: unreadOnly,
            p_limit: limit,
            p_offset: offset,
          }
        );

        if (!error && data) {
          const platformNotifs = (data as unknown as NotificationRow[]).map(
            convertPlatformNotification
          );
          notifications.push(...platformNotifs);
        }
      } catch {
        // Platform notifications unavailable, continue with DIA only
      }
    }

    // Get DIA notifications (present in every lane; unread lane keeps unseen only)
    const diaNudges = getPendingNudgesForUser(userId).filter(
      n => n.channel === 'notification' || n.channel === 'both'
    );
    const diaNotifs = diaNudges.map(convertDiaNudge);
    if (unreadOnly) {
      notifications.push(...diaNotifs.filter(n => !n.isRead));
    } else {
      notifications.push(...diaNotifs);
    }

    // Sort by createdAt descending
    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return notifications.slice(0, limit);
  },

  /**
   * Mark a platform notification as read.
   *
   * `read` is the canonical column post-N2; the DB keeps the legacy `is_read`
   * column in lockstep via the notifications_sync_read trigger until it is
   * dropped in the N2 DB tail.
   */
  async markPlatformAsRead(
    userId: string,
    notificationId: string
  ): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  },

  /**
   * Mark a DIA notification as seen.
   */
  markDiaAsRead(nudgeId: string): void {
    updateNudgeStatus(nudgeId, 'seen');
  },

  /**
   * Mark a DIA notification as acted upon.
   */
  markDiaAsActed(nudgeId: string): void {
    updateNudgeStatus(nudgeId, 'acted');
  },

  /**
   * Dismiss a DIA notification.
   */
  dismissDia(nudgeId: string): void {
    updateNudgeStatus(nudgeId, 'dismissed');
  },

  /**
   * Dismiss a platform notification.
   */
  async dismissPlatform(
    userId: string,
    notificationId: string
  ): Promise<void> {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
  },

  /**
   * Mark all platform notifications as read.
   */
  async markAllPlatformAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
  },

  /**
   * Mark a unified notification as read/acted based on its type.
   */
  async markAsRead(
    userId: string,
    notification: UnifiedNotification
  ): Promise<void> {
    if (notification.type === 'platform' && notification.platformNotificationId) {
      await this.markPlatformAsRead(userId, notification.platformNotificationId);
    } else if (notification.type === 'dia' && notification.diaNudgeId) {
      this.markDiaAsRead(notification.diaNudgeId);
    }
  },

  /**
   * Mark a unified notification as acted upon.
   */
  async markAsActed(
    userId: string,
    notification: UnifiedNotification
  ): Promise<void> {
    if (notification.type === 'platform' && notification.platformNotificationId) {
      await this.markPlatformAsRead(userId, notification.platformNotificationId);
    } else if (notification.type === 'dia' && notification.diaNudgeId) {
      this.markDiaAsActed(notification.diaNudgeId);
    }
  },

  /**
   * Dismiss a unified notification.
   */
  async dismiss(
    userId: string,
    notification: UnifiedNotification
  ): Promise<void> {
    if (notification.type === 'platform' && notification.platformNotificationId) {
      await this.dismissPlatform(userId, notification.platformNotificationId);
    } else if (notification.type === 'dia' && notification.diaNudgeId) {
      this.dismissDia(notification.diaNudgeId);
    }
  },
};

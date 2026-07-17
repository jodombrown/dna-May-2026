/**
 * DNA | Unified Notification Service
 *
 * Single source for the notification panel. Everything the panel shows is a row
 * in the Supabase `notifications` table — including DIA insight cards, which the
 * DB bridge (`dia_promote_grounded_to_notifications`) promotes onto the spine
 * with `payload.source === 'dia'`. There is no longer a parallel client-side
 * `dia_nudges` merge in the panel path; the DIA lane is simply a filter over the
 * platform stream where `payload.source === 'dia'`.
 */

import { supabase } from '@/integrations/supabase/client';
import { updateNudgeStatus } from '@/services/dia/diaNudgeStorage';
import { MODULE_ACCENT_COLORS, type DIACardCategory } from '@/services/diaCardService';
import type { NotificationRow } from '@/types/notificationsV2';

/**
 * Notification `type` values written by the DIA→notifications bridge. Rows with
 * these types carry `payload.source === 'dia'` and are rendered as DIA cards
 * from the spine, so they are dropped from the generic platform stream (they
 * would otherwise render twice / without their C accent).
 */
const DIA_SPINE_TYPES = ['dia_brief', 'dia_nudge'] as const;

const DIA_CARD_CATEGORIES: DIACardCategory[] = [
  'connect', 'convene', 'collaborate', 'contribute', 'convey', 'cross_c',
];

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
// DIA SPINE CONVERSION
// ============================================================

/**
 * Raw shape of a DIA notification row read straight off the spine. The generated
 * Supabase types lag the live schema in places, so the columns we depend on are
 * declared here explicitly.
 */
interface DiaSpineRow {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  link_url: string | null;
  category: string | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

/** The row's `category` column is the C. Fall back to cross-C if absent. */
function normalizeDiaCategory(category: string | null): DIACardCategory {
  return category && (DIA_CARD_CATEGORIES as string[]).includes(category)
    ? (category as DIACardCategory)
    : 'cross_c';
}

/**
 * Convert a promoted DIA notification row into a unified DIA card. The visual
 * accent maps to the row's `category` (the C), so a promoted convene brief reads
 * as convene-accented. Marking/dismissing routes through the notifications table
 * (via `platformNotificationId`) — these are ordinary notification rows now.
 */
function convertDiaSpineRow(row: DiaSpineRow): UnifiedNotification {
  const payload = row.payload ?? {};
  const diaKind = payload.dia_kind === 'nudge' ? 'nudge' : 'brief';
  const category = normalizeDiaCategory(row.category);
  const ctaLabel =
    typeof payload.cta_label === 'string' && payload.cta_label
      ? payload.cta_label
      : null;
  const defaultHeadline = diaKind === 'nudge' ? 'DIA suggestion' : 'DIA insight';
  const defaultCta = diaKind === 'nudge' ? 'View suggestion' : 'View insight';

  return {
    id: `platform-${row.id}`,
    type: 'dia',
    headline: row.title || defaultHeadline,
    body: row.message || null,
    icon: 'MateMasie',
    accentColor: MODULE_ACCENT_COLORS[category],
    actorName: null,
    actorAvatarUrl: null,
    primaryAction: row.link_url
      ? { label: ctaLabel || defaultCta, route: row.link_url }
      : null,
    secondaryAction: null,
    isRead: row.read,
    createdAt: row.created_at,
    diaCategory: category,
    diaNudgeId: null,
    platformNotificationId: row.id,
    sourceType: row.type,
  };
}

/**
 * Read DIA notifications off the spine (`payload.source === 'dia'`). Server-side
 * filtered so the DIA lane shows every DIA row, not just those that happened to
 * land in the platform stream's page.
 */
async function fetchDiaSpineNotifications(
  userId: string,
  opts: { unreadOnly: boolean; limit: number }
): Promise<UnifiedNotification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('id, type, title, message, link_url, category, payload, read, created_at')
      .eq('user_id', userId)
      .contains('payload', { source: 'dia' })
      .order('created_at', { ascending: false })
      .limit(opts.limit);

    if (opts.unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as unknown as DiaSpineRow[]).map(convertDiaSpineRow);
  } catch {
    return [];
  }
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

    // Get platform notifications (skipped only for the DIA-only lane). DIA rows
    // live in this same stream (type dia_brief/dia_nudge); we drop them here and
    // re-add them below from the spine with full DIA styling and their C accent.
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
          const platformNotifs = (data as unknown as NotificationRow[])
            .filter(n => !(DIA_SPINE_TYPES as readonly string[]).includes(n.type))
            .map(convertPlatformNotification);
          notifications.push(...platformNotifs);
        }
      } catch {
        // Platform notifications unavailable, continue with DIA only
      }
    }

    // Get DIA notifications off the spine (present in every lane; unread lane
    // keeps unread rows only). This is the DIA lane's only source.
    const diaNotifs = await fetchDiaSpineNotifications(userId, {
      unreadOnly,
      limit,
    });
    notifications.push(...diaNotifs);

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
   * Mark a unified notification as read.
   *
   * Both platform and promoted-DIA notifications are rows in the notifications
   * table (they carry `platformNotificationId`), so both mark through the table.
   * The `diaNudgeId` branch remains only for any legacy localStorage nudge.
   */
  async markAsRead(
    userId: string,
    notification: UnifiedNotification
  ): Promise<void> {
    if (notification.platformNotificationId) {
      await this.markPlatformAsRead(userId, notification.platformNotificationId);
    } else if (notification.diaNudgeId) {
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
    if (notification.platformNotificationId) {
      await this.markPlatformAsRead(userId, notification.platformNotificationId);
    } else if (notification.diaNudgeId) {
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
    if (notification.platformNotificationId) {
      await this.dismissPlatform(userId, notification.platformNotificationId);
    } else if (notification.diaNudgeId) {
      this.dismissDia(notification.diaNudgeId);
    }
  },
};

/**
 * DNA | Notification System V2 — Enhanced Type System
 *
 * Unified communication channel — every meaningful event across all Five C's
 * flows through one system, rendered consistently, and intelligently
 * prioritized by DIA.
 *
 * Extends the existing notification types with:
 * - Five C's categorization
 * - DIA-powered prioritization
 * - Multi-channel delivery (in-app, push, email, in-feed)
 * - Intelligent batching
 * - Digest generation
 */

import type { FiveCModule, SubscriptionTier, NudgePriority } from './dia';

// =====================================================
// NOTIFICATION CATEGORIES (Five C's Aligned)
// =====================================================

/** Notification category mapped to the Five C's plus system contexts */
export type NotificationCategory =
  | 'connections'   // CONNECT — requests, acceptances, profile views, endorsements
  | 'events'        // CONVENE — RSVPs, reminders, updates, co-host invitations
  | 'spaces'        // COLLABORATE — task assigned, space invitation, milestones, stall alerts
  | 'opportunities' // CONTRIBUTE — new match, interest expressed, deadline approaching
  | 'content'       // CONVEY — liked/commented/reshared, new follower, series update
  | 'dia'           // DIA — nudges, insights, weekly digest, milestone celebrations
  | 'system';       // Platform — security alerts, tier upgrades, payment confirmations

/** Extended notification types covering all Five C's */
export type NotificationTypeV2 =
  // CONNECT
  | 'connection_request'
  | 'connection_accepted'
  | 'profile_view'
  | 'endorsement'
  | 'mutual_connection'
  // CONVENE
  | 'event_invite'
  | 'event_reminder'
  | 'event_update'
  | 'event_rsvp_confirmation'
  | 'event_cohost_invitation'
  | 'event_starting_soon'
  // COLLABORATE
  | 'space_invitation'
  | 'task_assigned'
  | 'task_completed'
  | 'milestone_reached'
  | 'space_stall_alert'
  | 'space_activity'
  // CONTRIBUTE
  | 'opportunity_match'
  | 'interest_expressed'
  | 'opportunity_deadline'
  | 'opportunity_fulfilled'
  // CONVEY
  | 'post_like'
  | 'post_comment'
  | 'post_reshare'
  | 'comment_reply'
  | 'new_follower'
  | 'mention'
  | 'story_published'
  // DIA
  | 'dia_nudge'
  | 'dia_insight'
  | 'dia_weekly_digest'
  | 'dia_milestone'
  // System
  | 'security_alert'
  | 'tier_upgrade'
  | 'payment_confirmation'
  | 'feedback_status_change'
  | 'system_announcement';

// =====================================================
// DELIVERY CHANNELS
// =====================================================

/** Available delivery channels */
export type DeliveryChannel = 'in_app' | 'push' | 'email' | 'in_feed';

/** Channel selection result from DIA */
export interface ChannelDecision {
  channels: DeliveryChannel[];
  reason: string; // Why DIA chose these channels
  delay_minutes?: number; // Delay delivery for batching
}

// =====================================================
// NOTIFICATION PRIORITY
// =====================================================

/** Priority levels with default urgency by category */
export const CATEGORY_DEFAULT_PRIORITY: Record<NotificationCategory, NudgePriority> = {
  connections: 'medium',
  events: 'high',       // Time-sensitive
  spaces: 'medium',
  opportunities: 'medium',
  content: 'low',
  dia: 'medium',
  system: 'high',
};

// =====================================================
// CORE NOTIFICATION ENTITY (V2)
// =====================================================

export interface NotificationV2 {
  id: string;
  user_id: string;
  category: NotificationCategory;
  type: NotificationTypeV2;
  priority: NudgePriority;

  // Content
  title: string;
  message: string;
  action_url?: string;

  // Actor info (who triggered it)
  actor_id?: string;
  actor_name?: string;
  actor_avatar_url?: string;

  // Entity reference
  entity_type?: string;
  entity_id?: string;

  // Delivery
  channels_delivered: DeliveryChannel[];
  read: boolean;
  is_batched: boolean;
  batch_id?: string;

  // DIA metadata
  dia_relevance_score?: number; // DIA's computed relevance (0-100)
  dia_channel_reason?: string;  // Why DIA chose the delivery channel(s)

  // Timestamps
  created_at: string;
  read_at?: string;
  delivered_at?: string;

  // Extensible payload
  payload?: Record<string, unknown>;
}

// =====================================================
// PLATFORM NOTIFICATION ROW (get_user_notifications RPC shape)
// =====================================================

/**
 * Row shape returned by the `get_user_notifications` RPC for a platform
 * notification. Folded here from the retired `types/notifications.ts` during
 * the N2 notifications convergence. `read` is the canonical read column
 * (post-N2); there is no `is_read` field on this type.
 */
export interface NotificationRow {
  notification_id: string;
  actor_id?: string;
  actor_username?: string;
  actor_full_name?: string;
  actor_avatar_url?: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
  payload?: Record<string, unknown>;
}

// =====================================================
// NOTIFICATION BATCHING
// =====================================================

/**
 * DIA groups similar notifications into batches.
 * Instead of "X liked your post" x10, it becomes "10 people liked your post".
 */
export interface NotificationBatch {
  batch_id: string;
  user_id: string;
  category: NotificationCategory;
  type: NotificationTypeV2;
  count: number;
  title: string; // Aggregated title: "10 people liked your post"
  message: string;
  actor_ids: string[];
  actor_names: string[];
  entity_id?: string;
  action_url?: string;
  created_at: string;
  last_updated_at: string;
}

/** Batch configuration — which notification types should be batched */
export const BATCHABLE_TYPES: NotificationTypeV2[] = [
  'post_like',
  'post_comment',
  'post_reshare',
  'profile_view',
  'new_follower',
];

/** Batch window — how long to wait before sending a batch */
export const BATCH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// =====================================================
// USER NOTIFICATION PREFERENCES (V2)
// =====================================================

export interface NotificationPreferencesV2 {
  id: string;
  user_id: string;

  // Per-category channel preferences
  category_preferences: Record<NotificationCategory, CategoryChannelPrefs>;

  // Global settings
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:mm in user's timezone
  quiet_hours_end: string;
  timezone: string;

  // Digest preferences
  digest_frequency: 'never' | 'daily' | 'weekly';
  digest_day?: number; // Day of week for weekly digest (0=Sun, 6=Sat)
  digest_time?: string; // HH:mm

  // DIA control
  dia_nudges_enabled: boolean;
  dia_insights_in_feed: boolean;

  updated_at: string;
}

export interface CategoryChannelPrefs {
  in_app: boolean;
  push: boolean;
  email: boolean;
}

/** Default preferences for new users */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferencesV2, 'id' | 'user_id' | 'updated_at'> = {
  category_preferences: {
    connections: { in_app: true, push: true, email: true },
    events: { in_app: true, push: true, email: true },
    spaces: { in_app: true, push: true, email: false },
    opportunities: { in_app: true, push: true, email: true },
    content: { in_app: true, push: false, email: false },
    dia: { in_app: true, push: false, email: false },
    system: { in_app: true, push: true, email: true },
  },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  timezone: 'Africa/Lagos',
  digest_frequency: 'weekly',
  digest_day: 1, // Monday
  digest_time: '09:00',
  dia_nudges_enabled: true,
  dia_insights_in_feed: true,
};

// =====================================================
// WEEKLY DIGEST
// =====================================================

/**
 * DIA-curated weekly digest structure.
 * "Here's what you missed this week across your Five C's"
 */
export interface WeeklyDigest {
  user_id: string;
  period_start: string;
  period_end: string;

  // Per-C summary
  connect_summary: DigestSection;
  convene_summary: DigestSection;
  collaborate_summary: DigestSection;
  contribute_summary: DigestSection;
  convey_summary: DigestSection;

  // DIA highlights
  top_insight: string | null;
  trending_in_network: string[];
  recommended_action: string | null;

  generated_at: string;
}

export interface DigestSection {
  headline: string;
  count: number;
  highlights: string[];
}

// =====================================================
// NOTIFICATION INTELLIGENCE SERVICE INTERFACE
// =====================================================

export interface NotificationIntelligenceService {
  /** Evaluate notification and decide priority, channels, and batching */
  evaluateNotification(
    notification: Omit<NotificationV2, 'id' | 'channels_delivered' | 'read' | 'is_batched' | 'created_at'>,
    userPrefs: NotificationPreferencesV2,
  ): ChannelDecision;

  /** Check if notification should be batched with existing notifications */
  shouldBatch(type: NotificationTypeV2, userId: string): Promise<string | null>;

  /** Generate weekly digest for a user */
  generateDigest(userId: string): Promise<WeeklyDigest>;

  /** Check if user is in quiet hours */
  isQuietHours(prefs: NotificationPreferencesV2): boolean;
}

// =====================================================
// NOTIFICATION TIER FEATURES
// =====================================================

export interface NotificationTierFeatures {
  tier: SubscriptionTier;
  priority_notifications: boolean; // Pro+: Higher priority in notification ranking
  custom_digest_frequency: boolean; // Pro+: Custom digest schedule
  team_notification_management: boolean; // Org: Manage team notification policies
  notification_analytics: boolean; // Pro+: See notification engagement metrics
}

export const NOTIFICATION_TIER_FEATURES: Record<SubscriptionTier, NotificationTierFeatures> = {
  free: {
    tier: 'free',
    priority_notifications: false,
    custom_digest_frequency: false,
    team_notification_management: false,
    notification_analytics: false,
  },
  pro: {
    tier: 'pro',
    priority_notifications: true,
    custom_digest_frequency: true,
    team_notification_management: false,
    notification_analytics: true,
  },
  org: {
    tier: 'org',
    priority_notifications: true,
    custom_digest_frequency: true,
    team_notification_management: true,
    notification_analytics: true,
  },
};

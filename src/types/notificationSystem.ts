/**
 * DNA | Notification System — Complete Type System
 *
 * The communication layer that transforms platform activity, DIA intelligence,
 * and time-sensitive events into signals that reach users at the right moment,
 * through the right channel, with the right level of urgency.
 *
 * Core principle: Every notification must answer "Why should I care about this right now?"
 *
 * Features:
 * - Five C's awareness with C-module visual coding
 * - DIA-powered intelligence for priority, channel, timing, and batching
 * - Cross-C circulation bridging modules
 * - Diaspora timezone intelligence
 */

import { CModule } from './composer';

// ============================================================
// NOTIFICATION TYPES (exhaustive per C module)
// ============================================================

export enum NotificationType {
  // -- CONNECT (Emerald) --
  CONNECTION_REQUEST_RECEIVED = 'connection_request_received',
  CONNECTION_REQUEST_ACCEPTED = 'connection_request_accepted',
  CONNECTION_SUGGESTION = 'connection_suggestion',
  PROFILE_VIEWED = 'profile_viewed',
  PROFILE_ENDORSED = 'profile_endorsed',
  MENTIONED_IN_POST = 'mentioned_in_post',
  MENTIONED_IN_COMMENT = 'mentioned_in_comment',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  POST_RESHARED = 'post_reshared',
  COMMENT_REPLIED = 'comment_replied',
  NETWORK_MILESTONE = 'network_milestone',

  // -- CONVENE (Amber-Gold) --
  EVENT_INVITATION = 'event_invitation',
  EVENT_RSVP_CONFIRMED = 'event_rsvp_confirmed',
  EVENT_REMINDER_24H = 'event_reminder_24h',
  EVENT_REMINDER_1H = 'event_reminder_1h',
  EVENT_STARTING_NOW = 'event_starting_now',
  EVENT_UPDATED = 'event_updated',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_COHOST_INVITATION = 'event_cohost_invitation',
  EVENT_NEW_ATTENDEE = 'event_new_attendee',
  EVENT_CAPACITY_WARNING = 'event_capacity_warning',
  EVENT_RECOMMENDATION = 'event_recommendation',
  EVENT_CONNECTIONS_ATTENDING = 'event_connections_attending',
  POST_EVENT_RECAP_PROMPT = 'post_event_recap_prompt',

  // -- COLLABORATE (Forest Green) --
  SPACE_INVITATION = 'space_invitation',
  SPACE_JOIN_REQUEST = 'space_join_request',
  SPACE_JOIN_APPROVED = 'space_join_approved',
  SPACE_ROLE_ASSIGNED = 'space_role_assigned',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  SPACE_MILESTONE = 'space_milestone',
  SPACE_STALL_ALERT = 'space_stall_alert',
  SPACE_MENTION = 'space_mention',
  SPACE_RECOMMENDATION = 'space_recommendation',

  // -- CONTRIBUTE (Copper) --
  OPPORTUNITY_MATCH = 'opportunity_match',
  OPPORTUNITY_INTEREST_RECEIVED = 'opportunity_interest_received',
  OPPORTUNITY_INTEREST_ACCEPTED = 'opportunity_interest_accepted',
  OPPORTUNITY_DEADLINE_APPROACHING = 'opportunity_deadline_approaching',
  OPPORTUNITY_EXPIRED = 'opportunity_expired',
  OPPORTUNITY_SKILLS_IN_DEMAND = 'opportunity_skills_in_demand',
  OPPORTUNITY_NEW_IN_CATEGORY = 'opportunity_new_in_category',

  // -- CONVEY (Deep Teal) --
  STORY_LIKED = 'story_liked',
  STORY_COMMENTED = 'story_commented',
  STORY_RESHARED = 'story_reshared',
  STORY_NEW_FOLLOWER = 'story_new_follower',
  STORY_SERIES_UPDATE = 'story_series_update',
  STORY_ENGAGEMENT_MILESTONE = 'story_engagement_milestone',
  STORY_TRENDING = 'story_trending',
  STORY_EXPAND_PROMPT = 'story_expand_prompt',

  // -- DIA (Gold) --
  DIA_WEEKLY_DIGEST = 'dia_weekly_digest',
  DIA_IMPACT_SNAPSHOT = 'dia_impact_snapshot',
  DIA_FIVE_C_ACTIVATION = 'dia_five_c_activation',
  DIA_RECONNECT_SUGGESTION = 'dia_reconnect_suggestion',
  DIA_TRENDING_TOPIC = 'dia_trending_topic',

  // -- SYSTEM --
  SYSTEM_SECURITY_ALERT = 'system_security_alert',
  SYSTEM_PAYMENT_CONFIRMED = 'system_payment_confirmed',
  SYSTEM_PAYMENT_FAILED = 'system_payment_failed',
  SYSTEM_TIER_UPGRADED = 'system_tier_upgraded',
  SYSTEM_TIER_EXPIRING = 'system_tier_expiring',
  SYSTEM_PLATFORM_UPDATE = 'system_platform_update',

  // -- MESSAGING --
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_GROUP_ADDED = 'message_group_added',
  MESSAGE_REACTION = 'message_reaction',
}

// ============================================================
// NOTIFICATION ENUMS
// ============================================================

// Category taxonomy is the Five C's spine plus system, keyed to match the DB
// `dia_preferences.push_categories` jsonb exactly. notif_should_push reads these
// keys directly, so any drift here silently breaks the push router.
export enum NotificationCategory {
  CONNECT = 'connect',
  CONVENE = 'convene',
  COLLABORATE = 'collaborate',
  CONTRIBUTE = 'contribute',
  CONVEY = 'convey',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  CRITICAL = 'critical',
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  DIGEST = 'digest',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL_IMMEDIATE = 'email_immediate',
  EMAIL_DIGEST = 'email_digest',
  BADGE = 'badge',
}

export enum NotificationStatus {
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  DELIVERED = 'delivered',
  SEEN = 'seen',
  OPENED = 'opened',
  ACTED_ON = 'acted_on',
  DISMISSED = 'dismissed',
  BATCHED = 'batched',
  SUPPRESSED = 'suppressed',
  EXPIRED = 'expired',
}

// ============================================================
// NOTIFICATION TARGET & ACTION TYPES
// ============================================================

export type NotificationTargetType =
  | 'profile' | 'post' | 'comment' | 'story' | 'event'
  | 'space' | 'task' | 'opportunity' | 'message'
  | 'conversation' | 'dia_insight' | 'system';

export interface NotificationAction {
  type: 'navigate' | 'inline_accept' | 'inline_dismiss' | 'open_composer' | 'open_chat' | 'external_link';
  label: string;
  route: string | null;
  payload: Record<string, unknown>;
}

export type NotificationIconType =
  | 'connect_request' | 'connect_accepted' | 'like' | 'comment'
  | 'reshare' | 'mention' | 'milestone'
  | 'event_invite' | 'event_reminder' | 'event_update' | 'event_live'
  | 'space_invite' | 'task_assign' | 'task_complete' | 'stall_alert'
  | 'opportunity_match' | 'opportunity_interest' | 'opportunity_deadline'
  | 'story_engage' | 'follower' | 'trending'
  | 'dia_insight' | 'dia_digest'
  | 'security' | 'payment' | 'system'
  | 'message';

// ============================================================
// CROSS-C CONTEXT
// ============================================================

export interface CrossCNotificationContext {
  bridgedModules: CModule[];
  contextLine: string;
  relatedEntities: {
    type: NotificationTargetType;
    id: string;
    name: string;
  }[];
}

// ============================================================
// CORE NOTIFICATION RECORD
// ============================================================

export interface NotificationRecord {
  id: string;
  recipientId: string;
  type: NotificationType;
  category: NotificationCategory;
  cModule: CModule;
  priority: NotificationPriority;

  // Content
  headline: string;
  body: string | null;
  imageUrl: string | null;
  iconType: NotificationIconType;

  // Actor (who triggered this)
  actorId: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;

  // Target (what the notification is about)
  targetType: NotificationTargetType;
  targetId: string;
  targetTitle: string | null;

  // Action
  primaryAction: NotificationAction;
  secondaryAction: NotificationAction | null;

  // Cross-C context
  crossCContext: CrossCNotificationContext | null;

  // Delivery
  channels: NotificationChannel[];
  deliveredVia: NotificationChannel[];
  scheduledFor: string | null;
  batchId: string | null;

  // Status tracking
  status: NotificationStatus;
  createdAt: string;
  deliveredAt: string | null;
  seenAt: string | null;
  openedAt: string | null;
  actedOnAt: string | null;
  dismissedAt: string | null;

  // DIA metadata
  diaScore: number;
  diaSuppressed: boolean;
  diaSuppressionReason: string | null;
}

// ============================================================
// NOTIFICATION BATCH
// ============================================================

export type NotificationBatchType =
  | 'post_likes'
  | 'post_comments'
  | 'story_engagement'
  | 'event_attendees'
  | 'space_activity'
  | 'opportunity_interest'
  | 'profile_views'
  | 'connection_suggestions';

export interface NotificationBatch {
  id: string;
  recipientId: string;
  batchType: NotificationBatchType;
  headline: string;
  itemCount: number;
  representativeActors: {
    name: string;
    avatarUrl: string | null;
  }[];
  cModule: CModule;
  targetType: NotificationTargetType;
  targetId: string;
  targetTitle: string | null;
  primaryAction: NotificationAction;
  childNotificationIds: string[];
  createdAt: string;
  status: NotificationStatus;
}

// ============================================================
// USER NOTIFICATION PREFERENCES
// ============================================================

export type NotificationFrequency = 'high' | 'normal' | 'low' | 'never';

// Client shape of a `dia_preferences` row — the canonical preferences table.
// getPreferences/updatePreferences map this to/from the snake_case DB columns.
export interface NotificationPreferences {
  userId: string;

  // Global controls
  globalEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number; // 0-23, from dia_preferences.quiet_hours_start (time)
  quietHoursEnd: number;   // 0-23, from dia_preferences.quiet_hours_end (time)
  timezone: string;

  // Channel masters
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;

  // Per-category push — a flat Five-C + system → bool map, mirroring
  // `dia_preferences.push_categories`. In-app is always on (it's the row itself);
  // push follows this bool. notif_should_push reads these keys directly.
  pushCategories: Record<NotificationCategory, boolean>;

  // Email cadence + per-type email switches. Email is deferred (Tier 2); these
  // round-trip the DB row so the deferred UI stays truthful.
  notificationFrequency: NotificationFrequency;
  emailConnections: boolean;
  emailComments: boolean;
  emailReactions: boolean;
  emailMentions: boolean;
  emailMessages: boolean;
  emailEvents: boolean;
  emailStories: boolean;

  unsubscribeToken: string | null;

  updatedAt: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  globalEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  timezone: 'UTC',
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true,
  notificationFrequency: 'normal',
  emailConnections: true,
  emailComments: true,
  emailReactions: true,
  emailMentions: true,
  emailMessages: true,
  emailEvents: true,
  emailStories: true,
  unsubscribeToken: null,
  // Mirrors the DB `dia_preferences.push_categories` default: high-signal C's
  // (convene/collaborate/system) push, low-signal (connect/contribute/convey) stay
  // in-app only. In-app is always on — it's the notification row itself.
  pushCategories: {
    [NotificationCategory.CONNECT]: false,
    [NotificationCategory.CONVENE]: true,
    [NotificationCategory.COLLABORATE]: true,
    [NotificationCategory.CONTRIBUTE]: false,
    [NotificationCategory.CONVEY]: false,
    [NotificationCategory.SYSTEM]: true,
  },
};

// ============================================================
// NOTIFICATION CENTER UI TYPES
// ============================================================

export type NotificationDisplayItem = NotificationRecord | NotificationBatch;

export interface NotificationFilter {
  category: NotificationCategory | 'all';
  cModule: CModule | 'all';
  readStatus: 'all' | 'unread' | 'read';
}

export interface NotificationGroup {
  label: string;
  notifications: NotificationDisplayItem[];
}

export interface NotificationCenterState {
  notifications: NotificationDisplayItem[];
  unreadCount: number;
  unreadByModule: Record<string, number>;
  hasMore: boolean;
  isLoading: boolean;
  activeFilter: NotificationFilter;
}

// ============================================================
// NOTIFICATION DISPLAY CONFIG
// ============================================================

export interface NotificationDisplayConfig {
  type: NotificationType;
  cModule: CModule;
  accentColor: string;
  icon: NotificationIconType;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
  batchable: boolean;
  batchThreshold: number;
  batchWindow: number;     // Minutes
  inlineActions: boolean;
  showAvatar: boolean;
  expiresAfterMinutes: number | null;
}

export const NOTIFICATION_DISPLAY_CONFIGS: Partial<Record<NotificationType, NotificationDisplayConfig>> = {
  // CONNECT
  [NotificationType.CONNECTION_REQUEST_RECEIVED]: {
    type: NotificationType.CONNECTION_REQUEST_RECEIVED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'connect_request',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: true,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.CONNECTION_REQUEST_ACCEPTED]: {
    type: NotificationType.CONNECTION_REQUEST_ACCEPTED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'connect_accepted',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.CONNECTION_SUGGESTION]: {
    type: NotificationType.CONNECTION_SUGGESTION,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'connect_request',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.LOW,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 1440,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.PROFILE_VIEWED]: {
    type: NotificationType.PROFILE_VIEWED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'connect_request',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.LOW,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 1440,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.POST_LIKED]: {
    type: NotificationType.POST_LIKED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'like',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.LOW,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 60,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.POST_COMMENTED]: {
    type: NotificationType.POST_COMMENTED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'comment',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 30,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.POST_RESHARED]: {
    type: NotificationType.POST_RESHARED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'reshare',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 60,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.MENTIONED_IN_POST]: {
    type: NotificationType.MENTIONED_IN_POST,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'mention',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.NETWORK_MILESTONE]: {
    type: NotificationType.NETWORK_MILESTONE,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'milestone',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },

  // CONVENE
  [NotificationType.EVENT_INVITATION]: {
    type: NotificationType.EVENT_INVITATION,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_invite',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: true,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.EVENT_REMINDER_24H]: {
    type: NotificationType.EVENT_REMINDER_24H,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_reminder',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 1440,
  },
  [NotificationType.EVENT_REMINDER_1H]: {
    type: NotificationType.EVENT_REMINDER_1H,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_reminder',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.URGENT,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 60,
  },
  [NotificationType.EVENT_STARTING_NOW]: {
    type: NotificationType.EVENT_STARTING_NOW,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_live',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.URGENT,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 120,
  },
  [NotificationType.EVENT_UPDATED]: {
    type: NotificationType.EVENT_UPDATED,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_update',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.EVENT_CANCELLED]: {
    type: NotificationType.EVENT_CANCELLED,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_update',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.EVENT_NEW_ATTENDEE]: {
    type: NotificationType.EVENT_NEW_ATTENDEE,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_invite',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.LOW,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 240,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.EVENT_CONNECTIONS_ATTENDING]: {
    type: NotificationType.EVENT_CONNECTIONS_ATTENDING,
    cModule: CModule.CONVENE,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'event_invite',
    category: NotificationCategory.CONVENE,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },

  // COLLABORATE
  [NotificationType.SPACE_INVITATION]: {
    type: NotificationType.SPACE_INVITATION,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'space_invite',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: true,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.TASK_ASSIGNED]: {
    type: NotificationType.TASK_ASSIGNED,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'task_assign',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.TASK_COMPLETED]: {
    type: NotificationType.TASK_COMPLETED,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'task_complete',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 120,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.TASK_DUE_SOON]: {
    type: NotificationType.TASK_DUE_SOON,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'task_assign',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.URGENT,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.TASK_OVERDUE]: {
    type: NotificationType.TASK_OVERDUE,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'task_assign',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.URGENT,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.SPACE_STALL_ALERT]: {
    type: NotificationType.SPACE_STALL_ALERT,
    cModule: CModule.COLLABORATE,
    accentColor: 'hsl(var(--module-collaborate))',
    icon: 'stall_alert',
    category: NotificationCategory.COLLABORATE,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 20160,
  },

  // CONTRIBUTE
  [NotificationType.OPPORTUNITY_MATCH]: {
    type: NotificationType.OPPORTUNITY_MATCH,
    cModule: CModule.CONTRIBUTE,
    accentColor: 'hsl(var(--module-contribute))',
    icon: 'opportunity_match',
    category: NotificationCategory.CONTRIBUTE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 240,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 10080,
  },
  [NotificationType.OPPORTUNITY_INTEREST_RECEIVED]: {
    type: NotificationType.OPPORTUNITY_INTEREST_RECEIVED,
    cModule: CModule.CONTRIBUTE,
    accentColor: 'hsl(var(--module-contribute))',
    icon: 'opportunity_interest',
    category: NotificationCategory.CONTRIBUTE,
    defaultPriority: NotificationPriority.HIGH,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 240,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.OPPORTUNITY_DEADLINE_APPROACHING]: {
    type: NotificationType.OPPORTUNITY_DEADLINE_APPROACHING,
    cModule: CModule.CONTRIBUTE,
    accentColor: 'hsl(var(--module-contribute))',
    icon: 'opportunity_deadline',
    category: NotificationCategory.CONTRIBUTE,
    defaultPriority: NotificationPriority.URGENT,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: 2880,
  },

  // CONVEY
  [NotificationType.STORY_LIKED]: {
    type: NotificationType.STORY_LIKED,
    cModule: CModule.CONVEY,
    accentColor: 'hsl(var(--module-convey))',
    icon: 'story_engage',
    category: NotificationCategory.CONVEY,
    defaultPriority: NotificationPriority.LOW,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 120,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.STORY_COMMENTED]: {
    type: NotificationType.STORY_COMMENTED,
    cModule: CModule.CONVEY,
    accentColor: 'hsl(var(--module-convey))',
    icon: 'comment',
    category: NotificationCategory.CONVEY,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: true,
    batchThreshold: 5,
    batchWindow: 60,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.STORY_NEW_FOLLOWER]: {
    type: NotificationType.STORY_NEW_FOLLOWER,
    cModule: CModule.CONVEY,
    accentColor: 'hsl(var(--module-convey))',
    icon: 'follower',
    category: NotificationCategory.CONVEY,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: true,
    batchThreshold: 3,
    batchWindow: 1440,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
  [NotificationType.STORY_TRENDING]: {
    type: NotificationType.STORY_TRENDING,
    cModule: CModule.CONVEY,
    accentColor: 'hsl(var(--module-convey))',
    icon: 'trending',
    category: NotificationCategory.CONVEY,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.STORY_ENGAGEMENT_MILESTONE]: {
    type: NotificationType.STORY_ENGAGEMENT_MILESTONE,
    cModule: CModule.CONVEY,
    accentColor: 'hsl(var(--module-convey))',
    icon: 'milestone',
    category: NotificationCategory.CONVEY,
    defaultPriority: NotificationPriority.MEDIUM,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },

  // DIA
  [NotificationType.DIA_WEEKLY_DIGEST]: {
    type: NotificationType.DIA_WEEKLY_DIGEST,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-convene))',
    icon: 'dia_digest',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.DIGEST,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },

  // SYSTEM
  [NotificationType.SYSTEM_SECURITY_ALERT]: {
    type: NotificationType.SYSTEM_SECURITY_ALERT,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--destructive))',
    icon: 'security',
    category: NotificationCategory.SYSTEM,
    defaultPriority: NotificationPriority.CRITICAL,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.SYSTEM_PAYMENT_FAILED]: {
    type: NotificationType.SYSTEM_PAYMENT_FAILED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--destructive))',
    icon: 'payment',
    category: NotificationCategory.SYSTEM,
    defaultPriority: NotificationPriority.CRITICAL,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },
  [NotificationType.SYSTEM_PAYMENT_CONFIRMED]: {
    type: NotificationType.SYSTEM_PAYMENT_CONFIRMED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'payment',
    category: NotificationCategory.SYSTEM,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: false,
    expiresAfterMinutes: null,
  },

  // MESSAGING
  [NotificationType.MESSAGE_RECEIVED]: {
    type: NotificationType.MESSAGE_RECEIVED,
    cModule: CModule.CONNECT,
    accentColor: 'hsl(var(--module-connect))',
    icon: 'message',
    category: NotificationCategory.CONNECT,
    defaultPriority: NotificationPriority.HIGH,
    batchable: false,
    batchThreshold: 0,
    batchWindow: 0,
    inlineActions: false,
    showAvatar: true,
    expiresAfterMinutes: null,
  },
};

// ============================================================
// NOTIFICATION CENTER LAYOUT CONFIG
// ============================================================

export const NOTIFICATION_CENTER_LAYOUT = {
  mobile: {
    type: 'full_screen' as const,
    entry: 'slide_from_right' as const,
    headerHeight: 56,
    filterBarHeight: 44,
  },
  desktop: {
    type: 'dropdown_panel' as const,
    width: 420,
    maxHeight: '80vh',
    headerHeight: 48,
    filterBarHeight: 40,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    avatarSize: 44,
    avatarSizeCompact: 36,
    leftBorderWidth: 3,
    unreadBackground: 'hsl(var(--background))',
    readBackground: 'hsl(var(--card))',
    inlineActionHeight: 36,
    maxBodyLines: 2,
    timestampFontSize: 12,
  },
  groupHeader: {
    fontSize: 13,
    color: 'hsl(var(--muted-foreground))',
    paddingVertical: 8,
    paddingHorizontal: 16,
    labels: ['Just now', 'Today', 'Yesterday', 'This week', 'Earlier'] as const,
  },
  emptyState: {
    headline: 'You\u2019re all caught up',
    body: 'When something happens in your diaspora network, you\u2019ll see it here.',
    icon: 'dna-bell-peaceful',
  },
};

export const NOTIFICATION_FILTERS = [
  { label: 'All', value: 'all' as const, icon: null, color: null },
  { label: 'Connect', value: CModule.CONNECT, icon: 'connect-icon', color: 'hsl(var(--module-connect))' },
  { label: 'Convene', value: CModule.CONVENE, icon: 'convene-icon', color: 'hsl(var(--module-convene))' },
  { label: 'Collaborate', value: CModule.COLLABORATE, icon: 'collaborate-icon', color: 'hsl(var(--module-collaborate))' },
  { label: 'Contribute', value: CModule.CONTRIBUTE, icon: 'contribute-icon', color: 'hsl(var(--module-contribute))' },
  { label: 'Convey', value: CModule.CONVEY, icon: 'convey-icon', color: 'hsl(var(--module-convey))' },
] as const;

// ============================================================
// WEEKLY DIGEST TYPES
// ============================================================

export interface WeeklyDigest {
  userId: string;
  weekStarting: string;
  weekEnding: string;
  stats: DigestStats;
  highlights: {
    connect: DigestHighlight[];
    convene: DigestHighlight[];
    collaborate: DigestHighlight[];
    contribute: DigestHighlight[];
    convey: DigestHighlight[];
  };
  diaInsights: string[];
  actions: DigestAction[];
}

export interface DigestStats {
  newConnections: number;
  profileViews: number;
  eventsAttended: number;
  upcomingEvents: number;
  tasksCompleted: number;
  opportunityMatches: number;
  storyEngagement: number;
  totalInteractions: number;
  networkGrowthPercent: number;
}

export interface DigestHighlight {
  cModule: CModule;
  type: string;
  title: string;
  subtitle: string;
  metric: string;
  actionUrl: string;
}

export interface DigestAction {
  label: string;
  description: string;
  url: string;
  cModule: CModule;
}

// ============================================================
// SERVICE PARAMS
// ============================================================

export interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  actorId?: string;
  targetType: NotificationTargetType;
  targetId: string;
  targetTitle?: string;
  crossCContext?: CrossCNotificationContext;
  customHeadline?: string;
  customBody?: string;
  metadata?: Record<string, unknown>;
}

export interface DiaEvaluationResult {
  adjustedPriority: NotificationPriority;
  relevanceScore: number;
  scheduledFor: string | null;
  suppress: boolean;
  suppressionReason: string | null;
}

// ============================================================
// MONETIZATION TIER FEATURES
// ============================================================

export interface NotificationTierConfig {
  pushNotificationTypes: 'events_messages_only' | 'all' | 'all_plus_team';
  emailDigestDetail: 'basic' | 'detailed_dia' | 'team_kpis';
  notificationHistoryDays: number | null; // null = unlimited
  customQuietHours: boolean;
  perTypeGranularControl: boolean;
  diaIntelligenceLevel: 'basic' | 'full' | 'full_team';
  mutedEntitiesLimit: number | null; // null = unlimited
  batchDetailLevel: 'count_only' | 'count_names' | 'count_names_analytics';
}

export const NOTIFICATION_TIER_CONFIGS: Record<string, NotificationTierConfig> = {
  free: {
    pushNotificationTypes: 'events_messages_only',
    emailDigestDetail: 'basic',
    notificationHistoryDays: 30,
    customQuietHours: false,
    perTypeGranularControl: false,
    diaIntelligenceLevel: 'basic',
    mutedEntitiesLimit: 10,
    batchDetailLevel: 'count_only',
  },
  pro: {
    pushNotificationTypes: 'all',
    emailDigestDetail: 'detailed_dia',
    notificationHistoryDays: null,
    customQuietHours: true,
    perTypeGranularControl: true,
    diaIntelligenceLevel: 'full',
    mutedEntitiesLimit: null,
    batchDetailLevel: 'count_names',
  },
  org: {
    pushNotificationTypes: 'all_plus_team',
    emailDigestDetail: 'team_kpis',
    notificationHistoryDays: null,
    customQuietHours: true,
    perTypeGranularControl: true,
    diaIntelligenceLevel: 'full_team',
    mutedEntitiesLimit: null,
    batchDetailLevel: 'count_names_analytics',
  },
};

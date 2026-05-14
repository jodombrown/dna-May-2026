// ============================================
// DNA FEEDBACK HUB TYPES
// ============================================

// Core types matching database schema
export type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'general' | 'praise';
export type FeedbackStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
export type MessageType = 'text' | 'image' | 'voice' | 'video';
export type FeedbackEmoji = '👍' | '❤️' | '🎉' | '🔥' | '👀' | '💡';
export type MembershipStatus = 'active' | 'opted_out';

// Legacy type aliases for backward compatibility with existing components
export type UserTag = 'bug' | 'suggestion' | 'question' | 'praise' | 'other';
export type ContentType = 'text' | 'image' | 'voice' | 'video' | 'mixed';
export type AdminStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type AdminCategory = 'bug' | 'feature_request' | 'ux_issue' | 'question' | 'duplicate' | 'other';
export type AdminPriority = FeedbackPriority;

export const FEEDBACK_EMOJIS: FeedbackEmoji[] = ['👍', '❤️', '🎉', '🔥', '👀', '💡'];

// Labels for UI display
export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  ux: 'UX Feedback',
  general: 'General',
  praise: 'Praise',
};

export const USER_TAG_LABELS: Record<UserTag, string> = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  question: 'Question',
  praise: 'Praise',
  other: 'Other',
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  acknowledged: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
};

export const ADMIN_STATUS_COLORS: Record<AdminStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  wont_fix: 'bg-neutral-100 text-neutral-800',
};

export const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const ADMIN_PRIORITY_LABELS = PRIORITY_LABELS;

export const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  low: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const ADMIN_PRIORITY_COLORS = PRIORITY_COLORS;

// Database table types
export interface FeedbackChannel {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackMembership {
  id: string;
  channel_id: string;
  user_id: string;
  status: MembershipStatus;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  parent_id: string | null;
  content: string;
  message_type: MessageType;
  category: FeedbackCategory | null;
  status: FeedbackStatus;
  priority: FeedbackPriority | null;
  is_pinned: boolean;
  is_highlighted: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  admin_status?: AdminStatus;
  admin_category?: AdminCategory;
  admin_priority?: AdminPriority;
  user_tag?: UserTag;
}

export interface FeedbackMessageWithSender extends FeedbackMessage {
  sender: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  attachments?: FeedbackAttachment[];
  reactions?: ReactionSummary;
  reply_count?: number;
}

export interface FeedbackAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  // Aliases for backward compatibility
  storage_path?: string;
  attachment_type?: string;
  duration_seconds?: number;
}

export interface FeedbackReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: FeedbackEmoji;
  created_at: string;
}

export interface ReactionCount {
  count: number;
  users: string[];
  reacted_by_me: boolean;
}

export interface ReactionSummary {
  [emoji: string]: ReactionCount;
}

export interface PaginatedMessages {
  messages: FeedbackMessageWithSender[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendMessageParams {
  channelId: string;
  content: string;
  messageType?: MessageType;
  category?: FeedbackCategory;
  parentId?: string;
  // Aliases
  contentType?: ContentType;
  userTag?: UserTag;
  parentMessageId?: string;
}

export interface FeedbackAnalytics {
  total_messages: number;
  by_status: Record<FeedbackStatus, number>;
  by_category: Record<FeedbackCategory, number>;
  by_user_tag?: Record<UserTag, number>;
  resolution_rate: number;
  avg_resolution_time_hours: number;
  trending_issues: FeedbackMessageWithSender[];
  top_contributors: { 
    user_id: string; 
    count: number; 
    profile: { 
      username: string | null; 
      full_name: string | null; 
      avatar_url: string | null;
    };
  }[];
  messages_over_time: { date: string; count: number }[];
}

export type FeedbackFilter = 'all' | 'pinned' | 'my_feedback';
export type StatusFilter = FeedbackStatus | 'all';
export type CategoryFilter = FeedbackCategory | 'all';

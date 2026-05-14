/**
 * DNA Messaging System Types
 *
 * Type definitions for the messaging system implementing the PRD requirements:
 * - Direct messaging between connected users
 * - Message requests for non-connected users
 * - Origin context tracking (where conversations started)
 * - Read receipts and delivery status
 * - User restrictions (block/mute)
 */

// =====================================================
// CONVERSATION TYPES
// =====================================================

/**
 * Conversation type - currently only 'direct' supported
 * Group messaging is planned for future
 */
export type ConversationType = 'direct' | 'group';

/**
 * Where the conversation originated from
 */
export type ConversationOriginType = 'event' | 'project' | 'profile' | 'post' | null;

/**
 * Participant status in a conversation
 * - active: Full access to conversation
 * - pending: Message request awaiting response
 * - declined: Message request was rejected
 */
export type ParticipantStatus = 'active' | 'pending' | 'declined';

/**
 * Core conversation entity
 */
export interface Conversation {
  id: string;
  type: ConversationType;
  origin_type: ConversationOriginType;
  origin_id: string | null;
  origin_metadata: OriginMetadata;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Metadata about conversation origin
 * Structure depends on origin_type
 */
export interface OriginMetadata {
  title?: string;
  date?: string;
  role?: string;
  preview?: string;
  url?: string;
}

/**
 * Conversation participant record
 */
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
  last_read_at: string;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
}

/**
 * Extended conversation list item returned by get_user_conversations RPC
 * Includes other participant details and conversation status
 */
export interface ConversationListItem {
  conversation_id: string;
  conversation_type?: ConversationType;
  origin_type?: ConversationOriginType;
  origin_id?: string | null;
  origin_metadata?: OriginMetadata;
  other_user_id: string;
  other_user_username: string;
  other_user_full_name: string;
  other_user_avatar_url?: string;
  other_user_headline?: string;
  last_message_content?: string | null;
  last_message_preview?: string;
  last_message_sender_id?: string;
  last_message_at?: string | null;
  unread_count: number;
  participant_status?: ParticipantStatus;
  is_muted?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
  bucket?: ConversationBucket;
  has_unread_mention?: boolean;
  /** Group messaging fields (Phase 20) */
  is_group?: boolean;
  group_title?: string;
  group_avatar_url?: string | null;
  participant_count?: number;
}

// =====================================================
// MESSAGE TYPES
// =====================================================

/**
 * Message content type
 */
export type MessageContentType = 'text' | 'image' | 'file' | 'link_preview' | 'system';

/**
 * Core message entity
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  content_type: MessageContentType;
  metadata: MessageMetadata;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  delivered_at: string | null;
  read_at: string | null;
}

/**
 * Message metadata for different content types
 */
export interface MessageMetadata {
  // For images
  image_url?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;

  // For files
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;

  // For link previews
  preview_url?: string;
  preview_title?: string;
  preview_description?: string;
  preview_image?: string;

  // For system messages
  system_type?: 'conversation_created' | 'user_joined' | 'user_left';
}

/**
 * Message with sender details - returned by get_conversation_messages RPC
 */
export interface MessageWithSender {
  message_id: string;
  sender_id: string;
  sender_username: string;
  sender_full_name: string;
  sender_avatar_url?: string;
  content: string | null;
  content_type?: MessageContentType;
  metadata?: MessageMetadata;
  created_at: string;
  is_deleted: boolean;
  delivered_at?: string | null;
  is_read?: boolean;
}

/**
 * Read receipt for a message
 */
export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

// =====================================================
// MESSAGE REQUEST TYPES
// =====================================================

/**
 * Pending message request item
 */
export interface MessageRequest {
  conversation_id: string;
  origin_type: ConversationOriginType;
  origin_metadata: OriginMetadata;
  requester_id: string;
  requester_username: string;
  requester_full_name: string;
  requester_avatar_url?: string;
  requester_headline?: string;
  preview_content: string | null;
  requested_at: string;
}

// =====================================================
// USER RESTRICTION TYPES
// =====================================================

/**
 * Types of user restrictions
 */
export type RestrictionType = 'block' | 'mute';

/**
 * User restriction record
 */
export interface UserRestriction {
  id: string;
  user_id: string;
  target_user_id: string;
  restriction_type: RestrictionType;
  created_at: string;
}

// =====================================================
// PRESENCE TYPES
// =====================================================

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * User presence record
 */
export interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  last_seen_at: string;
}

// =====================================================
// MESSAGING PERMISSION TYPES
// =====================================================

/**
 * Result of checking if user can message another user
 */
export interface CanMessageResult {
  can_message: boolean;
  is_connected: boolean;
  is_blocked: boolean;
  reason: string;
}

// =====================================================
// INBOX TAB TYPES
// =====================================================

/**
 * Inbox tab filter type following LinkedIn pattern
 */
export type InboxTab = 'primary' | 'requests' | 'spam' | 'archived';

/**
 * Inbox filter chip - layered on top of the active tab
 */
export type InboxFilterChip = 'all' | 'unread' | 'mentions';

/**
 * Per-side bucket on a conversation (mirrors conversations.bucket_for_a/b)
 */
export type ConversationBucket = 'primary' | 'requests' | 'spam';

/**
 * Inbox filter configuration
 */
export interface InboxFilter {
  tab: InboxTab;
  status: ParticipantStatus;
  include_muted: boolean;
}

// =====================================================
// TYPING INDICATOR TYPES
// =====================================================

/**
 * User currently typing in a conversation
 */
export interface TypingUser {
  user_id: string;
  display_name: string;
}

// =====================================================
// SEND MESSAGE PARAMS
// =====================================================

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  conversation_id: string;
  content: string;
  content_type?: MessageContentType;
  metadata?: MessageMetadata;
}

/**
 * Parameters for creating a contextual conversation
 */
export interface CreateConversationParams {
  other_user_id: string;
  origin_type?: ConversationOriginType;
  origin_id?: string;
  origin_metadata?: OriginMetadata;
}


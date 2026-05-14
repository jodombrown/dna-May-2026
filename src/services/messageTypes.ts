/**
 * Shared types for the messaging service
 * Extracted from messageService.ts for better modularity
 */

/**
 * Attachment data for messages
 */
export interface MessageAttachmentData {
  type: 'image' | 'file' | 'voice';
  url: string;
  filename?: string;
  filesize?: number;
  mimetype?: string;
  duration?: number; // For voice messages, duration in seconds
}

/**
 * Link preview data for messages
 */
export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

/**
 * Reply-to data stored in message payload.
 * Phase 10 - extended with timestamp + lightweight media/link snapshot
 * so the reply chip and the quoted bubble can render full context.
 */
export interface ReplyToData {
  messageId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt?: string;
  attachment?: {
    type: 'image' | 'file' | 'voice';
    url: string;
    filename?: string;
    mimetype?: string;
    duration?: number;
  };
  linkPreview?: {
    url: string;
    title?: string;
    image?: string;
  };
}

/**
 * Entity reference data for sharing events/spaces/opportunities in chat
 */
export interface EntityReferenceData {
  entityType: 'event' | 'space' | 'opportunity' | 'post' | 'story';
  entityId: string;
  entityTitle: string;
  entityPreview?: string;
  entityImage?: string;
}

/**
 * Message payload structure
 */
export interface MessagePayload {
  attachment?: MessageAttachmentData;
  linkPreview?: LinkPreviewData;
  replyTo?: ReplyToData;
  entityReference?: EntityReferenceData;
}

/**
 * Message type for the simpler conversations/messages tables
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  payload?: MessagePayload;
}

/**
 * MessageWithSender - Type for messages with sender information
 */
export interface MessageWithSender {
  message_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  sender_id: string;
  sender_username: string;
  sender_full_name: string;
  sender_avatar_url: string;
  is_read?: boolean;
  payload?: MessagePayload;
}

/**
 * ConversationListItem - Type for conversation list display
 */
export interface ConversationListItem {
  conversation_id: string;
  other_user_id: string;
  other_user_username: string;
  other_user_full_name: string;
  other_user_avatar_url: string;
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  bucket?: 'primary' | 'requests' | 'spam';
  has_unread_mention?: boolean;
}

/**
 * MessageReaction type
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

/**
 * MessageSearchResult - Type for search results
 */
export interface MessageSearchResult {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  sender_full_name: string;
  sender_avatar_url: string;
  content: string;
  content_type: string;
  created_at: string;
  other_user_id: string;
  other_user_username: string;
  other_user_full_name: string;
  other_user_avatar_url: string;
  rank: number;
}

// Backward-compatible type aliases
export type MessageWithSenderType = MessageWithSender;
export type ConversationListItemType = ConversationListItem;
export type MessageType = Message;
export type MessageSearchResultType = MessageSearchResult;
export type MessageReactionType = MessageReaction;

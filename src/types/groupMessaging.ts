/**
 * Group Messaging Types
 * 
 * Types for the unified messaging system (conversations_new + messages_new)
 * supporting group chat, media, and real-time features.
 */

export type MessageStatus = 'pending' | 'sent' | 'failed';
export type MessageType = 'text' | 'media' | 'system';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

/** Media item stored in media_urls JSONB array */
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size: number;
  mimeType?: string;
  /** Optional dimensions (image/video) */
  width?: number;
  height?: number;
  /** Optional duration in seconds (video/audio) */
  durationSec?: number;
  /** Optional poster URL for video previews */
  posterUrl?: string;
}

/** A message in a group or DM conversation (from get_group_messages RPC) */
export interface GroupMessage {
  message_id: string;
  sender_id: string;
  sender_username: string;
  sender_full_name: string;
  sender_avatar_url: string;
  content: string;
  message_type: MessageType;
  media_urls: MediaItem[];
  reply_to_id: string | null;
  payload: Record<string, unknown> | null;
  client_id: string | null;
  created_at: string;
  is_deleted: boolean;
  edited_at: string | null;
  deleted_at?: string | null;
  forwarded_from_message_id?: string | null;
  /** Client-only: optimistic send status */
  _status?: MessageStatus;
  /** Client-only: client-generated ID for deduplication */
  _clientId?: string;
  /** Client-only: whether the current user has starred this message */
  _isStarred?: boolean;
}

/** A group conversation from get_group_conversations_for_user RPC */
export interface GroupConversation {
  conversation_id: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  conversation_type: string;
  created_by: string | null;
  created_at: string;
  last_message_at: string;
  participant_count: number;
  unread_count: number;
  last_message_preview?: string | null;
  last_sender_name?: string | null;
  is_pinned?: boolean;
  is_muted?: boolean;
  is_archived?: boolean;
}

/** Participant in a conversation */
export interface ConversationParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  joined_at: string;
  last_read_at: string;
  // Joined profile data
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

/** Typing user state (broadcast only, no DB) */
export interface TypingUser {
  profile_id: string;
  display_name: string;
  started_at: number;
}

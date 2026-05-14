/**
 * Group Message Service
 * 
 * Service layer for group messaging using conversations_new + messages_new
 * via RPCs. All RPCs are SECURITY DEFINER with auth.uid() checks.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type {
  GroupMessage,
  GroupConversation,
  ConversationParticipant,
  MediaItem,
} from '@/types/groupMessaging';

export const groupMessageService = {
  /**
   * Create a new group conversation. Caller is added as creator + participant.
   * Returns the new conversation id. Up to 50 members total enforced server-side.
   */
  async createGroupConversation(params: {
    title: string;
    participantIds: string[];
  }): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_title: params.title,
      p_participant_ids: params.participantIds,
      p_created_by: uid,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to create group', error);
      throw error;
    }
    return data as string;
  },

  /**
   * Get all group conversations for the current user.
   * Pass includeArchived=true to also return groups the user has archived.
   */
  async getGroupConversations(includeArchived: boolean = false): Promise<GroupConversation[]> {
    const { data, error } = await supabase.rpc('get_group_conversations_for_user', {
      p_include_archived: includeArchived,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to get group conversations', error);
      throw error;
    }
    return (data as GroupConversation[]) || [];
  },

  /** Pin or unpin a group conversation for the current user */
  async setPin(conversationId: string, pinned: boolean): Promise<void> {
    const { error } = await supabase.rpc('set_group_conversation_pin', {
      p_conversation_id: conversationId,
      p_pinned: pinned,
    });
    if (error) throw error;
  },

  // setMute is defined below using the legacy `set_group_mute` RPC.

  /** Archive or unarchive a group conversation for the current user */
  async setArchive(conversationId: string, archived: boolean): Promise<void> {
    const { error } = await supabase.rpc('set_group_conversation_archive', {
      p_conversation_id: conversationId,
      p_archived: archived,
    });
    if (error) throw error;
  },

  /**
   * Get messages for a conversation with cursor-based pagination
   */
  async getMessages(
    conversationId: string,
    limit = 30,
    beforeId?: string
  ): Promise<GroupMessage[]> {
    const { data, error } = await supabase.rpc('get_group_messages', {
      p_conversation_id: conversationId,
      p_limit: limit,
      p_before_id: beforeId || null,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to get messages', error as unknown);
      throw error;
    }
    // RPC returns DESC order; reverse for chronological display
    const rawMessages = (data as unknown as GroupMessage[]) || [];
    return rawMessages.reverse();
  },

  /**
   * Send a message to a group conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options?: {
      messageType?: string;
      mediaUrls?: MediaItem[];
      replyToId?: string;
      clientId?: string;
      payload?: Record<string, unknown>;
    }
  ): Promise<string> {
    const { data, error } = await supabase.rpc('send_group_message', {
      p_conversation_id: conversationId,
      p_content: content,
      p_message_type: options?.messageType || 'text',
      p_media_urls: JSON.parse(JSON.stringify(options?.mediaUrls || [])),
      p_reply_to_id: options?.replyToId || null,
      p_client_id: options?.clientId || null,
      p_payload: options?.payload ? JSON.parse(JSON.stringify(options.payload)) : null,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to send message', error);
      throw error;
    }
    return data as string;
  },

  /**
   * Send a system message (join/leave events)
   */
  async sendSystemMessage(conversationId: string, content: string): Promise<string> {
    return this.sendMessage(conversationId, content, { messageType: 'system' });
  },

  /**
   * Update read cursor for current user
   */
  async updateReadCursor(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('update_group_read_cursor', {
      p_conversation_id: conversationId,
    });
    if (error) {
      logger.warn('groupMessageService', 'Failed to update read cursor', error);
    }
  },

  /**
   * Get unread count for a conversation
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_group_unread_count', {
      p_conversation_id: conversationId,
    });
    if (error) {
      logger.warn('groupMessageService', 'Failed to get unread count', error);
      return 0;
    }
    return (data as number) || 0;
  },

  /**
   * Update group info (title, description, avatar)
   */
  async updateGroupInfo(
    conversationId: string,
    updates: { title?: string; description?: string; avatarUrl?: string }
  ): Promise<void> {
    const { error } = await supabase.rpc('update_group_info', {
      p_conversation_id: conversationId,
      p_title: updates.title || null,
      p_description: updates.description || null,
      p_avatar_url: updates.avatarUrl || null,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to update group info', error);
      throw error;
    }
  },

  /**
   * Soft delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase.rpc('soft_delete_group_message', {
      p_message_id: messageId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to delete message', error);
      throw error;
    }
  },

  /**
   * Add a participant to a group conversation
   */
  async addParticipant(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('add_group_participant', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to add participant', error);
      throw error;
    }
  },

  /**
   * Remove a participant from a group conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_group_participant', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to remove participant', error);
      throw error;
    }
  },

  /**
   * Get participants of a conversation with profile data
   */
  async getParticipants(conversationId: string): Promise<ConversationParticipant[]> {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('id, user_id, conversation_id, joined_at, last_read_at')
      .eq('conversation_id', conversationId);

    if (error) {
      logger.error('groupMessageService', 'Failed to get participants', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // Get profile data for all participants
    const userIds = data.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(p => ({
      ...p,
      username: profileMap.get(p.user_id)?.username || '',
      full_name: profileMap.get(p.user_id)?.full_name || 'Unknown',
      avatar_url: profileMap.get(p.user_id)?.avatar_url || '',
    }));
  },

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string): Promise<GroupConversation | null> {
    const { data, error } = await supabase
      .from('conversations_new')
      .select('id, title, conversation_type, created_by, created_at, last_message_at, metadata')
      .eq('id', conversationId)
      .maybeSingle();

    if (error || !data) return null;

    const metadata = data.metadata as Record<string, unknown> | null;
    return {
      conversation_id: data.id,
      title: data.title,
      description: (metadata?.description as string) || null,
      avatar_url: (metadata?.avatar_url as string) || null,
      conversation_type: data.conversation_type,
      created_by: data.created_by,
      created_at: data.created_at,
      last_message_at: data.last_message_at,
      participant_count: 0,
      unread_count: 0,
    };
  },

  /**
   * Create a new group conversation
   */
  async createGroup(title: string, participantIds: string[]): Promise<string> {
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_title: title,
      p_participant_ids: participantIds,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to create group', error);
      throw error;
    }
    return data as string;
  },

  // ============================================================
  // Phase 5 - Group message actions parity
  // ============================================================

  async editMessage(messageId: string, newContent: string): Promise<void> {
    const { error } = await supabase.rpc('edit_group_message', {
      p_message_id: messageId,
      p_new_content: newContent,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to edit message', error);
      throw error;
    }
  },

  async unsendMessage(messageId: string): Promise<void> {
    const { error } = await supabase.rpc('unsend_group_message', {
      p_message_id: messageId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to unsend message', error);
      throw error;
    }
  },

  async forwardMessage(
    sourceMessageId: string,
    targetConversationIds: string[],
    note?: string,
  ): Promise<void> {
    for (const cid of targetConversationIds) {
      const { error } = await supabase.rpc('forward_group_message', {
        p_source_message_id: sourceMessageId,
        p_target_conversation_id: cid,
        p_note: note ?? null,
      });
      if (error) {
        logger.error('groupMessageService', 'Failed to forward message', error);
        throw error;
      }
    }
  },

  async starMessage(messageId: string, conversationId: string): Promise<void> {
    const userRes = await supabase.auth.getUser();
    const uid = userRes.data.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const { error } = await supabase.from('group_starred_messages').insert({
      user_id: uid,
      message_id: messageId,
      conversation_id: conversationId,
    });
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      logger.error('groupMessageService', 'Failed to star message', error);
      throw error;
    }
  },

  async unstarMessage(messageId: string): Promise<void> {
    const userRes = await supabase.auth.getUser();
    const uid = userRes.data.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('group_starred_messages')
      .delete()
      .eq('user_id', uid)
      .eq('message_id', messageId);
    if (error) {
      logger.error('groupMessageService', 'Failed to unstar message', error);
      throw error;
    }
  },

  async getStarredMessageIds(conversationId: string): Promise<Set<string>> {
    const userRes = await supabase.auth.getUser();
    const uid = userRes.data.user?.id;
    if (!uid) return new Set();
    const { data, error } = await supabase
      .from('group_starred_messages')
      .select('message_id')
      .eq('user_id', uid)
      .eq('conversation_id', conversationId);
    if (error) {
      logger.warn('groupMessageService', 'Failed to load starred messages', error);
      return new Set();
    }
    return new Set((data || []).map((r) => r.message_id as string));
  },

  async recordMentions(messageId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const { error } = await supabase.rpc('record_group_mentions', {
      p_message_id: messageId,
      p_user_ids: userIds,
    });
    if (error) {
      logger.warn('groupMessageService', 'Failed to record mentions', error);
    }
  },

  async setMute(conversationId: string, muted: boolean): Promise<void> {
    const { error } = await supabase.rpc('set_group_mute', {
      p_conversation_id: conversationId,
      p_muted: muted,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to update mute', error);
      throw error;
    }
  },

  async getMyMembership(conversationId: string): Promise<{
    role: 'owner' | 'admin' | 'member';
    is_muted: boolean;
  } | null> {
    const userRes = await supabase.auth.getUser();
    const uid = userRes.data.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('role, is_muted')
      .eq('conversation_id', conversationId)
      .eq('user_id', uid)
      .maybeSingle();
    if (error || !data) return null;
    return {
      role: ((data as { role?: string }).role as 'owner' | 'admin' | 'member') || 'member',
      is_muted: Boolean((data as { is_muted?: boolean }).is_muted),
    };
  },

  async getParticipantRoles(
    conversationId: string,
  ): Promise<Map<string, 'owner' | 'admin' | 'member'>> {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('user_id, role')
      .eq('conversation_id', conversationId);
    if (error || !data) return new Map();
    return new Map(
      data.map((d) => [
        (d as { user_id: string }).user_id,
        (((d as { role?: string }).role as 'owner' | 'admin' | 'member') || 'member'),
      ]),
    );
  },

  async transferOwnership(conversationId: string, newOwnerId: string): Promise<void> {
    const { error } = await supabase.rpc('transfer_group_ownership', {
      p_conversation_id: conversationId,
      p_new_owner_id: newOwnerId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to transfer ownership', error);
      throw error;
    }
  },

  async setParticipantRole(
    conversationId: string,
    userId: string,
    role: 'admin' | 'member',
  ): Promise<void> {
    const { error } = await supabase.rpc('set_group_participant_role', {
      p_conversation_id: conversationId,
      p_user_id: userId,
      p_role: role,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to set participant role', error);
      throw error;
    }
  },

  async leaveGroup(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('leave_group_conversation', {
      p_conversation_id: conversationId,
    });
    if (error) {
      logger.error('groupMessageService', 'Failed to leave group', error);
      throw error;
    }
  },
};

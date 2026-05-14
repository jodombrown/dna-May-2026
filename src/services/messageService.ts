import { supabase } from '@/integrations/supabase/client';
import { sendNotificationEmail, NOTIFICATION_TYPES } from './notificationService';
import { getConversationUrl } from '@/lib/config';
import { logger } from '@/lib/logger';
import type { Database, Json } from '@/integrations/supabase/types';

// Re-export types from messageTypes.ts for backward compatibility
export type {
  MessageAttachmentData,
  LinkPreviewData,
  MessagePayload,
  ReplyToData,
  EntityReferenceData,
  Message,
  MessageWithSender,
  ConversationListItem,
  MessageReaction,
  MessageSearchResult,
} from './messageTypes';

// Re-export conversation actions from messageConversationActions.ts
export {
  deleteConversation,
  archiveConversation,
  pinConversation,
  muteConversation,
} from './messageConversationActions';

// Import types needed internally
import type {
  MessageAttachmentData,
  LinkPreviewData,
  MessagePayload,
  ReplyToData,
  EntityReferenceData,
  Message,
  MessageWithSender,
  ConversationListItem,
  MessageReaction,
  MessageSearchResult,
} from './messageTypes';

/**
 * Type for messages table insert, extending with the payload field
 */
type MessageInsert = Database['public']['Tables']['messages']['Insert'];



/**
 * messageService - SIMPLIFIED messaging using conversations/messages tables
 * 
 * Uses the SIMPLER tables with user_a/user_b structure which have working RLS
 */
export const messageService = {
  /**
   * Get or create a conversation between the current user and another user
   * Uses direct Supabase client calls - NO RPCs
   */
  async getOrCreateConversation(
    otherUserId: string,
    _originType?: string,
    _originId?: string,
    _originMetadata?: Record<string, unknown>
  ): Promise<{ id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First, check if conversation already exists (current user could be user_a OR user_b)
    const { data: existingConversation, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existingConversation) {
      return { id: existingConversation.id };
    }

    // Create new conversation - current user is user_a, other user is user_b
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_a: user.id,
        user_b: otherUserId,
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    return { id: newConversation.id };
  },

  /**
   * Get conversation details by ID
   */
async getConversationDetails(conversationId: string): Promise<ConversationListItem | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get conversation with both users and all state fields
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, last_message_at, is_archived_by_a, is_archived_by_b, is_muted_by_a, is_muted_by_b, is_pinned_by_a, is_pinned_by_b, deleted_by_a, deleted_by_b')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      return null;
    }

    // Determine other user and current user's state
    const isUserA = conversation.user_a === user.id;
    const otherUserId = isUserA ? conversation.user_b : conversation.user_a;

    // Get other user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', otherUserId)
      .single();

    // Get last message
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get unread count using conversation_participants.last_read_at
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('last_read_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    let unreadCount = 0;
    if (participant) {
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      
      if (participant.last_read_at) {
        query = query.gt('created_at', participant.last_read_at);
      }
      
      const { count } = await query;
      unreadCount = count || 0;
    }

    return {
      conversation_id: conversation.id,
      other_user_id: otherUserId,
      other_user_username: profile?.username || '',
      other_user_full_name: profile?.full_name || 'Unknown User',
      other_user_avatar_url: profile?.avatar_url || '',
      last_message_content: lastMessage?.content || null,
      last_message_at: conversation.last_message_at,
      unread_count: unreadCount || 0,
      is_muted: isUserA ? (conversation.is_muted_by_a ?? false) : (conversation.is_muted_by_b ?? false),
      is_pinned: isUserA ? (conversation.is_pinned_by_a ?? false) : (conversation.is_pinned_by_b ?? false),
      is_archived: isUserA ? (conversation.is_archived_by_a ?? false) : (conversation.is_archived_by_b ?? false),
    };
  },

  /**
   * Unified inbox via SECURITY DEFINER RPC `get_inbox_for_user`.
   * Returns both 1:1 and group conversations in one query, with last message
   * preview, unread count, and per-user pin/mute/archive flags.
   */
  async getInbox(
    limit: number = 100,
    offset: number = 0,
    includeArchived: boolean = false,
  ): Promise<ConversationListItem[]> {
    const { data, error } = await supabase.rpc('get_inbox_for_user', {
      p_limit: limit,
      p_offset: offset,
      p_include_archived: includeArchived,
    });
    if (error) throw error;
    type InboxRow = {
      conversation_id: string;
      is_group: boolean;
      other_user_id: string | null;
      other_user_username: string | null;
      other_user_full_name: string | null;
      other_user_avatar_url: string | null;
      group_title: string | null;
      group_avatar_url: string | null;
      participant_count: number | null;
      last_message_preview: string | null;
      last_message_at: string | null;
      last_sender_name: string | null;
      unread_count: number | null;
      is_pinned: boolean | null;
      is_muted: boolean | null;
      is_archived: boolean | null;
      bucket: string | null;
    };
    const rows = (data as InboxRow[] | null) ?? [];
    return rows.map<ConversationListItem>((r) => {
      const bucket =
        r.bucket === 'requests' || r.bucket === 'spam' || r.bucket === 'primary'
          ? r.bucket
          : 'primary';
      return {
        conversation_id: r.conversation_id,
        conversation_type: r.is_group ? 'group' : 'direct',
        other_user_id: r.other_user_id ?? '',
        other_user_username: r.other_user_username ?? '',
        other_user_full_name: r.is_group
          ? r.group_title ?? 'Group'
          : r.other_user_full_name ?? 'Unknown User',
        other_user_avatar_url: r.is_group
          ? r.group_avatar_url ?? ''
          : r.other_user_avatar_url ?? '',
        last_message_content: r.last_message_preview,
        last_message_preview: r.last_message_preview ?? undefined,
        last_message_at: r.last_message_at,
        unread_count: r.unread_count ?? 0,
        is_muted: !!r.is_muted,
        is_pinned: !!r.is_pinned,
        is_archived: !!r.is_archived,
        bucket,
        is_group: r.is_group,
        group_title: r.is_group ? r.group_title ?? 'Group' : undefined,
        group_avatar_url: r.is_group ? r.group_avatar_url ?? undefined : undefined,
        participant_count: r.is_group ? Number(r.participant_count) || 0 : undefined,
      } as ConversationListItem;
    });
  },


async getConversations(
    limit: number = 50,
    _offset: number = 0,
    includeArchived: boolean = false
  ): Promise<ConversationListItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all conversations where user is participant with all state fields
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, last_message_at, is_archived_by_a, is_archived_by_b, is_muted_by_a, is_muted_by_b, is_pinned_by_a, is_pinned_by_b, deleted_by_a, deleted_by_b, bucket_for_a, bucket_for_b')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    // Filter out deleted conversations and optionally archived ones
    const filteredConversations = conversations.filter(conv => {
      const isUserA = conv.user_a === user.id;
      const isDeleted = isUserA ? conv.deleted_by_a : conv.deleted_by_b;
      const isArchived = isUserA ? conv.is_archived_by_a : conv.is_archived_by_b;
      
      if (isDeleted) return false;
      if (!includeArchived && isArchived) return false;
      return true;
    });

    // Get other user IDs
    const otherUserIds = filteredConversations.map(c => 
      c.user_a === user.id ? c.user_b : c.user_a
    );

    // Get all profiles in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', otherUserIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Build conversation list
    const result: ConversationListItem[] = [];
    for (const conv of filteredConversations) {
      const isUserA = conv.user_a === user.id;
      const otherUserId = isUserA ? conv.user_b : conv.user_a;
      const profile = profileMap.get(otherUserId);

      // Get last message for this conversation
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count using conversation_participants.last_read_at
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', conv.id)
        .eq('user_id', user.id)
        .maybeSingle();

      let unreadCount = 0;
      if (participant) {
        let query = supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id);
        
        if (participant.last_read_at) {
          query = query.gt('created_at', participant.last_read_at);
        }
        
        const { count } = await query;
        unreadCount = count || 0;
      }

      const rawBucket = isUserA ? (conv as { bucket_for_a?: string }).bucket_for_a : (conv as { bucket_for_b?: string }).bucket_for_b;
      const bucket = (rawBucket === 'requests' || rawBucket === 'spam' || rawBucket === 'primary') ? rawBucket : 'primary';
      result.push({
        conversation_id: conv.id,
        other_user_id: otherUserId,
        other_user_username: profile?.username || '',
        other_user_full_name: profile?.full_name || 'Unknown User',
        other_user_avatar_url: profile?.avatar_url || '',
        last_message_content: lastMessage?.content || null,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount || 0,
        is_muted: isUserA ? (conv.is_muted_by_a ?? false) : (conv.is_muted_by_b ?? false),
        is_pinned: isUserA ? (conv.is_pinned_by_a ?? false) : (conv.is_pinned_by_b ?? false),
        is_archived: isUserA ? (conv.is_archived_by_a ?? false) : (conv.is_archived_by_b ?? false),
        bucket,
      });
    }

    // Sort: pinned first, then by last_message_at
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

    return result;
  },

  /**
   * Get messages for a specific conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 100,
    _beforeTimestamp?: string
  ): Promise<MessageWithSender[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get messages - query only columns that definitely exist
    // Note: deleted_at may not exist if migration hasn't been applied yet
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, read, created_at, payload, edited_at, deleted_at, forwarded_from_message_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(m => m.sender_id))];

    // Get sender profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', senderIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Cast payload to proper type - it's stored as JSONB
    return messages.map(m => ({
      message_id: m.id,
      content: m.content,
      created_at: m.created_at,
      is_deleted: !!(m as { deleted_at?: string | null }).deleted_at,
      edited_at: (m as { edited_at?: string | null }).edited_at ?? null,
      forwarded_from_message_id: (m as { forwarded_from_message_id?: string | null }).forwarded_from_message_id ?? null,
      sender_id: m.sender_id,
      sender_username: profileMap.get(m.sender_id)?.username || '',
      sender_full_name: profileMap.get(m.sender_id)?.full_name || 'Unknown',
      sender_avatar_url: profileMap.get(m.sender_id)?.avatar_url || '',
      is_read: m.read,
      payload: (m.payload as MessagePayload) || undefined,
    }));
  },

  /**
   * Send a message in a conversation with optional attachment, reply, or entity reference
   */
  async sendMessage(
    conversationId: string,
    content: string,
    attachment?: MessageAttachmentData,
    linkPreview?: LinkPreviewData,
    replyTo?: ReplyToData,
    entityReference?: EntityReferenceData,
    clientId?: string,
  ): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!content && !attachment && !linkPreview && !entityReference) {
      throw new Error('Message must have content, attachment, link preview, or entity reference');
    }

    // Build payload if there's an attachment, link preview, reply, or entity reference
    const hasPayload = attachment || linkPreview || replyTo || entityReference;
    const payload: MessagePayload | null = hasPayload ? {
      attachment,
      linkPreview,
      replyTo,
      entityReference,
    } : null;

    // Insert message with properly typed payload
    const insertData: MessageInsert & { client_id?: string } = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content?.trim() || '',
      read: false,
      payload: payload as Json | null,
      ...(clientId ? { client_id: clientId } : {}),
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Send notifications to recipient (async, don't block)
    try {
      // Get conversation to find recipient
      const { data: conversation } = await supabase
        .from('conversations')
        .select('user_a, user_b')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const recipientId = conversation.user_a === user.id ? conversation.user_b : conversation.user_a;
        
        // Get sender profile
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        const senderName = senderProfile?.full_name || 'Someone';
        const messagePreview = content?.trim() 
          ? `${senderName}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`
          : `${senderName} sent you a message.`;
        const actionUrl = getConversationUrl(conversationId);

        // 1. Create in-app notification
        supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: messagePreview,
            link_url: actionUrl,
            is_read: false,
            payload: {
              sender_id: user.id,
              sender_name: senderName,
              sender_avatar: senderProfile?.avatar_url,
              conversation_id: conversationId,
            },
          })
          .then(() => {});

        // 2. Send email notification
        sendNotificationEmail({
          user_id: recipientId,
          notification_type: NOTIFICATION_TYPES.MESSAGE,
          title: 'New Message',
          message: messagePreview,
          action_url: actionUrl,
          actor_name: senderName,
          actor_avatar_url: senderProfile?.avatar_url,
        }).catch((err) => { logger.warn('MessageService', 'Failed to send message notification email', err); });

        // 3. Send push notification
        supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: recipientId,
            title: `Message from ${senderName}`,
            message: messagePreview,
            type: 'message',
            action_url: actionUrl,
            actor_avatar_url: senderProfile?.avatar_url,
          }
        }).catch((err) => { logger.warn('MessageService', 'Failed to send push notification', err); });
      }
    } catch (err) {
      logger.warn('MessageService', 'Failed to send message notifications', err);
    }

    return data as Message;
  },

  /**
   * Mark a conversation as read by updating last_read_at in conversation_participants
   * Note: Only updates existing records - doesn't insert for legacy conversations
   */
  async markAsRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Prefer the RPC: bumps last_read_at AND fills read_at on per-recipient receipts
    const { error: rpcError } = await supabase.rpc('mark_conversation_read', {
      _conversation_id: conversationId,
    });

    if (rpcError) {
      // Fallback for legacy conversations
      const { error: updateError } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (updateError) {
        logger.debug('messageService', 'markAsRead skipped for legacy conversation', conversationId);
      }
    }
  },

  /**
   * Get total count of unread messages across all conversations
   */
  async getTotalUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get all user's conversation participations with last_read_at
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) return 0;

    let totalUnread = 0;
    
    for (const p of participations) {
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', p.conversation_id)
        .neq('sender_id', user.id);
      
      if (p.last_read_at) {
        query = query.gt('created_at', p.last_read_at);
      }
      
      const { count } = await query;
      totalUnread += count || 0;
    }

    return totalUnread;
  },

  /**
   * Delete a message (hard delete — removes the row)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (error) throw error;
  },

  /**
   * Edit a message's text content. Allowed within 15 minutes by sender only.
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    const trimmed = (newContent || '').trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    const { error } = await supabase.rpc('edit_message', {
      p_message_id: messageId,
      p_new_content: trimmed,
    });
    if (error) throw error;
  },

  /**
   * Unsend (soft delete) a message. Sender only.
   */
  async unsendMessage(messageId: string): Promise<void> {
    const { error } = await supabase.rpc('unsend_message', {
      p_message_id: messageId,
    });
    if (error) throw error;
  },

  /**
   * Forward a message into another conversation. Re-sends the content
   * and attachment with a forwarded_from_message_id reference.
   */
  async forwardMessage(
    sourceMessageId: string,
    targetConversationId: string,
    optionalNote?: string,
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: source, error: srcErr } = await supabase
      .from('messages')
      .select('content, payload')
      .eq('id', sourceMessageId)
      .single();
    if (srcErr) throw srcErr;

    const sourcePayload = (source?.payload ?? {}) as MessagePayload | null;
    const payload: MessagePayload & Record<string, unknown> = {
      ...(sourcePayload || {}),
      attachment: sourcePayload?.attachment,
      linkPreview: sourcePayload?.linkPreview,
      entityReference: sourcePayload?.entityReference,
      replyTo: undefined,
    };

    const insertData: MessageInsert & { forwarded_from_message_id?: string } = {
      conversation_id: targetConversationId,
      sender_id: user.id,
      content: source?.content || '',
      read: false,
      payload: payload as Json,
      forwarded_from_message_id: sourceMessageId,
    };

    const { error: insertErr } = await supabase.from('messages').insert(insertData);
    if (insertErr) throw insertErr;

    if (optionalNote && optionalNote.trim()) {
      await this.sendMessage(targetConversationId, optionalNote.trim());
    } else {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', targetConversationId);
    }
  },

  /**
   * Toggle a star on a message for the current user.
   */
  async toggleStar(messageId: string, conversationId: string): Promise<{ starred: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('starred_messages')
      .select('id')
      .eq('user_id', user.id)
      .eq('message_id', messageId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('starred_messages')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return { starred: false };
    }

    const { error } = await supabase.from('starred_messages').insert({
      user_id: user.id,
      message_id: messageId,
      conversation_id: conversationId,
    });
    if (error) throw error;
    return { starred: true };
  },

  /**
   * Get starred message ids for the current user (optionally scoped to a conversation).
   */
  async getStarredMessageIds(conversationId?: string): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let q = supabase
      .from('starred_messages')
      .select('message_id')
      .eq('user_id', user.id);
    if (conversationId) q = q.eq('conversation_id', conversationId);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => r.message_id as string);
  },

  /**
   * Check if current user can message another user
   */
  async canMessage(otherUserId: string): Promise<{
    can_message: boolean;
    reason?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { can_message: false, reason: 'Not authenticated' };
    }

    if (user.id === otherUserId) {
      return { can_message: false, reason: 'Cannot message yourself' };
    }

    // Check if blocked
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
      .maybeSingle();

    if (blocked) {
      return { can_message: false, reason: 'User is blocked' };
    }

    return { can_message: true };
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: MessageWithSender) => void
  ) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          onNewMessage({
            message_id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            is_deleted: false,
            sender_id: newMessage.sender_id,
            sender_username: '',
            sender_full_name: '',
            sender_avatar_url: '',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Search messages in conversations
   */
  async searchMessages(
    query: string,
    conversationId?: string,
    limit: number = 50
  ): Promise<MessageSearchResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!query.trim()) return [];

    // Build the query
    let queryBuilder = supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (conversationId) {
      queryBuilder = queryBuilder.eq('conversation_id', conversationId);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Get sender profiles
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', senderIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get conversation details for each message
    const convIds = [...new Set(data.map(m => m.conversation_id))];
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, user_a, user_b')
      .in('id', convIds);

    const convMap = new Map(conversations?.map(c => [c.id, c]) || []);

    // Get other user profiles
    const otherUserIds = new Set<string>();
    conversations?.forEach(c => {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      otherUserIds.add(otherId);
    });

    const { data: otherProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', Array.from(otherUserIds));

    const otherProfileMap = new Map(otherProfiles?.map(p => [p.id, p]) || []);

    return data.map((m, index) => {
      const sender = profileMap.get(m.sender_id);
      const conv = convMap.get(m.conversation_id);
      const otherId = conv ? (conv.user_a === user.id ? conv.user_b : conv.user_a) : '';
      const otherUser = otherProfileMap.get(otherId);

      return {
        message_id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        sender_username: sender?.username || '',
        sender_full_name: sender?.full_name || 'Unknown',
        sender_avatar_url: sender?.avatar_url || '',
        content: m.content,
        content_type: 'text',
        created_at: m.created_at,
        other_user_id: otherId,
        other_user_username: otherUser?.username || '',
        other_user_full_name: otherUser?.full_name || 'Unknown',
        other_user_avatar_url: otherUser?.avatar_url || '',
        rank: limit - index,
      };
    });
  },

  /**
   * Report a message
   */
  async reportMessage(
    messageId: string,
    reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other',
    description?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Map UI reason values to database flag_type enum
    const flagTypeMap: Record<string, string> = {
      'spam': 'spam',
      'harassment': 'harassment',
      'inappropriate': 'inappropriate_content',
      'scam': 'spam', // Scam maps to spam
      'other': 'other',
    };

    const flagType = flagTypeMap[reason] || 'other';

    const { data, error } = await supabase
      .from('content_flags')
      .insert({
        content_type: 'message',
        content_id: messageId,
        flagged_by: user.id,
        flag_type: flagType,
        reason: description || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to report message');
    }

    return data.id;
  },

  // =====================================================
  // TIER 3: Reactions, Archive/Mute, Voice Messages
  // =====================================================

  /**
   * Get reactions for a message
   */
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use 'reaction' column (actual DB column name)
    const { data, error } = await supabase
      .from('message_reactions')
      .select('id, reaction, user_id, created_at')
      .eq('message_id', messageId);

    if (error) {
      return [];
    }

    // Group by emoji and count
    const emojiMap = new Map<string, { count: number; hasReacted: boolean; users: string[] }>();
    
    (data || []).forEach((r) => {
      const emoji = r.reaction;
      const existing = emojiMap.get(emoji) || { count: 0, hasReacted: false, users: [] };
      existing.count++;
      if (r.user_id === user.id) existing.hasReacted = true;
      existing.users.push(r.user_id);
      emojiMap.set(emoji, existing);
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  },

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        reaction: emoji,
      });

    if (error && !error.message?.includes('duplicate')) {
      throw error;
    }
  },

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction', emoji);

    if (error) {
      throw error;
    }
  },

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get conversation to determine if user is user_a or user_b
    const { data: conv } = await supabase
      .from('conversations')
      .select('user_a, user_b')
      .eq('id', conversationId)
      .single();

    if (!conv) throw new Error('Conversation not found');

    const isUserA = conv.user_a === user.id;
    const updateField = isUserA ? 'is_archived_by_a' : 'is_archived_by_b';

    const { error } = await supabase
      .from('conversations')
      .update({ [updateField]: true })
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Set the current user's bucket on a conversation (primary | requests | spam).
   * Powers Accept / Ignore in the Requests tab.
   */
  async setConversationBucket(
    conversationId: string,
    bucket: 'primary' | 'requests' | 'spam'
  ): Promise<void> {
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ error: unknown }>)('set_conversation_bucket', {
      _conversation_id: conversationId,
      _bucket: bucket,
    });
    if (error) throw error;
  },

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: conv } = await supabase
      .from('conversations')
      .select('user_a, user_b')
      .eq('id', conversationId)
      .single();

    if (!conv) throw new Error('Conversation not found');

    const isUserA = conv.user_a === user.id;
    const updateField = isUserA ? 'is_archived_by_a' : 'is_archived_by_b';

    const { error } = await supabase
      .from('conversations')
      .update({ [updateField]: false })
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Mute a conversation
   */
  async muteConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: conv } = await supabase
      .from('conversations')
      .select('user_a, user_b')
      .eq('id', conversationId)
      .single();

    if (!conv) throw new Error('Conversation not found');

    const isUserA = conv.user_a === user.id;
    const updateField = isUserA ? 'is_muted_by_a' : 'is_muted_by_b';

    const { error } = await supabase
      .from('conversations')
      .update({ [updateField]: true })
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Unmute a conversation
   */
  async unmuteConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: conv } = await supabase
      .from('conversations')
      .select('user_a, user_b')
      .eq('id', conversationId)
      .single();

    if (!conv) throw new Error('Conversation not found');

    const isUserA = conv.user_a === user.id;
    const updateField = isUserA ? 'is_muted_by_a' : 'is_muted_by_b';

    const { error } = await supabase
      .from('conversations')
      .update({ [updateField]: false })
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Get conversation status (archived/muted)
   */
  async getConversationStatus(conversationId: string): Promise<{ isArchived: boolean; isMuted: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isArchived: false, isMuted: false };

    const { data: conv } = await supabase
      .from('conversations')
      .select('user_a, user_b, is_archived_by_a, is_archived_by_b, is_muted_by_a, is_muted_by_b')
      .eq('id', conversationId)
      .single();

    if (!conv) return { isArchived: false, isMuted: false };

    const isUserA = conv.user_a === user.id;
    
    return {
      isArchived: isUserA ? (conv.is_archived_by_a || false) : (conv.is_archived_by_b || false),
      isMuted: isUserA ? (conv.is_muted_by_a || false) : (conv.is_muted_by_b || false),
    };
  },

  /**
   * Send a voice message
   */
  async sendVoiceMessage(
    conversationId: string,
    audioBlob: Blob,
    duration: number
  ): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upload audio to storage
    const fileName = `voice-${user.id}-${Date.now()}.webm`;
    const filePath = `voice-messages/${conversationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Failed to upload voice message: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('messages')
      .getPublicUrl(filePath);

    // Send message with voice attachment
    return await this.sendMessage(conversationId, '🎤 Voice message', {
      type: 'voice',
      url: urlData.publicUrl,
      filename: fileName,
      mimetype: 'audio/webm',
      filesize: audioBlob.size,
      duration: duration,
    });
  },

  /**
   * Send an entity reference (event, space, opportunity, etc.) to a conversation
   */
  async sendEntityReference(
    conversationId: string,
    entityReference: EntityReferenceData,
    optionalNote?: string
  ): Promise<void> {
    if (optionalNote?.trim()) {
      await this.sendMessage(conversationId, optionalNote.trim());
    }
    await this.sendMessage(
      conversationId,
      '',
      undefined,
      undefined,
      undefined,
      entityReference
    );
  },
};

// Types and conversation actions are now in separate files:
// - messageTypes.ts: All type definitions
// - messageConversationActions.ts: delete, archive, pin, mute functions
// Re-exported above for backward compatibility

// Also re-export backward-compatible type aliases
export type {
  MessageWithSenderType,
  ConversationListItemType,
  MessageType,
  MessageSearchResultType,
  MessageReactionType,
} from './messageTypes';

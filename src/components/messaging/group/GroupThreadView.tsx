/**
 * GroupThreadView - Full group messaging thread
 * 
 * Uses useRealtimeMessaging for optimistic updates, connection state,
 * typing indicators, and cursor-based pagination.
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Users, ChevronUp, Image as ImageIcon, Search, MoreHorizontal, AtSign } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { useMediaDownloadPermission } from '@/hooks/useMediaDownloadPermission';
import { groupMessageService } from '@/services/groupMessageService';
import { mediaUploadService } from '@/services/mediaUploadService';
import { GroupMessageBubble } from './GroupMessageBubble';
import { GroupSystemMessage } from './GroupSystemMessage';
import { GroupChatInput, type ReplyContext } from './GroupChatInput';
import { RealtimeStatusBanner } from './RealtimeStatusBanner';
import { TypingIndicatorDisplay } from './TypingIndicatorDisplay';
import { GroupInfoDrawer } from './GroupInfoDrawer';
import { MediaGalleryDrawer } from './MediaGalleryDrawer';
import { ForwardGroupMessageDialog } from './ForwardGroupMessageDialog';
import { DateSeparator } from '../inbox/DateSeparator';
import type { GroupMessage, MediaItem } from '@/types/groupMessaging';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SmartReplyChips } from '@/components/messaging/dia/SmartReplyChips';
import { MessageSummaryDrawer } from '@/components/messaging/dia/MessageSummaryDrawer';
import { DiaMessagingSettingsDrawer } from '@/components/messaging/dia/DiaMessagingSettingsDrawer';
import { GroupMentionsDrawer } from '@/components/messaging/dia/GroupMentionsDrawer';
import { useDiaSmartReplies } from '@/hooks/messaging/useDiaSmartReplies';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';

export function GroupThreadView() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [forwardTarget, setForwardTarget] = useState<{ id: string; preview: string } | null>(null);
  const { canDownload } = useMediaDownloadPermission(groupId);

  // Phase 14 - DIA in groups
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [diaSettingsOpen, setDiaSettingsOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const [seedText, setSeedText] = useState<string | undefined>(undefined);
  const [seedNonce, setSeedNonce] = useState(0);
  const { prefs: diaPrefs } = useDiaMessagingPrefs();

  // Starred message IDs for this conversation
  const { data: starredIds = new Set<string>() } = useQuery({
    queryKey: ['group-starred', groupId],
    queryFn: () => groupMessageService.getStarredMessageIds(groupId!),
    enabled: !!groupId,
  });

  // Fetch conversation details
  const { data: conversation } = useQuery({
    queryKey: ['group-conversation', groupId],
    queryFn: () => groupMessageService.getConversation(groupId!),
    enabled: !!groupId,
  });

  // Fetch participants
  const { data: participants = [] } = useQuery({
    queryKey: ['group-participants', groupId],
    queryFn: () => groupMessageService.getParticipants(groupId!),
    enabled: !!groupId,
  });

  // Real-time messaging hook
  const {
    messages,
    isLoading,
    isError,
    sendMessage,
    connectionStatus,
    retryConnection,
    typingUsers,
    broadcastTyping,
    loadMore,
    hasMore,
  } = useRealtimeMessaging({
    conversationId: groupId || '',
    type: 'group',
    enabled: !!groupId,
  });

  // Update read cursor on mount and on new messages
  useEffect(() => {
    if (groupId) {
      groupMessageService.updateReadCursor(groupId);
    }
  }, [groupId, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: GroupMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  // Phase 14 - last inbound message (any non-self sender, ignoring system messages)
  const lastInboundMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.message_type === 'system') continue;
      if (m.sender_id !== user?.id) return m.message_id;
    }
    return null;
  }, [messages, user?.id]);

  // Phase 14.5 - count of @mentions of current user in this thread
  const myFullName = useMemo(() => {
    const me = participants.find((p) => p.user_id === user?.id);
    return me?.full_name ?? null;
  }, [participants, user?.id]);

  const mentionCount = useMemo(() => {
    if (!myFullName) return 0;
    const needle = `@${myFullName}`.toLowerCase();
    let n = 0;
    for (const m of messages) {
      if (m.message_type === 'system') continue;
      if (m.sender_id === user?.id) continue;
      if ((m.content || '').toLowerCase().includes(needle)) n++;
    }
    return n;
  }, [messages, myFullName, user?.id]);

  // Phase 14 - per-recipient catch-me-up anchor: snapshot the last message id
  // present at mount that is NOT my own. Treat anything newer as "since you last looked".
  const sinceMessageRef = useRef<string | null>(null);
  useEffect(() => {
    if (sinceMessageRef.current || messages.length === 0) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.message_type === 'system') continue;
      if (m.sender_id !== user?.id) {
        sinceMessageRef.current = m.message_id;
        break;
      }
    }
  }, [messages, user?.id]);

  const smartReplies = useDiaSmartReplies(
    groupId || '',
    lastInboundMessageId,
    !!groupId && diaPrefs.smartRepliesEnabled,
  );

  useEffect(() => {
    if (!groupId) return;
    const refId = smartReplies.data?.basedOnMessageId ?? lastInboundMessageId;
    if (!refId || !smartReplies.data?.suggestions?.length) return;
    logDiaMessagingEvent({
      conversationId: groupId,
      eventType: 'suggestion_shown',
      refId,
      metadata: { surface: 'group', count: smartReplies.data.suggestions.length },
    });
  }, [groupId, lastInboundMessageId, smartReplies.data]);

  const handleSend = useCallback(
    async (
      content: string,
      mediaUrls?: MediaItem[],
      reply?: ReplyContext | null,
      _mentionedUserIds?: string[],
    ) => {
      // Note: mentions are parsed in the composer; persisting them to
      // group_message_mentions is wired in a follow-up once sendMessage
      // returns the new message id from the realtime hook.
      await sendMessage(content, {
        mediaUrls,
        replyToId: reply?.messageId,
        payload: reply
          ? {
              reply_author: reply.authorName,
              reply_preview: reply.preview,
              ...(reply.mediaSnapshot ? { reply_media: reply.mediaSnapshot } : {}),
              ...(reply.mediaIndex != null ? { reply_media_index: reply.mediaIndex } : {}),
            }
          : undefined,
      });
      setReplyContext(null);
    },
    [sendMessage],
  );

  /** Voice note send: upload as audio media, then post via groupMessageService. */
  const handleSendVoice = useCallback(
    async (audioBlob: Blob, duration: number) => {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      const media = await mediaUploadService.uploadMessageMedia(file, groupId);
      const enriched: MediaItem = {
        ...media,
        durationSec: media.durationSec ?? duration,
      };
      await groupMessageService.sendMessage(groupId, '', {
        messageType: 'voice',
        mediaUrls: [enriched],
      });
    },
    [groupId],
  );

  const handleReply = useCallback(
    (msg: GroupMessage, media?: MediaItem, mediaIndex?: number) => {
      setReplyContext({
        messageId: msg.message_id,
        authorName: msg.sender_full_name || 'Member',
        preview: msg.content?.slice(0, 120) || (media ? media.name : ''),
        mediaSnapshot: media,
        mediaIndex,
      });
    },
    [],
  );

  const handleBack = useCallback(() => {
    navigate('/dna/messages');
  }, [navigate]);

  const handleJumpToMessage = useCallback((messageId: string) => {
    const el = messageRefs.current.get(messageId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    window.setTimeout(() => {
      setHighlightedId((current) => (current === messageId ? null : current));
    }, 1800);
  }, []);

  const invalidateMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
  }, [groupId, queryClient]);

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      try {
        await groupMessageService.editMessage(messageId, newContent);
        invalidateMessages();
      } catch {
        // toast handled in service logger
      }
    },
    [invalidateMessages],
  );

  const handleUnsendMessage = useCallback(
    async (messageId: string) => {
      try {
        await groupMessageService.unsendMessage(messageId);
        invalidateMessages();
      } catch {
        // noop
      }
    },
    [invalidateMessages],
  );

  const handleForwardMessage = useCallback((messageId: string, preview: string) => {
    setForwardTarget({ id: messageId, preview });
  }, []);

  const handleToggleStar = useCallback(
    async (messageId: string, star: boolean) => {
      try {
        if (star) await groupMessageService.starMessage(messageId, groupId!);
        else await groupMessageService.unstarMessage(messageId);
        queryClient.invalidateQueries({ queryKey: ['group-starred', groupId] });
      } catch {
        // noop
      }
    },
    [groupId, queryClient],
  );

  if (!groupId) return null;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <button
          onClick={() => setShowGroupInfo(true)}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={conversation?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              <Users className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {conversation?.title || 'Group Chat'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {participants.length} members
            </p>
          </div>
        </button>

        {/* Phase 14.5 - Mentions of me */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 relative"
          onClick={() => setMentionsOpen(true)}
          aria-label={mentionCount > 0 ? `${mentionCount} mentions of you` : 'Mentions of you'}
        >
          <AtSign className={cn('h-4 w-4', mentionCount > 0 ? 'text-primary' : 'text-muted-foreground')} />
          {mentionCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center leading-none">
              {mentionCount > 9 ? '9+' : mentionCount}
            </span>
          )}
        </Button>

        {/* Search-in-thread (Phase 8 stub) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => toast({ title: 'Search in chat', description: 'Coming in Phase 8.' })}
          aria-label="Search in chat"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Media gallery shortcut */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setShowMediaGallery(true)}
          aria-label="Shared media"
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Phase 14 - DIA menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="DIA actions">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {diaPrefs.summariesEnabled && (
              <DropdownMenuItem
                onClick={() => {
                  setSummaryOpen(true);
                  if (groupId) logDiaMessagingEvent({ conversationId: groupId, eventType: 'summary_opened', metadata: { surface: 'group' } });
                }}
              >
                <MateMasie className="h-4 w-4 mr-2 text-primary" /> Catch me up
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setDiaSettingsOpen(true)}>
              <MateMasie className="h-4 w-4 mr-2 text-primary" /> DIA settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Connection Status Banner */}
      <RealtimeStatusBanner
        status={connectionStatus}
        onRetry={retryConnection}
      />

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-muted/20 to-muted/40"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <p>Unable to load messages</p>
            <Button variant="ghost" size="sm" onClick={retryConnection}>
              Try again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1">
            <Users className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm">Group created! Start the conversation.</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  className="text-xs text-muted-foreground"
                >
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Load older messages
                </Button>
              </div>
            )}

            {groupedMessages.map((group) => (
              <div key={group.date}>
                <DateSeparator date={group.date} />
                <div className="space-y-0.5">
                  {group.messages.map((msg, msgIndex) => {
                    if (msg.message_type === 'system') {
                      return (
                        <GroupSystemMessage
                          key={msg.message_id}
                          content={msg.content}
                        />
                      );
                    }

                    const isOwn = msg.sender_id === user?.id;
                    const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                    const showSenderInfo =
                      !isOwn &&
                      (!prevMsg ||
                        prevMsg.sender_id !== msg.sender_id ||
                        prevMsg.message_type === 'system');

                    // Is this the last message in a run from the same sender?
                    const isLastInRun = !nextMsg || nextMsg.sender_id !== msg.sender_id || nextMsg.message_type === 'system';

                    return (
                      <div
                        key={msg.message_id}
                        ref={(el) => {
                          if (el) messageRefs.current.set(msg.message_id, el);
                          else messageRefs.current.delete(msg.message_id);
                        }}
                        data-message-id={msg.message_id}
                      >
                        <GroupMessageBubble
                          message={msg}
                          isOwn={isOwn}
                          showSenderInfo={showSenderInfo}
                          isLastInRun={isLastInRun}
                          participants={participants}
                          onReply={handleReply}
                          onEdit={handleEditMessage}
                          onUnsend={handleUnsendMessage}
                          onForward={handleForwardMessage}
                          onToggleStar={handleToggleStar}
                          isStarred={starredIds.has(msg.message_id)}
                          canDownload={canDownload}
                          onJumpToMessage={handleJumpToMessage}
                          isHighlighted={highlightedId === msg.message_id}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <TypingIndicatorDisplay typingUsers={typingUsers} />

      {/* Phase 14 - DIA smart replies */}
      {!replyContext && diaPrefs.smartRepliesEnabled && groupId && (
        <SmartReplyChips
          suggestions={smartReplies.data?.suggestions ?? []}
          isLoading={smartReplies.isLoading}
          conversationId={groupId}
          refId={smartReplies.data?.basedOnMessageId ?? lastInboundMessageId}
          onPick={(text) => {
            setSeedText(text);
            setSeedNonce((n) => n + 1);
            logDiaMessagingEvent({
              conversationId: groupId,
              eventType: 'suggestion_picked',
              refId: smartReplies.data?.basedOnMessageId ?? lastInboundMessageId ?? undefined,
              metadata: { surface: 'group', length: text.length },
            });
          }}
        />
      )}

      {/* Input */}
      <GroupChatInput
        onSend={handleSend}
        onSendVoice={handleSendVoice}
        onTyping={broadcastTyping}
        disabled={connectionStatus === 'offline'}
        conversationId={groupId}
        replyContext={replyContext}
        onCancelReply={() => setReplyContext(null)}
        onJumpToReply={handleJumpToMessage}
        participants={participants}
        currentUserId={user?.id}
        seedText={seedText}
        seedNonce={seedNonce}
      />

      {/* Group Info Drawer */}
      <GroupInfoDrawer
        open={showGroupInfo}
        onOpenChange={setShowGroupInfo}
        conversationId={groupId}
        conversation={conversation || undefined}
        participants={participants}
      />

      {/* Media Gallery Drawer */}
      <MediaGalleryDrawer
        open={showMediaGallery}
        onOpenChange={setShowMediaGallery}
        conversationId={groupId}
      />

      {/* Phase 14 - DIA catch-me-up (per-recipient: messages since you opened this thread) */}
      <MessageSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        conversationId={groupId}
        sinceMessageId={sinceMessageRef.current}
      />
      <DiaMessagingSettingsDrawer
        open={diaSettingsOpen}
        onOpenChange={setDiaSettingsOpen}
      />

      {/* Phase 14.5 - @mention digest */}
      <GroupMentionsDrawer
        open={mentionsOpen}
        onOpenChange={setMentionsOpen}
        messages={messages}
        participants={participants}
        currentUserId={user?.id}
        currentUserFullName={myFullName}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Forward dialog */}
      {forwardTarget && (
        <ForwardGroupMessageDialog
          open={!!forwardTarget}
          onOpenChange={(o) => !o && setForwardTarget(null)}
          messageId={forwardTarget.id}
          preview={forwardTarget.preview}
          excludeConversationId={groupId}
        />
      )}
    </div>
  );
}

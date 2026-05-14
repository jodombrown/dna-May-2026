import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, MessageWithSender, MessageAttachmentData, deleteConversation, archiveConversation, pinConversation, muteConversation } from '@/services/messageService';
import type { ReplyToData } from '@/services/messageTypes';
import { useAuth } from '@/contexts/AuthContext';
import { ChatHeader } from './ChatHeader';
import { ChatContextChip } from './ChatContextChip';
import { ChatHeaderActions } from './ChatHeaderActions';
import { ChatSearchBar } from './ChatSearchBar';
import { SharedMediaDrawer } from './SharedMediaDrawer';
import { ChatBubble } from './ChatBubble';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { ChatInput, MessageAttachment, MessageLinkPreview } from './ChatInput';
import { DateSeparator } from './DateSeparator';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicatorDisplay } from '@/components/messaging/group/TypingIndicatorDisplay';
import { useConversationReceipts, type MessageStatus } from '@/hooks/messaging/useMessageReceipts';
import { useChatSearch } from '@/hooks/messaging/useChatSearch';
import { safetyService } from '@/services/safetyService';
import { BlockConfirmDialog } from '@/components/messaging/safety/BlockConfirmDialog';
import { ReportDialog } from '@/components/messaging/safety/ReportDialog';
import { DisappearingPicker } from '@/components/messaging/safety/DisappearingPicker';
import { Ban, Timer, Flag, X } from 'lucide-react';
import { SmartReplyChips } from '@/components/messaging/dia/SmartReplyChips';
import { SmartComposeSuggestions } from '@/components/messaging/dia/SmartComposeSuggestions';
import { MessageSummaryDrawer } from '@/components/messaging/dia/MessageSummaryDrawer';
import { DiaMessagingSettingsDrawer } from '@/components/messaging/dia/DiaMessagingSettingsDrawer';
import { useDiaSmartReplies } from '@/hooks/messaging/useDiaSmartReplies';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';

interface ChatThreadProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  onBack: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversationId,
  otherUser,
  isMuted = false,
  isPinned = false,
  isArchived = false,
  onBack,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { toast } = useToast();
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<ReplyToData | null>(null);
  // Optimistic + failed send tracking, keyed by client_id
  const [pending, setPending] = useState<Map<string, { content: string; attachment?: MessageAttachmentData; linkPreview?: MessageLinkPreview; replyTo?: ReplyToData; status: 'sending' | 'failed'; createdAt: string }>>(new Map());
  const [sharedMediaOpen, setSharedMediaOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  // Phase 8 + 9: in-thread search open state. Hook is initialised below,
  // after `messages` is fetched.
  const [searchOpen, setSearchOpen] = useState(false);
  const lastScrollTopRef = useRef(0);

  // Phase 10 - safety dialogs
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [disappearingOpen, setDisappearingOpen] = useState(false);

  // Phase 12 - DIA catch-me-up drawer + smart-reply seed
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [seedText, setSeedText] = useState<string | undefined>(undefined);
  const [seedNonce, setSeedNonce] = useState(0);

  // Phase 13 - per-user DIA messaging preferences + settings drawer
  const { prefs: diaPrefs } = useDiaMessagingPrefs();
  const [diaSettingsOpen, setDiaSettingsOpen] = useState(false);

  const { data: isBlocked = false } = useQuery({
    queryKey: ['user-block', otherUser.id],
    queryFn: () => safetyService.isBlocked(otherUser.id),
    staleTime: 60_000,
  });

  // Phase 11 - disappearing duration drives the status banner
  const { data: disappearingSeconds = null } = useQuery({
    queryKey: ['disappearing', conversationId],
    queryFn: () => safetyService.getDisappearingDuration(conversationId),
    staleTime: 60_000,
  });

  // Phase 11 - recent report flag (UI-only undo within 30s)
  const REPORT_KEY = `dna:recent-report:${conversationId}`;
  const [recentReportAt, setRecentReportAt] = useState<number | null>(() => {
    try {
      const v = sessionStorage.getItem(REPORT_KEY);
      const n = v ? Number(v) : 0;
      return n && Date.now() - n < 30_000 ? n : null;
    } catch { return null; }
  });
  useEffect(() => {
    if (!recentReportAt) return;
    const remaining = 30_000 - (Date.now() - recentReportAt);
    if (remaining <= 0) { setRecentReportAt(null); return; }
    const t = setTimeout(() => setRecentReportAt(null), remaining);
    return () => clearTimeout(t);
  }, [recentReportAt]);

  const formatDisappearing = (s: number | null): string => {
    if (!s) return '';
    if (s >= 7 * 86400) return '7 days';
    if (s >= 86400) return '24 hours';
    if (s >= 3600) return '1 hour';
    return `${s}s`;
  };

  const handleTurnOffDisappearing = async () => {
    try {
      await safetyService.setDisappearingDuration(conversationId, null);
      queryClient.invalidateQueries({ queryKey: ['disappearing', conversationId] });
      toast({ title: 'Disappearing messages off' });
    } catch {
      toast({ title: 'Failed to update setting', variant: 'destructive' });
    }
  };

  // Typing indicator
  const { typingUsers, startTyping } = useTypingIndicator(conversationId);

  // Per-recipient receipts -> drives sent / delivered / read ticks live
  const { data: receiptStatuses = {} } = useConversationReceipts(conversationId);

  // Fetch messages — realtime subscription below handles live updates, no polling needed
  const { data: messages = [], isLoading, isError, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageService.getMessages(conversationId),
    staleTime: 60_000,
    retry: 2,
  });

  // Send with optimistic + dedupe-safe client_id + retry-on-failure
  const sendWithClientId = useCallback(async (
    clientId: string,
    args: { content: string; attachment?: MessageAttachmentData; linkPreview?: MessageLinkPreview; replyTo?: ReplyToData },
  ) => {
    setPending((prev) => {
      const next = new Map(prev);
      next.set(clientId, { ...args, status: 'sending', createdAt: new Date().toISOString() });
      return next;
    });
    try {
      await messageService.sendMessage(
        conversationId,
        args.content,
        args.attachment,
        args.linkPreview,
        args.replyTo,
        undefined,
        clientId,
      );
      setPending((prev) => {
        const next = new Map(prev);
        next.delete(clientId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      setPending((prev) => {
        const next = new Map(prev);
        const existing = next.get(clientId);
        if (existing) next.set(clientId, { ...existing, status: 'failed' });
        return next;
      });
      toast({ title: 'Message not sent', description: 'Tap the alert to retry.', variant: 'destructive' });
    }
  }, [conversationId, queryClient, toast]);

  const handleRetryPending = useCallback((clientId: string) => {
    const item = pending.get(clientId);
    if (!item) return;
    sendWithClientId(clientId, item);
  }, [pending, sendWithClientId]);

  // Auto-retry pending sends when the network comes back
  useEffect(() => {
    const onOnline = () => {
      pending.forEach((item, cid) => {
        if (item.status === 'failed') sendWithClientId(cid, item);
      });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [pending, sendWithClientId]);

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Message deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete', description: 'Could not delete the message', variant: 'destructive' });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: () => deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your inbox",
      });
      navigate('/dna/messages');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  // Archive conversation mutation
  const archiveConversationMutation = useMutation({
    mutationFn: () => archiveConversation(conversationId, !isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: isArchived ? "Conversation unarchived" : "Conversation archived",
        description: isArchived 
          ? "The conversation has been moved back to your inbox"
          : "The conversation has been archived",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    },
  });

  // Pin conversation mutation
  const pinConversationMutation = useMutation({
    mutationFn: () => pinConversation(conversationId, !isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: isPinned ? "Conversation unpinned" : "Conversation pinned",
        description: isPinned 
          ? "The conversation has been unpinned"
          : "The conversation has been pinned to the top",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    },
  });

  // Mute conversation mutation
  const muteConversationMutation = useMutation({
    mutationFn: () => muteConversation(conversationId, !isMuted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: isMuted ? "Notifications unmuted" : "Notifications muted",
        description: isMuted 
          ? `You'll receive notifications from ${otherUser.full_name}`
          : `You won't receive notifications from ${otherUser.full_name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (conversationId) {
      messageService.markAsRead(conversationId)
        .then(() => {
          // Invalidate all relevant queries after marking as read
          queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        })
        .catch((err) => {
          // Silent fail for mark as read errors
        });
    }
  }, [conversationId, messages.length, queryClient]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Phase 6 - collapse the context chip + quick-actions row when scrolling down
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      const top = el.scrollTop;
      const delta = top - lastScrollTopRef.current;
      if (Math.abs(delta) < 8) return;
      if (delta > 0 && top > 40) setHeaderCollapsed(true);
      else if (delta < 0) setHeaderCollapsed(false);
      lastScrollTopRef.current = top;
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MessageWithSender[] }[] = [];
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

  // Phase 8 + 9 - search hook (cached index, persisted query/active/range,
  // matches text + attachment filename + link preview)
  const search = useChatSearch(conversationId, messages);

  // Phase 12.1 - last inbound message drives smart replies
  const lastInboundMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id !== user?.id) return messages[i].message_id;
    }
    return null;
  }, [messages, user?.id]);

  const smartReplies = useDiaSmartReplies(
    conversationId,
    lastInboundMessageId,
    !isBlocked && !replyingTo && diaPrefs.smartRepliesEnabled,
  );

  // Phase 13 - log when DIA suggestions are surfaced (once per inbound message)
  useEffect(() => {
    const refId = smartReplies.data?.basedOnMessageId ?? lastInboundMessageId;
    if (!refId) return;
    if (!smartReplies.data?.suggestions?.length) return;
    logDiaMessagingEvent({
      conversationId,
      eventType: 'suggestion_shown',
      refId,
      metadata: { count: smartReplies.data.suggestions.length },
    });
  }, [conversationId, lastInboundMessageId, smartReplies.data]);

  // Scroll the active match into view as it changes
  useEffect(() => {
    if (!searchOpen) return;
    const id = search.matches[search.activeIdx];
    if (id) {
      const el = messageRefs.current.get(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchOpen, search.activeIdx, search.matches]);

  // Phase 10 - when reopening search, jump back to the last active match
  useEffect(() => {
    if (!searchOpen) return;
    search.restoreActiveFromPersisted();
    // intentionally only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen]);


  const handleReply = useCallback((messageId: string) => {
    const msg = messages.find(m => m.message_id === messageId);
    if (!msg) return;
    const att = msg.payload?.attachment;
    const link = msg.payload?.linkPreview;
    setReplyingTo({
      messageId: msg.message_id,
      senderName: msg.sender_full_name,
      senderAvatar: msg.sender_avatar_url,
      content: msg.content,
      createdAt: msg.created_at,
      attachment: att
        ? {
            type: att.type,
            url: att.url,
            filename: att.filename,
            mimetype: att.mimetype,
            duration: att.duration,
          }
        : undefined,
      linkPreview: link
        ? { url: link.url, title: link.title, image: link.image }
        : undefined,
    });
  }, [messages]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = messageRefs.current.get(messageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 1500);
    }
  }, []);

  const handleSend = async (content: string, attachment?: MessageAttachment, linkPreview?: MessageLinkPreview) => {
    // Phase 10 - client-side rate guard. DB-side enforcement still wins.
    const allowed = await safetyService.checkAndLogRate(conversationId);
    if (!allowed) {
      toast({
        title: 'Slow down',
        description: 'You are sending messages too fast. Try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    const serviceAttachment: MessageAttachmentData | undefined = attachment ? {
      type: attachment.type,
      url: attachment.url,
      filename: attachment.filename,
      filesize: attachment.filesize,
      mimetype: attachment.mimetype,
    } : undefined;

    const cid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sendWithClientId(cid, {
      content,
      attachment: serviceAttachment,
      linkPreview,
      replyTo: replyingTo || undefined,
    });
    setReplyingTo(null);
  };

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    await messageService.sendVoiceMessage(conversationId, audioBlob, duration);
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMutation.mutate(messageId);
  };

  // ---- Phase 2 message actions: edit, unsend, forward, star ----

  const { data: starredIds = [] } = useQuery({
    queryKey: ['starred-messages', conversationId],
    queryFn: () => messageService.getStarredMessageIds(conversationId),
    enabled: !!conversationId,
  });
  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      messageService.editMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast({ title: 'Message updated' });
    },
    onError: (e: Error) => {
      toast({
        title: 'Could not edit',
        description: e.message?.includes('window') ? 'Edit window has expired (15 min).' : 'Try again.',
        variant: 'destructive',
      });
    },
  });

  const unsendMutation = useMutation({
    mutationFn: (id: string) => messageService.unsendMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Message unsent' });
    },
    onError: () => toast({ title: 'Failed to unsend', variant: 'destructive' }),
  });

  const starMutation = useMutation({
    mutationFn: (id: string) => messageService.toggleStar(id, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['starred-messages', conversationId] });
    },
  });

  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const forwardingMessage = useMemo(
    () => messages.find((m) => m.message_id === forwardingId) ?? null,
    [forwardingId, messages],
  );

  const handleEdit = (messageId: string) => {
    const target = messages.find((m) => m.message_id === messageId);
    if (!target) return;
    const next = window.prompt('Edit message', target.content);
    if (next == null) return;
    if (next.trim() && next.trim() !== target.content) {
      editMutation.mutate({ id: messageId, content: next });
    }
  };

  const handleUnsend = (messageId: string) => {
    if (window.confirm('Unsend this message? It will be removed for everyone.')) {
      unsendMutation.mutate(messageId);
    }
  };

  const handleForward = (messageId: string) => setForwardingId(messageId);
  const handleToggleStar = (messageId: string) => starMutation.mutate(messageId);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Header - fixed rail, never shrinks */}
      <ChatHeader 
        otherUser={otherUser} 
        conversationId={conversationId}
        isMuted={isMuted}
        isPinned={isPinned}
        isArchived={isArchived}
        onBack={onBack}
        onMuteToggle={() => muteConversationMutation.mutate()}
        onPinToggle={() => pinConversationMutation.mutate()}
        onArchiveToggle={() => archiveConversationMutation.mutate()}
        onDeleteConversation={() => deleteConversationMutation.mutate()}
      />

      {/* Phase 6: connection-context chip + quick actions, collapsing on scroll */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        style={{ maxHeight: headerCollapsed || searchOpen ? 0 : 200, opacity: headerCollapsed || searchOpen ? 0 : 1 }}
        aria-hidden={headerCollapsed || searchOpen}
      >
        <ChatContextChip otherUserId={otherUser.id} />
        <ChatHeaderActions
          username={otherUser.username}
          onShowSharedMedia={() => setSharedMediaOpen(true)}
          onSearch={() => setSearchOpen(true)}
          onBlockToggle={() => setBlockOpen(true)}
          onReport={() => setReportOpen(true)}
          onDisappearing={() => setDisappearingOpen(true)}
          onCatchMeUp={diaPrefs.summariesEnabled ? () => {
            setSummaryOpen(true);
            logDiaMessagingEvent({ conversationId, eventType: 'summary_opened' });
          } : undefined}
          onDiaSettings={() => setDiaSettingsOpen(true)}
          isBlocked={isBlocked}
        />
      </div>

      {/* Phase 8 + 9 - in-thread search */}
      {searchOpen && (
        <ChatSearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          matches={search.matches}
          activeIndex={search.activeIdx}
          onActiveIndexChange={(idx) => {
            search.setActiveIdx(idx);
            const id = search.matches[idx];
            if (id) handleScrollToMessage(id);
          }}
          range={search.range}
          onRangeChange={search.setRange}
          onReplyToActive={() => {
            const id = search.matches[search.activeIdx];
            if (id) {
              handleReply(id);
              setSearchOpen(false);
            }
          }}
          onResetAll={() => {
            const lastId = search.lastActiveMessageId;
            search.reset();
            setSearchOpen(false);
            if (lastId) {
              setTimeout(() => handleScrollToMessage(lastId), 60);
            }
          }}
          onClose={() => {
            setSearchOpen(false);
          }}
        />
      )}


      <SharedMediaDrawer
        open={sharedMediaOpen}
        onOpenChange={setSharedMediaOpen}
        conversationId={conversationId}
        otherUserName={otherUser.full_name}
      />

      {/* Messages - only scrollable region */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-gradient-to-b from-muted/20 to-muted/40 dark:from-neutral-900 dark:to-neutral-950"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <p>Unable to load messages</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline text-sm"
            >
              Try refreshing
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start h-full pt-8 text-muted-foreground gap-2">
            <p className="text-sm">Start the conversation</p>
            {diaPrefs.smartRepliesEnabled !== false && (
              <SmartComposeSuggestions
                otherUserId={otherUser.id}
                otherUserName={otherUser.full_name?.split(' ')[0]}
                enabled={true}
                onPick={(text) => {
                  setSeedText(text);
                  setSeedNonce((n) => n + 1);
                  logDiaMessagingEvent({
                    conversationId,
                    eventType: 'suggestion_picked',
                    variant: 'smart_compose',
                  });
                }}
              />
            )}
          </div>
        ) : (
          <div className="py-2">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <DateSeparator date={group.date} />
                <div className="space-y-0.5">
                  {group.messages.map((msg, msgIndex) => {
                    const isOwn = msg.sender_id === user?.id;
                    const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    
                    const isMatch = searchOpen && search.matches.includes(msg.message_id);
                    const isActiveMatch = isMatch && search.matches[search.activeIdx] === msg.message_id;
                    return (
                      <div
                        key={msg.message_id}
                        id={`message-${msg.message_id}`}
                        ref={(el) => {
                          if (el) messageRefs.current.set(msg.message_id, el);
                        }}
                        className={
                          'transition-colors duration-300 ' +
                          (isMatch && !isActiveMatch ? 'bg-primary/5 rounded-md' : '')
                        }
                      >
                        <ChatBubble
                          message={msg}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          status={isOwn ? (receiptStatuses[msg.message_id] ?? 'sent') : undefined}
                          onDeleteMessage={handleDeleteMessage}
                          onReply={handleReply}
                          onScrollToMessage={handleScrollToMessage}
                          onEdit={handleEdit}
                          onUnsend={handleUnsend}
                          onForward={handleForward}
                          onToggleStar={handleToggleStar}
                          isStarred={starredSet.has(msg.message_id)}
                          searchQuery={searchOpen ? search.query : undefined}
                          isActiveSearchMatch={isActiveMatch}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Optimistic / failed pending sends */}
            {Array.from(pending.entries()).map(([cid, item]) => (
              <ChatBubble
                key={`pending-${cid}`}
                message={{
                  message_id: cid,
                  content: item.content,
                  created_at: item.createdAt,
                  sender_id: user?.id ?? '',
                  sender_avatar_url: '',
                  sender_full_name: 'You',
                  payload: {
                    attachment: item.attachment,
                    linkPreview: item.linkPreview,
                    replyTo: item.replyTo,
                  },
                }}
                isOwn
                showAvatar={false}
                status={item.status}
                onRetry={handleRetryPending}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicatorDisplay
          typingUsers={typingUsers.map(u => ({
            profile_id: u.user_id,
            display_name: u.display_name,
            started_at: Date.now(),
          }))}
        />
      )}

      {/* Phase 11 - dedicated status banner explains current safety state */}
      {isBlocked ? (
        <div className="flex-shrink-0 border-t border-border bg-destructive/5 px-4 py-3 flex items-start gap-2 text-sm">
          <Ban className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-foreground font-medium">You blocked {otherUser.full_name}</p>
            <p className="text-xs text-muted-foreground">
              You can still read past messages and shared media. Unblock to resume the conversation.
            </p>
          </div>
          <button
            onClick={() => setBlockOpen(true)}
            className="text-primary text-sm font-medium hover:underline flex-shrink-0"
          >
            Undo
          </button>
        </div>
      ) : (
        <>
          {disappearingSeconds && (
            <div className="flex-shrink-0 border-t border-border bg-amber-500/10 px-4 py-2 flex items-center gap-2 text-xs text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <span className="flex-1">
                Disappearing messages on - new messages vanish after {formatDisappearing(disappearingSeconds)}.
              </span>
              <button
                onClick={handleTurnOffDisappearing}
                className="text-primary font-medium hover:underline"
              >
                Turn off
              </button>
            </div>
          )}
          {recentReportAt && (
            <div className="flex-shrink-0 border-t border-border bg-muted/40 px-4 py-2 flex items-center gap-2 text-xs text-foreground">
              <Flag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1">
                Report submitted. Our team will review {otherUser.full_name}'s account.
              </span>
              <button
                onClick={() => {
                  try { sessionStorage.removeItem(REPORT_KEY); } catch { /* ignore */ }
                  setRecentReportAt(null);
                  toast({ title: 'Report dismissed' });
                }}
                className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                aria-label="Dismiss report notice"
              >
                <X className="h-3 w-3" /> Dismiss
              </button>
            </div>
          )}
          {!replyingTo && diaPrefs.smartRepliesEnabled && (
            <SmartReplyChips
              suggestions={smartReplies.data?.suggestions ?? []}
              isLoading={smartReplies.isLoading}
              conversationId={conversationId}
              refId={smartReplies.data?.basedOnMessageId ?? lastInboundMessageId}
              onPick={(text) => {
                setSeedText(text);
                setSeedNonce((n) => n + 1);
                logDiaMessagingEvent({
                  conversationId,
                  eventType: 'suggestion_picked',
                  refId: smartReplies.data?.basedOnMessageId ?? lastInboundMessageId ?? undefined,
                  metadata: { length: text.length },
                });
              }}
            />
          )}
          <ChatInput
            onSend={handleSend}
            onSendVoice={handleSendVoice}
            onTyping={startTyping}
            disabled={false}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            seedText={seedText}
            seedNonce={seedNonce}
          />
        </>
      )}

      {/* Phase 10 - safety dialogs */}
      <BlockConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        targetUserId={otherUser.id}
        targetUserName={otherUser.full_name}
        isUnblock={isBlocked}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={(o) => {
          setReportOpen(o);
          if (!o) {
            // Re-read recent-report flag in case ReportDialog just set it.
            try {
              const v = sessionStorage.getItem(REPORT_KEY);
              const n = v ? Number(v) : 0;
              if (n && Date.now() - n < 30_000) setRecentReportAt(n);
            } catch { /* ignore */ }
          }
        }}
        targetUserId={otherUser.id}
        targetUserName={otherUser.full_name}
        conversationId={conversationId}
      />
      <DisappearingPicker
        open={disappearingOpen}
        onOpenChange={setDisappearingOpen}
        conversationId={conversationId}
      />

      {/* Phase 12.2 - DIA catch-me-up summary */}
      <MessageSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        conversationId={conversationId}
      />

      {/* Phase 13 - DIA messaging settings */}
      <DiaMessagingSettingsDrawer
        open={diaSettingsOpen}
        onOpenChange={setDiaSettingsOpen}
      />

      {forwardingMessage && (
        <ForwardMessageDialog
          open={!!forwardingId}
          onOpenChange={(o) => !o && setForwardingId(null)}
          messageId={forwardingMessage.message_id}
          preview={forwardingMessage.content || 'Attachment'}
        />
      )}
    </div>
  );
};
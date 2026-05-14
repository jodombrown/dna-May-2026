import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Loader2, Search, Plus, MoreVertical, Pin, BellOff, Trash2, Archive, ArchiveRestore, Check, Settings, Users, MessageSquarePlus, AtSign, Inbox, X, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationListItem, InboxTab, InboxFilterChip } from '@/types/messaging';
import InboxTabs from './InboxTabs';
import PresenceIndicator from './PresenceIndicator';
import { ConversationContextBadge } from './ConversationContext';
import { DiaConversationStarter } from './DiaConversationStarter';
import { MessageRequestCard } from './MessageRequestBanner';
import { useMessageRequests } from '@/hooks/useMessageRequests';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { messageService, deleteConversation, pinConversation } from '@/services/messageService';
import { groupMessageService } from '@/services/groupMessageService';
import { MessageSettingsDialog } from './MessageSettingsDialog';
import { InboxMessageSearchResults } from './InboxMessageSearchResults';

interface ConversationListPanelProps {
  conversations?: ConversationListItem[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation?: () => void;
  onNewGroup?: () => void;
  onlineUsers?: string[];
  onRefresh?: () => void;
  archivedConversations?: ConversationListItem[];
}

/**
 * ConversationListPanel - Left panel (35%) for MESSAGES_MODE
 *
 * Implements PRD requirements:
 * - Inbox Tabs: Focused | Other | Requests | Archived (LinkedIn-style)
 * - Presence: Green dot for online users
 * - Context Badge: Icon showing origin (event, project)
 * - Actions: Pin, mute, archive, delete
 * - Search conversations by name
 * - Unread conversation badges
 */
const ConversationListPanel: React.FC<ConversationListPanelProps> = ({
  conversations,
  isLoading,
  searchTerm,
  onSearchChange,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onNewGroup,
  onlineUsers = [],
  onRefresh,
  archivedConversations = [],
}) => {
  const [activeTab, setActiveTab] = useState<InboxTab>('primary');
  const [filterChip, setFilterChip] = useState<InboxFilterChip>('all');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();
  const { requests, requestCount, isLoading: requestsLoading } = useMessageRequests();

  // Poof animation helper - triggers animation then runs callback
  const triggerPoof = useCallback((id: string, callback: () => Promise<void>) => {
    setRemovingIds(prev => new Set(prev).add(id));
    // Wait for animation to complete before running callback
    setTimeout(async () => {
      await callback();
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);
  }, []);

  const findConv = (id: string) => conversations?.find((c) => c.conversation_id === id);

  // Archive a conversation with poof animation (works for 1:1 and groups)
  const handleArchive = (conversationId: string) => {
    triggerPoof(conversationId, async () => {
      try {
        const conv = findConv(conversationId);
        if (conv?.is_group) {
          await groupMessageService.setArchive(conversationId, true);
        } else {
          await messageService.archiveConversation(conversationId);
        }
        toast({
          title: 'Conversation archived',
          description: 'You can find it in the Archived tab',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (conv?.is_group) {
                  await groupMessageService.setArchive(conversationId, false);
                } else {
                  await messageService.unarchiveConversation(conversationId);
                }
                onRefresh?.();
                toast({ title: 'Conversation restored' });
              }}
            >
              Undo
            </Button>
          ),
        });
        onRefresh?.();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to archive conversation', variant: 'destructive' });
      }
    });
  };

  const handleUnarchive = (conversationId: string) => {
    triggerPoof(conversationId, async () => {
      try {
        const conv = findConv(conversationId);
        if (conv?.is_group) {
          await groupMessageService.setArchive(conversationId, false);
        } else {
          await messageService.unarchiveConversation(conversationId);
        }
        toast({ title: 'Conversation restored', description: 'Moved back to Focused' });
        onRefresh?.();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to restore conversation', variant: 'destructive' });
      }
    });
  };

  // Mute/unmute (works for 1:1 and groups)
  const handleToggleMute = async (conversationId: string, currentlyMuted: boolean) => {
    try {
      const conv = findConv(conversationId);
      if (conv?.is_group) {
        await groupMessageService.setMute(conversationId, !currentlyMuted);
      } else if (currentlyMuted) {
        await messageService.unmuteConversation(conversationId);
      } else {
        await messageService.muteConversation(conversationId);
      }
      toast({ title: currentlyMuted ? 'Conversation unmuted' : 'Conversation muted' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update mute status', variant: 'destructive' });
    }
  };

  // Pin/unpin (works for 1:1 and groups)
  const handleTogglePin = async (conversationId: string, currentlyPinned: boolean) => {
    try {
      const conv = findConv(conversationId);
      if (conv?.is_group) {
        await groupMessageService.setPin(conversationId, !currentlyPinned);
      } else {
        await pinConversation(conversationId, !currentlyPinned);
      }
      toast({ title: currentlyPinned ? 'Unpinned' : 'Pinned' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update pin', variant: 'destructive' });
    }
  };

  // Delete a conversation with poof animation
  const handleDelete = (conversationId: string) => {
    triggerPoof(conversationId, async () => {
      try {
        await deleteConversation(conversationId);
        toast({ title: 'Conversation deleted' });
        onRefresh?.();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
      }
    });
  };

  // Accept request: move bucket to primary
  const handleAcceptRequest = async (conversationId: string) => {
    setActioningIds((prev) => new Set(prev).add(conversationId));
    try {
      await messageService.setConversationBucket(conversationId, 'primary');
      toast({ title: 'Request accepted', description: 'Conversation moved to Primary' });
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    } finally {
      setActioningIds((prev) => { const n = new Set(prev); n.delete(conversationId); return n; });
    }
  };

  // Ignore request: move bucket to spam
  const handleIgnoreRequest = (conversationId: string) => {
    triggerPoof(conversationId, async () => {
      try {
        await messageService.setConversationBucket(conversationId, 'spam');
        toast({ title: 'Moved to Spam' });
        onRefresh?.();
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to ignore request', variant: 'destructive' });
      }
    });
  };

  // Move spam back to primary
  const handleNotSpam = async (conversationId: string) => {
    try {
      await messageService.setConversationBucket(conversationId, 'primary');
      toast({ title: 'Moved to Primary' });
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to move conversation', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';
  };

  // Filter conversations based on search term and tab
  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const matches = (conv: ConversationListItem) => {
      if (!q) return true;
      const haystack = [
        conv.other_user_full_name,
        conv.other_user_username,
        conv.other_user_headline,
        conv.last_message_content,
        conv.last_message_preview,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    };

    // For archived tab, use archivedConversations prop
    if (activeTab === 'archived') {
      return archivedConversations.filter(matches);
    }

    if (!conversations) return [];

    let filtered = conversations.filter((conv) => matches(conv) && !conv.is_archived);

    // Filter by tab (Primary / Requests / Spam) using bucket field; default 'primary'
    const bucketOf = (c: ConversationListItem) => c.bucket ?? 'primary';
    switch (activeTab) {
      case 'primary':
        filtered = filtered.filter((c) => bucketOf(c) === 'primary');
        break;
      case 'requests':
        filtered = filtered.filter((c) => bucketOf(c) === 'requests');
        break;
      case 'spam':
        filtered = filtered.filter((c) => bucketOf(c) === 'spam');
        break;
    }

    // Apply filter chip
    if (filterChip === 'unread') {
      filtered = filtered.filter((c) => (c.unread_count || 0) > 0);
    } else if (filterChip === 'mentions') {
      filtered = filtered.filter((c) => !!c.has_unread_mention);
    }

    return filtered;
  }, [conversations, archivedConversations, searchTerm, activeTab, filterChip]);

  // Counts per tab - badges show "conversations with unread" (LinkedIn pattern)
  const primaryCount = useMemo(() => {
    if (!conversations) return 0;
    return conversations.filter(
      (c) => (c.bucket ?? 'primary') === 'primary' && !c.is_archived && (c.unread_count || 0) > 0
    ).length;
  }, [conversations]);

  const spamCount = useMemo(() => {
    if (!conversations) return 0;
    return conversations.filter((c) => (c.bucket ?? 'primary') === 'spam' && !c.is_archived).length;
  }, [conversations]);

  const bucketRequestsCount = useMemo(() => {
    if (!conversations) return 0;
    return conversations.filter((c) => (c.bucket ?? 'primary') === 'requests' && !c.is_archived).length;
  }, [conversations]);

  const archivedCount = archivedConversations.length;

  const handleMarkAllRead = async () => {
    // Mark all conversations as read
    const unreadConversations = conversations?.filter(c => c.unread_count > 0 && !c.is_archived) || [];
    
    if (unreadConversations.length === 0) {
      toast({ title: 'All caught up!', description: 'No unread messages' });
      return;
    }

    try {
      for (const conv of unreadConversations) {
        await messageService.markAsRead(conv.conversation_id);
      }
      toast({ 
        title: 'All marked as read', 
        description: `${unreadConversations.length} conversation${unreadConversations.length > 1 ? 's' : ''} marked as read` 
      });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark conversations as read', variant: 'destructive' });
    }
  };

  const handleArchiveAllRead = async () => {
    // Archive all conversations with no unread messages
    const conversationsToArchive = conversations?.filter(c => c.unread_count === 0 && !c.is_archived) || [];
    
    if (conversationsToArchive.length === 0) {
      toast({ title: 'Nothing to archive', description: 'No read conversations found' });
      return;
    }

    try {
      for (const conv of conversationsToArchive) {
        await messageService.archiveConversation(conv.conversation_id);
      }
      toast({ 
        title: `Archived ${conversationsToArchive.length} conversation${conversationsToArchive.length > 1 ? 's' : ''}`,
        description: 'Find them in the Archived tab'
      });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive conversations', variant: 'destructive' });
    }
  };

  return (
    <Card className="flex flex-col h-full md:rounded-lg rounded-none border-0 md:border shadow-none md:shadow-sm">
      {/* Search Header */}
      <div className="px-3 pt-3 pb-2 md:p-4 border-b space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-h1 text-foreground">Messages</h2>
          <div className="flex items-center gap-1">
            {(onNewConversation || onNewGroup) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[9999]">
                  {onNewConversation && (
                    <DropdownMenuItem onClick={onNewConversation} className="cursor-pointer">
                      <MessageSquarePlus className="h-4 w-4 mr-2" />
                      New Message
                    </DropdownMenuItem>
                  )}
                  {onNewGroup && (
                    <DropdownMenuItem onClick={onNewGroup} className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      New Group
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Header Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-[9999]">
                <DropdownMenuItem onClick={handleMarkAllRead} className="cursor-pointer">
                  <Check className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchiveAllRead} className="cursor-pointer">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive all read
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Message settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search messages (press / to focus)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
              data-inbox-search
              aria-label="Search messages"
            />
          </div>
          {/* Trailing filter cluster: All / Unread / Mentions */}
          {activeTab !== 'archived' && (
            <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-background p-0.5" role="tablist" aria-label="Inbox filters">
              {([
                { id: 'all' as const, label: 'All', icon: Inbox },
                { id: 'unread' as const, label: 'Unread', icon: MessageSquarePlus },
                { id: 'mentions' as const, label: 'Mentions', icon: AtSign },
              ]).map((chip) => {
                const Icon = chip.icon;
                const active = filterChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    role="tab"
                    aria-selected={active}
                    aria-label={`Filter by ${chip.label}`}
                    title={chip.label}
                    onClick={() => setFilterChip(chip.id)}
                    className={cn(
                      'inline-flex items-center justify-center h-8 w-8 rounded transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inbox Tabs (segmented, on-brand) */}
      <InboxTabs
        activeTab={activeTab}
        onTabChange={(t) => { setActiveTab(t); setFilterChip('all'); }}
        primaryCount={primaryCount}
        requestsCount={bucketRequestsCount || requestCount}
        spamCount={spamCount}
        archivedCount={archivedCount}
      />

      {/* Tier 3: global message-body search results (>=2 chars) */}
      <InboxMessageSearchResults query={searchTerm} />

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {activeTab === 'archived' ? (
              <>
                <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No archived conversations</p>
                <p className="text-sm mt-2">Archived conversations will appear here</p>
              </>
            ) : activeTab === 'requests' ? (
              <>
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No message requests</p>
                <p className="text-sm mt-2">
                  First messages from people you are not connected with will appear here.
                </p>
              </>
            ) : activeTab === 'spam' ? (
              <>
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No spam</p>
                <p className="text-sm mt-2">Conversations you mark as spam show up here.</p>
              </>
            ) : (
              <>
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start connecting with people!</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {/* Inline accept / ignore actions for Requests tab */}
            {activeTab === 'requests' && (
              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30">
                Tap a request to preview. Use Accept to move it to Primary or Ignore to mark as spam.
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {filteredConversations.map((conversation) => {
                const hasUnread = conversation.unread_count > 0;
                const isOnline = onlineUsers.includes(conversation.other_user_id || '');
                const isArchived = activeTab === 'archived';
                const isRemoving = removingIds.has(conversation.conversation_id);

                if (isRemoving) {
                  return (
                    <motion.div
                      key={conversation.conversation_id}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ 
                        opacity: 0, 
                        scale: 0.8, 
                        filter: 'blur(4px)',
                      }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="relative group overflow-hidden"
                      style={{ height: 0, padding: 0, margin: 0 }}
                    />
                  );
                }

                return (
                  <motion.div
                    key={conversation.conversation_id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8, 
                      filter: 'blur(4px)',
                    }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    data-selected-row={selectedConversationId === conversation.conversation_id ? 'true' : undefined}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '88px' } as React.CSSProperties}
                    className={cn(
                      'relative group',
                      selectedConversationId === conversation.conversation_id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/60'
                    )}
                  >
                  <button
                    onClick={() => onSelectConversation(conversation.conversation_id)}
                    className="w-full p-4 pr-10 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with presence indicator (or group icon) */}
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.other_user_avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground" data-keep-color>
                            {conversation.is_group ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              getInitials(conversation.other_user_full_name || '')
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {!conversation.is_group && isOnline && (
                          <div className="absolute bottom-0 right-0 border-2 border-background rounded-full">
                            <PresenceIndicator status="online" size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Pin indicator */}
                            {conversation.is_pinned && (
                              <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                            )}
                            <p
                              className={cn(
                                'font-semibold text-body truncate',
                                hasUnread && selectedConversationId !== conversation.conversation_id && 'text-primary'
                              )}
                            >
                              {conversation.other_user_full_name}
                            </p>
                            {/* Origin context badge */}
                            {conversation.origin_type && (
                              <ConversationContextBadge
                                originType={conversation.origin_type}
                              />
                            )}
                            {/* Muted indicator */}
                            {conversation.is_muted && (
                              <BellOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {conversation.last_message_at && (
                              <span className="text-micro text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(
                                  new Date(conversation.last_message_at),
                                  { addSuffix: false }
                                )}
                              </span>
                            )}
                            {hasUnread && (
                              <Badge
                                variant="default"
                                className="rounded-full px-2 py-0 text-micro"
                                data-keep-color
                              >
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {conversation.is_group && (
                          <p className="text-meta text-muted-foreground truncate mt-0.5">
                            {conversation.participant_count || 0} member
                            {(conversation.participant_count || 0) === 1 ? '' : 's'}
                          </p>
                        )}

                        {!conversation.is_group && conversation.other_user_headline && (
                          <p className="text-meta text-muted-foreground truncate mt-0.5">
                            {conversation.other_user_headline}
                          </p>
                        )}

                        {(conversation.last_message_content ||
                          conversation.last_message_preview) && (
                          <p
                            className={cn(
                              'text-meta truncate mt-0.5',
                              hasUnread
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {conversation.last_message_preview ||
                              conversation.last_message_content}
                          </p>
                        )}

                        {/* DIA Conversation Starter for stale conversations */}
                        {!hasUnread && !conversation.is_group && (
                          <DiaConversationStarter
                            otherUserId={conversation.other_user_id}
                            lastMessageAt={conversation.last_message_at || null}
                            conversationId={conversation.conversation_id}
                            onClick={() => onSelectConversation(conversation.conversation_id)}
                          />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Inline accept / ignore actions for the Requests tab */}
                  {activeTab === 'requests' && (
                    <div className="flex items-center gap-2 px-4 pb-3 -mt-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={actioningIds.has(conversation.conversation_id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRequest(conversation.conversation_id);
                        }}
                        aria-label={`Accept message request from ${conversation.other_user_full_name}`}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIgnoreRequest(conversation.conversation_id);
                        }}
                        aria-label={`Ignore message request from ${conversation.other_user_full_name}`}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Ignore
                      </Button>
                    </div>
                  )}

                  {/* Inline action for Spam tab */}
                  {activeTab === 'spam' && (
                    <div className="flex items-center gap-2 px-4 pb-3 -mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotSpam(conversation.conversation_id);
                        }}
                        aria-label={`Move conversation with ${conversation.other_user_full_name} back to Primary`}
                      >
                        Not spam
                      </Button>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="z-[9999] bg-popover border border-border shadow-lg"
                    >
                      {isArchived ? (
                        // Archived conversation menu
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchive(conversation.conversation_id);
                          }}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      ) : (
                        // Regular conversation menu
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(
                                conversation.conversation_id,
                                conversation.is_pinned
                              );
                            }}
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            {conversation.is_pinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMute(
                                conversation.conversation_id,
                                conversation.is_muted
                              );
                            }}
                          >
                            <BellOff className="h-4 w-4 mr-2" />
                            {conversation.is_muted ? 'Unmute' : 'Mute'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(conversation.conversation_id);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conversation.conversation_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
      <MessageSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Card>
  );
};

export default ConversationListPanel;

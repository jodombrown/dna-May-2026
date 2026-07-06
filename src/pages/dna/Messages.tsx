import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMobile } from '@/hooks/useMobile';
import TwoColumnLayout from '@/layouts/TwoColumnLayout';
import ConversationListPanel from '@/components/messaging/ConversationListPanel';
import { ChatThread } from '@/components/messaging/inbox/ChatThread';
import EmptyConversationState from '@/components/messaging/EmptyConversationState';
import { CreateGroupDrawer } from '@/components/messaging/CreateGroupDrawer';
import { LayoutTransitionLoader } from '@/components/LayoutTransitionLoader';
import { useHeaderVisibility } from '@/hooks/useHeaderVisibility';
import { useInboxRealtime } from '@/hooks/messaging/useInboxRealtime';
import { useAuth } from '@/contexts/AuthContext';
import type { ConversationListItem } from '@/types/messaging';

import MessagesBreadcrumb from '@/components/messaging/MessagesBreadcrumb';
import { OfflineQueueBanner } from '@/components/messaging/OfflineQueueBanner';
import { RouteErrorPanel } from '@/components/RouteErrorPanel';
import { InboxLiveRegion } from '@/components/messaging/InboxLiveRegion';
import { useInboxKeyboardShortcuts } from '@/hooks/messaging/useInboxKeyboardShortcuts';
import { useBlockedUserIds } from '@/hooks/messaging/useBlockedUserIds';
import { archiveConversation, muteConversation } from '@/services/messageConversationActions';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';
/**
 * DnaMessages - Canonical Messages route (/dna/messages)
 *
 * MESSAGES_MODE: Two-column layout (35% list / 65% thread)
 * Replaces legacy /dna/connect/messages route
 * Part of ADA v2 (Adaptive Dashboard Architecture)
 */
const DnaMessages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { isMobile } = useMobile();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  useInboxRealtime(user?.id ?? null);

  // Resolve initial conversation: route param takes precedence, then ?thread= query param
  const threadParam = searchParams.get('thread');
  const initialConversationId = conversationId || threadParam || null;

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);

  // Deep link: when ?thread= is present, select that thread and clean the URL
  useEffect(() => {
    if (threadParam) {
      setSelectedConversationId(threadParam);
      // Remove ?thread= from URL without adding a history entry
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [threadParam]);

  // Get header visibility controls
  const { hideHeader, showHeader } = useHeaderVisibility();

  // Manage header visibility based on mobile chat state
  useEffect(() => {
    if (isMobile && selectedConversationId) {
      hideHeader();
    } else {
      showHeader();
    }

    // Cleanup: show header when leaving the page
    return () => {
      showHeader();
    };
  }, [isMobile, selectedConversationId, hideHeader, showHeader]);

  // Refresh helper: invalidate the unified inbox + legacy keys still in use elsewhere
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox'] });
    queryClient.invalidateQueries({ queryKey: ['inbox-archived'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['conversations-archived'] });
    queryClient.invalidateQueries({ queryKey: ['group-conversations'] });
  };

  // Unified inbox: 1:1 + group conversations in a single RPC (kills the N+1).
  const { data: rawConversations = [], isLoading } = useQuery<ConversationListItem[]>({
    queryKey: ['inbox'],
    queryFn: () => messageService.getInbox(),
  });

  // Archived inbox (shown under the Archived tab)
  const { data: rawArchivedConversations = [] } = useQuery<ConversationListItem[]>({
    queryKey: ['inbox-archived'],
    queryFn: () => messageService.getInbox(100, 0, true),
    select: (data) => data.filter((c) => c.is_archived),
  });

  // Tier 3: hide conversations involving blocked users (groups always pass through)
  const { data: blockedIds } = useBlockedUserIds();
  const filterBlocked = (list: ConversationListItem[]) =>
    blockedIds && blockedIds.size > 0
      ? list.filter((c) => c.is_group || !blockedIds.has(c.other_user_id))
      : list;
  const conversations = filterBlocked(rawConversations);
  const archivedConversations = filterBlocked(rawArchivedConversations);

  const handleGroupCreated = (newConversationId: string) => {
    handleRefresh();
    navigate(`/dna/messages/group/${newConversationId}`);
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find((c) => c.conversation_id === id);
    if (conv?.is_group) {
      navigate(`/dna/messages/group/${id}`);
      return;
    }
    setSelectedConversationId(id);
  };

  // Tier 3 keyboard shortcuts (j/k navigate, e archive, m mute, / focus search)
  useInboxKeyboardShortcuts({
    conversations,
    selectedId: selectedConversationId,
    onSelect: handleSelectConversation,
    onArchive: async (id) => {
      const conv = conversations.find((c) => c.conversation_id === id);
      if (!conv || conv.is_group) return;
      await archiveConversation(id, !conv.is_archived);
      handleRefresh();
    },
    onMute: async (id) => {
      const conv = conversations.find((c) => c.conversation_id === id);
      if (!conv || conv.is_group) return;
      await muteConversation(id, !conv.is_muted);
      handleRefresh();
    },
    onFocusSearch: () => {
      const el = document.querySelector<HTMLInputElement>('input[data-inbox-search]');
      el?.focus();
    },
    enabled: !isMobile,
  });

  if (isLoading) {
    return <LayoutTransitionLoader message="Loading messages..." />;
  }

  const selectedConversation = conversations.find(c => c.conversation_id === selectedConversationId && !c.is_group);

  // Build otherUser object for ChatThread
  const otherUser = selectedConversation ? {
    id: selectedConversation.other_user_id,
    username: selectedConversation.other_user_username || 'user',
    full_name: selectedConversation.other_user_full_name || 'Unknown User',
    avatar_url: selectedConversation.other_user_avatar_url || '',
  } : null;

  // Mobile: Show only conversation list or thread, not both
  if (isMobile) {
    if (selectedConversationId && otherUser) {
      // WhatsApp-style: Chat takes full screen above the app shell/dock
      return (
        <div className="fixed inset-0 z-[60] h-[100dvh] overflow-hidden bg-background">
            <ChatThread
              conversationId={selectedConversationId}
              otherUser={otherUser}
              onBack={() => setSelectedConversationId(null)}
            />
        </div>
      );
    }

    // Mobile: Conversation list — flush, edge-to-edge
    return (
      <div className="min-h-screen bg-background pb-bottom-nav" style={{ paddingTop: 'var(--total-header-height, 56px)' }}>
        <InboxLiveRegion conversations={conversations} />
        <div className="w-full">
          <OfflineQueueBanner />
          <ConversationListPanel
            conversations={conversations}
            archivedConversations={archivedConversations || []}
            isLoading={isLoading}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewGroup={() => setGroupDrawerOpen(true)}
            onRefresh={handleRefresh}
          />
        </div>
        <CreateGroupDrawer
          open={groupDrawerOpen}
          onOpenChange={setGroupDrawerOpen}
          onGroupCreated={handleGroupCreated}
        />
        
      </div>
    );
  }

  // Desktop: Two-column layout
  return (
    <div className="min-h-screen bg-background pt-20">
      <InboxLiveRegion conversations={conversations} />

      <TwoColumnLayout
        leftWidth="35%"
        rightWidth="65%"
        left={
          <div className="flex flex-col h-full">
            <OfflineQueueBanner />
            <div className="flex-1 min-h-0">
              <ConversationListPanel
                conversations={conversations}
                archivedConversations={archivedConversations || []}
                isLoading={isLoading}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onNewGroup={() => setGroupDrawerOpen(true)}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        }
        right={
          selectedConversationId && otherUser ? (
            <ChatThread
              conversationId={selectedConversationId}
              otherUser={otherUser}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            <EmptyConversationState />
          )
        }
      />
      <CreateGroupDrawer
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

const DnaMessagesWithBoundary: React.FC = () => {
  const queryClient = useQueryClient();
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['conversations-archived'] });
  };
  return (
    <RouteErrorPanel surface="Messages" onRetry={handleRetry}>
      <DnaMessages />
    </RouteErrorPanel>
  );
};

export default DnaMessagesWithBoundary;

import React, { useRef, useEffect, useCallback } from 'react';
import { FeedbackMessage } from './FeedbackMessage';
import type { FeedbackMessageWithSender } from '@/types/feedback';
import { Loader2, MessageSquare } from 'lucide-react';

interface FeedbackMessageListProps {
  messages: FeedbackMessageWithSender[];
  channelId: string;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onReply: (messageId: string) => void;
  isAdmin?: boolean;
}

export function FeedbackMessageList({
  messages,
  channelId,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onReply,
  isAdmin = false,
}: FeedbackMessageListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No feedback yet</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Be the first to share your thoughts or report a bug!
        </p>
      </div>
    );
  }

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const regularMessages = messages.filter((m) => !m.is_pinned);

  return (
    <div className="h-full overflow-y-auto p-3 md:p-4 space-y-2.5 md:space-y-3">
      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            📌 Pinned
          </h3>
          {pinnedMessages.map((message) => (
            <FeedbackMessage
              key={message.id}
              message={message}
              channelId={channelId}
              isAdmin={isAdmin}
              onReply={() => onReply(message.id)}
            />
          ))}
          <div className="border-b border-border/50 my-2" />
        </div>
      )}

      {/* Regular Messages */}
      {regularMessages.map((message) => (
        <FeedbackMessage
          key={message.id}
          message={message}
          channelId={channelId}
          isAdmin={isAdmin}
          onReply={() => onReply(message.id)}
        />
      ))}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, Star } from 'lucide-react';
import { MessageAttachment } from './MessageAttachment';
import { LinkPreview } from './LinkPreview';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import { MessageActionsMenu } from './MessageActionsMenu';
import { MessageReactions } from './MessageReactions';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { QuotedMessage } from './QuotedMessage';
import { EntityReferenceCard } from './EntityReferenceCard';
import { IntroductionMessageCard } from '@/components/messaging/IntroductionMessageCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, MessageReaction } from '@/services/messageService';
import type { MessagePayload as ServiceMessagePayload } from '@/services/messageTypes';

interface AttachmentData {
  type: 'image' | 'file' | 'voice' | 'video';
  url: string;
  filename?: string;
  filesize?: number;
  mimetype?: string;
  duration?: number;
  thumbnail_url?: string;
}

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface MessagePayload {
  attachment?: AttachmentData;
  linkPreview?: LinkPreviewData;
  replyTo?: ServiceMessagePayload['replyTo'];
  entityReference?: ServiceMessagePayload['entityReference'];
}

interface ChatBubbleProps {
  message: {
    message_id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender_avatar_url: string;
    sender_full_name: string;
    is_read?: boolean;
    is_deleted?: boolean;
    edited_at?: string | null;
    forwarded_from_message_id?: string | null;
    payload?: MessagePayload;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isStarred?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onUnsend?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onToggleStar?: (messageId: string) => void;
  currentUserId?: string;
  onFocusReply?: () => void;
  /** Phase 10 - search highlight integration */
  searchQuery?: string;
  isActiveSearchMatch?: boolean;
}

/**
 * Highlight occurrences of `query` (case-insensitive) inside `text`.
 * Skips work and returns the raw string when query is empty.
 */
const renderHighlighted = (text: string, query?: string): React.ReactNode => {
  const q = (query ?? '').trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      out.push(text.slice(i));
      break;
    }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark
        key={`hl-${key++}`}
        className="bg-primary/25 text-foreground rounded-sm px-0.5"
      >
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{out}</>;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  status,
  isStarred,
  onDeleteMessage,
  onReply,
  onScrollToMessage,
  onRetry,
  onEdit,
  onUnsend,
  onForward,
  onToggleStar,
  currentUserId,
  onFocusReply,
  searchQuery,
  isActiveSearchMatch,
}) => {
  const queryClient = useQueryClient();
  
  // Auto-detect links in message content
  const { previews } = useLinkPreview(message.content || '');
  
  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Use payload link preview if available, otherwise use auto-detected
  const linkPreview = message.payload?.linkPreview || previews[0];
  const attachment = message.payload?.attachment;
  
  // Check if this is a voice message
  const isVoiceMessage = attachment?.type === 'voice' || 
    attachment?.mimetype?.startsWith('audio/') || 
    (attachment?.filename?.includes('voice-') && attachment?.type === 'file');

  // Fetch reactions for this message
  const { data: reactions = [] } = useQuery({
    queryKey: ['message-reactions', message.message_id],
    queryFn: () => messageService.getMessageReactions(message.message_id),
    staleTime: 30000,
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: (emoji: string) => messageService.addReaction(message.message_id, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', message.message_id] });
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: (emoji: string) => messageService.removeReaction(message.message_id, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', message.message_id] });
    },
  });

  // Render deleted message placeholder
  if (message.is_deleted) {
    return (
      <div className={cn(
        "flex gap-1 px-2 py-px",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {!isOwn && showAvatar && <div className="w-6 h-6" />}
        {!isOwn && !showAvatar && <div className="w-6" />}
        <div className="max-w-[85%]">
          <div className={cn(
            "rounded-lg px-2.5 py-1.5 bg-muted/50",
            isOwn ? "rounded-br-md" : "rounded-bl-md"
          )}>
            <p className="text-xs text-muted-foreground italic">
              Message deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Introduction Card if payload contains introductionCard
  const introCard = (message.payload as Record<string, unknown> | undefined)?.introductionCard as {
    introducer: { id: string; full_name: string | null; avatar_url: string | null; username: string | null; headline: string | null };
    personA: { id: string; full_name: string | null; avatar_url: string | null; username: string | null; headline: string | null };
    personB: { id: string; full_name: string | null; avatar_url: string | null; username: string | null; headline: string | null };
  } | undefined;

  if (introCard) {
    return (
      <IntroductionMessageCard
        introducer={introCard.introducer}
        personA={introCard.personA}
        personB={introCard.personB}
        message={message.content}
        currentUserId={currentUserId}
        onSayHello={onFocusReply}
      />
    );
  }

  return (
    <div className={cn(
      "group flex gap-1 px-2 py-px",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar - Compact for mobile */}
      {!isOwn && showAvatar && (
        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
          <AvatarImage src={message.sender_avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-medium">
            {message.sender_full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-6" />}

      {/* Message Actions - hover reveal */}
      <div className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        isOwn ? "order-first" : "order-last"
      )}>
        <MessageReactions
          reactions={[]}
          onAddReaction={(emoji) => addReactionMutation.mutate(emoji)}
          onRemoveReaction={(emoji) => removeReactionMutation.mutate(emoji)}
          isOwn={isOwn}
          showTriggerOnly
        />
        <MessageActionsMenu
          messageId={message.message_id}
          content={message.content}
          isOwn={isOwn}
          createdAt={message.created_at}
          isStarred={isStarred}
          onDelete={onDeleteMessage}
          onReply={onReply}
          onEdit={onEdit}
          onUnsend={onUnsend}
          onForward={onForward}
          onToggleStar={onToggleStar}
        />
      </div>

      {/* Message Bubble - DNA branded with tighter spacing */}
      <div className="flex flex-col gap-px max-w-[82%]">
        <div className={cn(
          "rounded-lg px-2.5 py-1.5 transition-shadow",
          isOwn 
            ? "bg-primary/15 dark:bg-primary/25 text-foreground rounded-br-md" 
            : "bg-card text-foreground rounded-bl-md border border-border/40 shadow-sm",
          isActiveSearchMatch && "ring-1 ring-primary/60"
        )}>
          {/* Forwarded indicator */}
          {message.forwarded_from_message_id && (
            <p className="text-[10px] italic text-muted-foreground mb-0.5">
              ↪ Forwarded
            </p>
          )}
          {/* Quoted reply message */}
          {message.payload?.replyTo && (
            <QuotedMessage
              replyTo={message.payload.replyTo}
              isOwn={isOwn}
              onClickQuote={onScrollToMessage
                ? () => onScrollToMessage(message.payload!.replyTo!.messageId)
                : undefined}
              searchQuery={searchQuery}
            />
          )}

          {/* Entity Reference Card */}
          {message.payload?.entityReference && (
            <EntityReferenceCard
              entityReference={message.payload.entityReference}
              isOwn={isOwn}
            />
          )}

          {/* Voice Message Player */}
          {isVoiceMessage && attachment?.url ? (
            <VoiceMessagePlayer url={attachment.url} duration={attachment.duration} isOwn={isOwn} />
          ) : (
            <>
              {/* Text content */}
              {message.content && !message.payload?.entityReference && (
                <p className="text-[13px] leading-snug whitespace-pre-wrap break-words">
                  {renderHighlighted(
                    linkPreview && linkPreview.url
                      ? message.content.replace(linkPreview.url, '').trim()
                      : message.content,
                    searchQuery,
                  )}
                </p>
              )}

              {/* Regular Attachment */}
              {attachment && !isVoiceMessage && (
                <MessageAttachment attachment={attachment} isOwn={isOwn} searchQuery={searchQuery} />
              )}

              {/* Link Preview */}
              {!attachment && linkPreview && linkPreview.url && !message.payload?.entityReference && (
                <LinkPreview preview={linkPreview} isOwn={isOwn} />
              )}
            </>
          )}

          {/* Timestamp and read receipt - inline compact */}
          <div className="flex items-center gap-0.5 mt-0.5 justify-end">
            {isStarred && <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" aria-label="Starred" />}
            {message.edited_at && (
              <span className="text-[9px] text-muted-foreground/60 italic">edited</span>
            )}
            <span className="text-[9px] text-muted-foreground/60">
              {formatTime(message.created_at)}
            </span>
            {isOwn && <StatusTick status={status ?? (message.is_read ? 'read' : 'sent')} onRetry={onRetry ? () => onRetry(message.message_id) : undefined} />}
          </div>
        </div>

        {/* Reactions below message */}
        {reactions.length > 0 && (
          <MessageReactions
            reactions={reactions}
            onAddReaction={(emoji) => addReactionMutation.mutate(emoji)}
            onRemoveReaction={(emoji) => removeReactionMutation.mutate(emoji)}
            isOwn={isOwn}
          />
        )}
      </div>
    </div>
  );
};

const StatusTick: React.FC<{ status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'; onRetry?: () => void }> = ({ status, onRetry }) => {
  if (status === 'sending') return <Clock className="h-3 w-3 text-muted-foreground/50" aria-label="Sending" />;
  if (status === 'failed') return (
    <button onClick={onRetry} className="inline-flex" aria-label="Failed to send. Tap to retry">
      <AlertCircle className="h-3 w-3 text-destructive" />
    </button>
  );
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-primary" aria-label="Read" />;
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-muted-foreground/60" aria-label="Delivered" />;
  return <Check className="h-3 w-3 text-muted-foreground/50" aria-label="Sent" />;
};

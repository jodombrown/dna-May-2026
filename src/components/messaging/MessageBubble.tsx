import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageWithSender } from '@/services/messageService';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { EntityReferenceCard } from '@/components/messaging/inbox/EntityReferenceCard';
import { IntroductionMessageCard } from '@/components/messaging/IntroductionMessageCard';
import type { EntityReferenceData } from '@/services/messageTypes';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showReadReceipt?: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  currentUserId?: string;
  onFocusReply?: () => void;
}

/**
 * Apple Messages-inspired bubble design
 * - iMessage blue for sent, gray for received
 * - Rounded pill shapes with tail effect
 * - Compact timestamp display
 */
export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  showReadReceipt = false,
  isRead = false,
  isDelivered = false,
  currentUserId,
  onFocusReply,
}: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const messageDate = new Date(message.created_at);

  // Render deleted message
  if (message.is_deleted) {
    return (
      <div className={cn('flex gap-2 mb-2', isOwnMessage && 'flex-row-reverse')}>
        {showAvatar && <div className="w-7" />}
        <div className="max-w-[75%] px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground italic">
          <p className="text-sm">This message was deleted</p>
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

  // Render read receipt indicator
  const renderReadReceipt = () => {
    if (!showReadReceipt || !isOwnMessage) return null;

    if (isRead) {
      return (
        <span className="flex items-center text-primary" title="Read">
          <CheckCheck className="h-3 w-3" />
        </span>
      );
    } else if (isDelivered) {
      return (
        <span className="flex items-center text-muted-foreground" title="Delivered">
          <CheckCheck className="h-3 w-3" />
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-muted-foreground" title="Sent">
          <Check className="h-3 w-3" />
        </span>
      );
    }
  };

  return (
    <div className={cn('flex gap-2 mb-1', isOwnMessage && 'flex-row-reverse')}>
      {/* Avatar - only for received messages */}
      {!isOwnMessage && showAvatar ? (
        <Avatar className="h-7 w-7 flex-shrink-0 mt-auto">
          <AvatarImage
            src={message.sender_avatar_url || ''}
            alt={message.sender_full_name}
          />
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
            {getInitials(message.sender_full_name || '?')}
          </AvatarFallback>
        </Avatar>
      ) : !isOwnMessage ? (
        <div className="w-7 flex-shrink-0" />
      ) : null}

      <div
        className={cn(
          'flex flex-col max-w-[75%]',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2 rounded-lg break-words',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {/* Entity Reference Card — if this message shares an entity */}
          {message.payload?.entityReference && (
            <EntityReferenceCard
              entityReference={message.payload.entityReference as EntityReferenceData}
              isOwn={isOwnMessage}
            />
          )}

          {/* Text content — hide when the message is entity-only (empty content) */}
          {message.content && !message.payload?.entityReference && (
            <p className="text-[15px] leading-snug whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[11px] text-muted-foreground">
            {formatTime(messageDate)}
          </span>
          {renderReadReceipt()}
        </div>
      </div>
    </div>
  );
}

/**
 * Message group separator with date - Apple style
 */
export const MessageDateSeparator: React.FC<{ date: Date }> = ({ date }) => {
  let label: string;
  
  if (isToday(date)) {
    label = 'Today';
  } else if (isYesterday(date)) {
    label = 'Yesterday';
  } else {
    label = format(date, 'EEEE, MMM d');
  }

  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full">
        {label}
      </span>
    </div>
  );
};

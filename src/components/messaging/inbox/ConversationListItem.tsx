import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Pin, BellOff, Archive } from 'lucide-react';

interface ConversationListItemProps {
  conversation: {
    conversation_id: string;
    other_user_id: string;
    other_user_username: string;
    other_user_full_name: string;
    other_user_avatar_url: string;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
    is_pinned?: boolean;
    is_muted?: boolean;
    is_archived?: boolean;
  };
  isSelected: boolean;
  onClick: () => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const hasUnread = conversation.unread_count > 0;
  
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
    } catch {
      return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 transition-colors border-b border-border/60",
        "hover:bg-muted/50 focus:outline-none focus-visible:bg-muted/60",
        isSelected && "bg-primary/10",
      )}
    >
      {/* Avatar — 44px WhatsApp-style */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={conversation.other_user_avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {conversation.other_user_full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {conversation.is_pinned && (
              <Pin className="h-3 w-3 text-primary flex-shrink-0" />
            )}
            <span className={cn(
              "truncate text-[15px] leading-[1.25]",
              hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
            )}>
              {conversation.other_user_full_name || 'Unknown User'}
            </span>
            {conversation.is_muted && (
              <BellOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            {conversation.is_archived && (
              <Archive className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <span className={cn(
            "text-[12px] leading-[1.25] flex-shrink-0",
            hasUnread ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            "text-[14px] leading-[1.35] truncate",
            hasUnread ? "text-foreground" : "text-muted-foreground"
          )}>
            {conversation.last_message_content || 'No messages yet'}
          </p>
          {hasUnread && (
            <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center text-[11px] rounded-full px-1.5">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};
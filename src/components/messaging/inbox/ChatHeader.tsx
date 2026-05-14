import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ConversationActionsMenu } from './ConversationActionsMenu';
import { useUserPresence } from '@/hooks/messaging/useUserPresence';
import { formatDistanceToNowStrict } from 'date-fns';

interface ChatHeaderProps {
  otherUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  conversationId: string;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  onBack: () => void;
  onMuteToggle?: () => void;
  onPinToggle?: () => void;
  onArchiveToggle?: () => void;
  onDeleteConversation?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  otherUser, 
  conversationId,
  isMuted = false,
  isPinned = false,
  isArchived = false,
  onBack,
  onMuteToggle,
  onPinToggle,
  onArchiveToggle,
  onDeleteConversation,
}) => {
  const navigate = useNavigate();
  const { online, lastSeenAt, showPresence } = useUserPresence(otherUser.id);

  const subtitle = !showPresence
    ? 'tap for info'
    : online
      ? 'Active now'
      : lastSeenAt
        ? `Last seen ${formatDistanceToNowStrict(new Date(lastSeenAt), { addSuffix: true })}`
        : 'tap for info';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-b border-primary/20 bg-gradient-to-r from-primary to-primary/90 flex-shrink-0">
      {/* Back Button */}
      <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-primary-foreground hover:bg-white/15">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* User Info - Tap to view profile */}
      <button 
        onClick={() => navigate(`/dna/${otherUser.username}`)}
        className="flex items-center gap-2.5 flex-1 min-w-0"
      >
        <div className="relative">
          <Avatar className="h-9 w-9 border-2 border-white/25 shadow-sm">
            <AvatarImage src={otherUser.avatar_url} />
            <AvatarFallback className="bg-white/20 text-primary-foreground font-semibold text-sm">
              {otherUser.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          {online && (
            <span
              aria-label="Online"
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary"
            />
          )}
        </div>
        <div className="text-left min-w-0 flex-1">
          <h2 className="font-semibold text-primary-foreground text-sm leading-tight truncate">
            {otherUser.full_name}
          </h2>
          <p className="text-[11px] text-primary-foreground/70 truncate">
            {subtitle}
          </p>
        </div>
      </button>

      {/* Actions Menu */}
      <div className="[&_button]:text-primary-foreground [&_button:hover]:bg-white/15">
        <ConversationActionsMenu
          otherUser={otherUser}
          conversationId={conversationId}
          isMuted={isMuted}
          isPinned={isPinned}
          isArchived={isArchived}
          onMuteToggle={onMuteToggle}
          onPinToggle={onPinToggle}
          onArchiveToggle={onArchiveToggle}
          onDeleteConversation={onDeleteConversation}
        />
      </div>
    </div>
  );
};
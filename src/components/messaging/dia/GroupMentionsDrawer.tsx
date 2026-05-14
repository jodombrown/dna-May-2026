import React, { useMemo } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { AtSign } from 'lucide-react';
import { format } from 'date-fns';
import type { GroupMessage, ConversationParticipant } from '@/types/groupMessaging';

interface GroupMentionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: GroupMessage[];
  participants: ConversationParticipant[];
  currentUserId?: string;
  currentUserFullName?: string | null;
  onJumpToMessage: (messageId: string) => void;
}

/**
 * Phase 14.5 - Group @mention digest.
 * Lists messages in the current group thread that mention me, newest first.
 * Mentions are detected client-side from the rendered "@<full name>" pattern
 * the composer inserts (no schema needed).
 */
export const GroupMentionsDrawer: React.FC<GroupMentionsDrawerProps> = ({
  open,
  onOpenChange,
  messages,
  participants,
  currentUserId,
  currentUserFullName,
  onJumpToMessage,
}) => {
  const myName = useMemo(() => {
    if (currentUserFullName) return currentUserFullName;
    const me = participants.find((p) => p.user_id === currentUserId);
    return me?.full_name ?? null;
  }, [participants, currentUserId, currentUserFullName]);

  const mentionedMessages = useMemo(() => {
    if (!myName) return [];
    const needle = `@${myName}`.toLowerCase();
    return messages
      .filter((m) => {
        if (m.message_type === 'system') return false;
        if (m.sender_id === currentUserId) return false;
        const c = (m.content || '').toLowerCase();
        return c.includes(needle);
      })
      .slice()
      .reverse();
  }, [messages, myName, currentUserId]);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md">
      <ResponsiveModalHeader>
        <div className="flex items-start gap-2">
          <AtSign className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <ResponsiveModalTitle>Mentions of you</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {mentionedMessages.length > 0
                ? `${mentionedMessages.length} message${mentionedMessages.length === 1 ? '' : 's'} mention you in this group.`
                : 'Nobody has mentioned you here yet.'}
            </ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
        {mentionedMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            When teammates use <span className="font-medium">@{myName ?? 'your name'}</span>, the messages will land here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {mentionedMessages.map((m) => (
              <li key={m.message_id}>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToMessage(m.message_id);
                    onOpenChange(false);
                  }}
                  className="w-full text-left rounded-md border border-border bg-card px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {m.sender_full_name || 'Member'}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {format(new Date(m.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 leading-snug">
                    {m.content || '(no text)'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default GroupMentionsDrawer;

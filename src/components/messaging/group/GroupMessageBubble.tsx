/**
 * GroupMessageBubble - Message bubble with sender attribution for group chats
 *
 * Phase 5 parity: edit, unsend, forward, star (alongside reply + delete).
 * Shows forwarded badge, edited timestamp, and star indicator.
 */

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Clock, AlertCircle, Check, Forward as ForwardIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageMediaGrid } from './MessageMediaGrid';
import { DocumentChip } from './DocumentChip';
import { AudioBubble } from './AudioBubble';
import { GroupReadReceipts } from './GroupReadReceipts';
import { MessageActionsMenu } from '../inbox/MessageActionsMenu';
import type { GroupMessage, ConversationParticipant, MediaItem } from '@/types/groupMessaging';

interface GroupMessageBubbleProps {
  message: GroupMessage;
  isOwn: boolean;
  showSenderInfo: boolean;
  isLastInRun?: boolean;
  participants?: ConversationParticipant[];
  onReply?: (message: GroupMessage, media?: MediaItem, mediaIndex?: number) => void;
  onRetry?: (message: GroupMessage) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<void> | void;
  onUnsend?: (messageId: string) => Promise<void> | void;
  onForward?: (messageId: string, preview: string) => void;
  onToggleStar?: (messageId: string, starred: boolean) => Promise<void> | void;
  isStarred?: boolean;
  canDownload?: boolean;
  onJumpToMessage?: (messageId: string) => void;
  isHighlighted?: boolean;
}

export function GroupMessageBubble({
  message,
  isOwn,
  showSenderInfo,
  isLastInRun = false,
  participants = [],
  onReply,
  onRetry,
  onEdit,
  onUnsend,
  onForward,
  onToggleStar,
  isStarred = false,
  canDownload = true,
  onJumpToMessage,
  isHighlighted = false,
}: GroupMessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content || '');

  const initials = message.sender_full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mediaList: MediaItem[] = message.media_urls || [];
  const visuals = mediaList.filter((m) => m.type === 'image' || m.type === 'video');
  const audios = mediaList.filter((m) => m.type === 'audio');
  const documents = mediaList.filter((m) => m.type === 'document');
  const pdfDocs = documents.filter(
    (d) => d.mimeType === 'application/pdf' || /\.pdf$/i.test(d.name),
  );
  const isForwarded = !!message.forwarded_from_message_id;
  const isEdited = !!message.edited_at;

  if (message.is_deleted) {
    return (
      <div className={cn('flex px-4 py-0.5', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%] px-3 py-1.5 rounded-lg bg-muted/50 italic text-xs text-muted-foreground">
          This message was deleted
        </div>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditValue(message.content || '');
    setIsEditing(true);
  };

  const handleCommitEdit = async () => {
    const next = editValue.trim();
    if (!next || next === message.content) {
      setIsEditing(false);
      return;
    }
    try {
      await onEdit?.(message.message_id, next);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn('flex px-4', isOwn ? 'justify-end' : 'justify-start', showSenderInfo ? 'mt-3' : 'mt-0.5')}>
      {!isOwn && (
        <div className="w-8 flex-shrink-0 mr-2">
          {showSenderInfo ? (
            <Avatar className="h-7 w-7">
              <AvatarImage src={message.sender_avatar_url} />
              <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      <div className={cn('max-w-[75%] min-w-0', isOwn ? 'items-end' : 'items-start')}>
        {showSenderInfo && !isOwn && (
          <p className="text-xs font-medium text-muted-foreground mb-0.5 px-1">
            {message.sender_full_name}
          </p>
        )}

        <div
          className={cn(
            'relative px-3 py-2 text-sm break-words group transition-shadow',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm'
              : 'bg-muted rounded-lg rounded-bl-sm',
            isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          )}
        >
          {/* Forwarded label */}
          {isForwarded && (
            <div
              className={cn(
                'flex items-center gap-1 text-[10px] italic mb-1',
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
              )}
            >
              <ForwardIcon className="h-2.5 w-2.5" />
              Forwarded
            </div>
          )}

          {/* Reply quote */}
          {(() => {
            if (!message.reply_to_id) return null;
            const payload = (message.payload || {}) as {
              reply_author?: string;
              reply_preview?: string;
              reply_media?: MediaItem;
            };
            const author = payload.reply_author || 'Member';
            const preview = payload.reply_preview || '';
            const media = payload.reply_media;
            return (
              <button
                type="button"
                onClick={() => onJumpToMessage?.(message.reply_to_id!)}
                className={cn(
                  'mb-1.5 flex w-full items-stretch gap-2 rounded-md border-l-2 p-1.5 text-left text-xs transition-colors',
                  isOwn
                    ? 'border-primary-foreground/60 bg-primary-foreground/10 hover:bg-primary-foreground/20'
                    : 'border-primary bg-background/60 hover:bg-background',
                )}
                aria-label={`Jump to message from ${author}`}
              >
                {media && (media.type === 'image' || media.type === 'video') && (
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                    <img
                      src={media.posterUrl || media.url}
                      alt={media.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn('font-semibold', isOwn ? 'text-primary-foreground' : 'text-primary')}>
                    {author}
                  </p>
                  <p className={cn('truncate', isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {preview || (media ? media.name : 'Attachment')}
                  </p>
                </div>
              </button>
            );
          })()}

          {/* Text or inline edit */}
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <Input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleCommitEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                className="h-8 text-sm bg-background text-foreground"
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => void handleCommitEdit()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            message.content && <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {visuals.length > 0 && (
            <MessageMediaGrid
              media={visuals}
              extraLightboxItems={pdfDocs}
              isOwn={isOwn}
              canDownload={canDownload}
              onReplyToMedia={
                onReply ? (item, idx) => onReply(message, item, idx) : undefined
              }
            />
          )}

          {audios.map((a, i) => (
            <AudioBubble key={`audio-${i}`} item={a} isOwn={isOwn} canDownload={canDownload} />
          ))}

          {documents.map((doc, i) => (
            <DocumentChip key={`doc-${i}`} doc={doc} isOwn={isOwn} canDownload={canDownload} />
          ))}

          {/* Footer: timestamp, edited, star, status */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start',
            )}
          >
            {isStarred && (
              <Star
                className={cn(
                  'h-3 w-3 fill-current',
                  isOwn ? 'text-amber-300' : 'text-amber-500',
                )}
              />
            )}
            {isEdited && (
              <span
                className={cn(
                  'text-[10px] italic',
                  isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
                )}
              >
                edited
              </span>
            )}
            <span
              className={cn(
                'text-[10px]',
                isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
              )}
            >
              {format(new Date(message.created_at), 'HH:mm')}
            </span>

            {isOwn && message._status === 'pending' && (
              <Clock className="h-3 w-3 text-primary-foreground/50" />
            )}
            {isOwn && (message._status === 'sent' || !message._status) && (
              <Check className="h-3 w-3 text-primary-foreground/60" />
            )}
          </div>

          {/* Hover actions menu */}
          {!isEditing && !message._status && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 flex items-center gap-1',
                isOwn ? '-left-10' : '-right-10',
              )}
            >
              <MessageActionsMenu
                messageId={message.message_id}
                content={message.content || ''}
                isOwn={isOwn}
                createdAt={message.created_at}
                isStarred={isStarred}
                onReply={onReply ? () => onReply(message) : undefined}
                onForward={
                  onForward
                    ? (id) =>
                        onForward(
                          id,
                          message.content?.slice(0, 140) ||
                            (mediaList[0]?.name ?? 'Attachment'),
                        )
                    : undefined
                }
                onEdit={onEdit && message.content ? () => handleStartEdit() : undefined}
                onUnsend={onUnsend ? (id) => void onUnsend(id) : undefined}
                onToggleStar={
                  onToggleStar ? (id) => void onToggleStar(id, !isStarred) : undefined
                }
              />
            </div>
          )}
        </div>

        {isOwn && isLastInRun && !message._status && participants.length > 0 && (
          <GroupReadReceipts
            messageCreatedAt={message.created_at}
            senderId={message.sender_id}
            participants={participants}
          />
        )}

        {message._status === 'failed' && (
          <button
            onClick={() => onRetry?.(message)}
            className="flex items-center gap-1 mt-1 text-destructive text-xs hover:underline"
          >
            <AlertCircle className="h-3 w-3" />
            Failed to send. Tap to retry.
          </button>
        )}
      </div>
    </div>
  );
}

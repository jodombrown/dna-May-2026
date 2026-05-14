import React from 'react';
import { X, Reply, Image as ImageIcon, FileText, Mic, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { ReplyToData } from '@/services/messageTypes';

interface ReplyPreviewBarProps {
  replyingTo: ReplyToData;
  onCancel: () => void;
}

/**
 * Phase 10 - rich quoted preview shown above the composer.
 * Renders sender, relative timestamp, content snippet, and a small media
 * thumbnail when the source message had an attachment or link preview.
 */
export const ReplyPreviewBar: React.FC<ReplyPreviewBarProps> = ({ replyingTo, onCancel }) => {
  const { senderName, content, createdAt, attachment, linkPreview } = replyingTo;

  const truncatedContent = (() => {
    if (content && content.length > 0) {
      return content.length > 120 ? `${content.slice(0, 120)}...` : content;
    }
    if (attachment?.type === 'image') return 'Photo';
    if (attachment?.type === 'voice') return 'Voice message';
    if (attachment?.type === 'file') return attachment.filename || 'Attachment';
    if (linkPreview?.title) return linkPreview.title;
    return 'Attachment';
  })();

  const timeLabel = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : null;

  const thumb = (() => {
    if (attachment?.type === 'image' && attachment.url) {
      return (
        <img
          src={attachment.url}
          alt=""
          className="h-9 w-9 rounded object-cover flex-shrink-0"
        />
      );
    }
    if (linkPreview?.image) {
      return (
        <img
          src={linkPreview.image}
          alt=""
          className="h-9 w-9 rounded object-cover flex-shrink-0"
        />
      );
    }
    if (attachment?.type === 'voice') {
      return (
        <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Mic className="h-4 w-4 text-primary" />
        </div>
      );
    }
    if (attachment?.type === 'file') {
      return (
        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }
    if (linkPreview?.url) {
      return (
        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="px-2.5 pt-2">
      <div className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2',
        'bg-muted/60 border-l-[3px] border-l-primary',
      )}>
        <Reply className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex items-start gap-2">
          {thumb}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                Replying to {senderName}
              </p>
              {timeLabel && (
                <span className="text-[11px] text-muted-foreground/80 leading-tight">
                  {timeLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {attachment?.type === 'image' && content ? null : null}
              {truncatedContent}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-0.5 rounded hover:bg-muted-foreground/10 flex-shrink-0"
          aria-label="Cancel reply"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

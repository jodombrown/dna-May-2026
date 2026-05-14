import React from 'react';
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReplyToData } from '@/services/messageTypes';

interface QuotedMessageProps {
  replyTo: ReplyToData;
  isOwn: boolean;
  onClickQuote?: () => void;
  /** Phase 11 - search highlight integration */
  searchQuery?: string;
}

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
      <mark key={`hl-${key++}`} className="bg-primary/25 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{out}</>;
};

export const QuotedMessage: React.FC<QuotedMessageProps> = ({
  replyTo,
  isOwn,
  onClickQuote,
  searchQuery,
}) => {
  const truncatedContent = replyTo.content.length > 80
    ? `${replyTo.content.slice(0, 80)}...`
    : replyTo.content;

  const q = (searchQuery ?? '').trim().toLowerCase();
  const isMatchedQuote = !!q && (
    replyTo.content?.toLowerCase().includes(q) ||
    replyTo.senderName?.toLowerCase().includes(q)
  );

  return (
    <button
      onClick={onClickQuote}
      className={cn(
        "flex items-start gap-1.5 rounded-lg px-2 py-1.5 mb-1 w-full text-left",
        "border-l-[3px] transition-colors",
        isOwn
          ? "bg-primary/5 border-l-primary/40 hover:bg-primary/10"
          : "bg-muted/40 border-l-muted-foreground/30 hover:bg-muted/60",
        isMatchedQuote && "ring-1 ring-primary/50",
      )}
      type="button"
    >
      <Reply className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground truncate">
          {renderHighlighted(replyTo.senderName, searchQuery)}
        </p>
        <p className="text-[11px] text-muted-foreground/80 truncate">
          {truncatedContent
            ? renderHighlighted(truncatedContent, searchQuery)
            : 'Attachment'}
        </p>
      </div>
    </button>
  );
};

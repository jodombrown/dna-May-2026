import React from 'react';
import { CheckSquare, Calendar, StickyNote, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ThreadActionItem } from '@/hooks/messaging/useThreadSummary';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';

interface ActionItemChipProps {
  item: ThreadActionItem;
  conversationId: string;
  onDismiss: () => void;
}

/**
 * Phase 12.3 - Action item chip surfaced inside the Catch-Me-Up drawer.
 * Routes to Collaborate (task) or Convene (event) composers with a prefilled
 * title and a back-link to the source conversation.
 */
export const ActionItemChip: React.FC<ActionItemChipProps> = ({
  item,
  conversationId,
  onDismiss,
}) => {
  const navigate = useNavigate();

  const handlePrimary = () => {
    logDiaMessagingEvent({
      conversationId,
      eventType: 'action_item_clicked',
      metadata: { kind: item.kind, title: item.title },
    });
    const params = new URLSearchParams({
      title: item.title,
      sourceConversationId: conversationId,
      sourceContext: item.context,
    });
    if (item.kind === 'event') {
      navigate(`/dna/convene/create?${params.toString()}`);
    } else if (item.kind === 'task') {
      navigate(`/dna/collaborate/tasks/new?${params.toString()}`);
    } else {
      navigate(`/dna/convey/compose?${params.toString()}`);
    }
  };

  const Icon = item.kind === 'event' ? Calendar : item.kind === 'note' ? StickyNote : CheckSquare;
  const primaryLabel =
    item.kind === 'event'
      ? 'Schedule in Convene'
      : item.kind === 'note'
        ? 'Save to Convey'
        : 'Add to Collaborate';

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-3',
        'flex flex-col gap-2',
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{item.title}</p>
          {item.context && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.context}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss action"
          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrimary}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-medium px-3 h-9 min-h-[36px] hover:bg-primary/90"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
};

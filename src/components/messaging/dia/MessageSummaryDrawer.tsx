import React, { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { useThreadSummary, type ThreadActionItem } from '@/hooks/messaging/useThreadSummary';
import { ActionItemChip } from './ActionItemChip';
import { DiaFeedbackBar } from './DiaFeedbackBar';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';
import { format } from 'date-fns';

interface MessageSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  /** Phase 14 - when set, only summarise messages newer than this id. */
  sinceMessageId?: string | null;
  /** Phase 14 - audience name (e.g. "Ama" for per-recipient framing). */
  audienceName?: string | null;
}

/**
 * Phase 12.2 / 12.3 / 14 - "Catch me up" drawer.
 * Pulls a server-cached structured summary of the thread (or per-recipient view),
 * with manual refresh and inline action items.
 */
export const MessageSummaryDrawer: React.FC<MessageSummaryDrawerProps> = ({
  open,
  onOpenChange,
  conversationId,
  sinceMessageId = null,
  audienceName = null,
}) => {
  const summary = useThreadSummary(conversationId, open, { sinceMessageId, audienceName });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) setDismissed(new Set());
  }, [open]);

  const items: ThreadActionItem[] = summary.data?.actionItems ?? [];
  const visibleItems = items.filter((it) => !dismissed.has(it.title));

  const isLoading = summary.isLoading || summary.refresh.isPending;
  const queryErr = summary.error
    ? summary.error instanceof Error ? summary.error.message : 'Could not load summary'
    : null;
  const refreshErr = summary.refresh.error
    ? summary.refresh.error instanceof Error ? summary.refresh.error.message : null
    : null;
  const errorMsg = refreshErr ?? queryErr;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <div className="flex items-start gap-2">
          <MateMasie className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <ResponsiveModalTitle>Catch me up</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              DIA reads the last 24 hours of this thread and surfaces what matters.
            </ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading the conversation...
          </div>
        )}

        {!isLoading && errorMsg && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1 text-sm text-foreground">
              <p className="font-medium">DIA could not summarise this thread.</p>
              <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {!isLoading && !errorMsg && summary.data && (
          <>
            <div>
              <p className="text-sm font-medium text-foreground leading-snug">
                {summary.data.headline}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Generated {format(new Date(summary.data.generatedAt), 'h:mm a')}
              </p>
            </div>

            {summary.data.bullets.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  Key points
                </p>
                <ul className="space-y-1.5">
                  {summary.data.bullets.map((b, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-primary mt-1.5 inline-block h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="flex-1 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.data.openQuestions.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  Open questions
                </p>
                <ul className="space-y-1.5">
                  {summary.data.openQuestions.map((q, i) => (
                    <li key={i} className="text-sm text-foreground italic leading-snug">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {visibleItems.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  Actions
                </p>
                <div className="space-y-2">
                  {visibleItems.map((it, i) => (
                    <ActionItemChip
                      key={`${it.title}-${i}`}
                      item={it}
                      conversationId={conversationId}
                      onDismiss={() =>
                        setDismissed((prev) => {
                          const next = new Set(prev);
                          next.add(it.title);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {summary.data.bullets.length === 0 && visibleItems.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nothing new worth flagging.
              </p>
            )}

            <DiaFeedbackBar
              conversationId={conversationId}
              surface="summary"
              className="pt-1"
            />
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logDiaMessagingEvent({ conversationId, eventType: 'summary_refreshed' });
            summary.refresh.mutate();
          }}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="ml-auto"
        >
          Close
        </Button>
      </div>
    </ResponsiveModal>
  );
};

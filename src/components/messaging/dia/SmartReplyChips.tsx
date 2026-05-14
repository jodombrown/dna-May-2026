import React from 'react';
import { Loader2 } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { cn } from '@/lib/utils';
import { DiaFeedbackBar } from './DiaFeedbackBar';

interface SmartReplyChipsProps {
  suggestions: string[];
  isLoading: boolean;
  onPick: (text: string) => void;
  conversationId?: string;
  refId?: string | null;
}

/**
 * Phase 12.1 - DIA smart reply chip strip rendered above the composer.
 * Tapping a chip inserts text into the composer; nothing is auto-sent.
 */
export const SmartReplyChips: React.FC<SmartReplyChipsProps> = ({
  suggestions,
  isLoading,
  onPick,
  conversationId,
  refId,
}) => {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-t border-border bg-background/80 px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <MateMasie className="h-3 w-3 text-primary" />
        <span>DIA suggestions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {isLoading ? (
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground py-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Drafting replies...
          </div>
        ) : (
          suggestions.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onPick(text)}
              className={cn(
                'inline-flex items-center max-w-full rounded-full border border-border',
                'bg-card hover:bg-muted/60 hover:border-primary/40',
                'px-3 py-1.5 text-[13px] leading-tight text-foreground',
                'transition-colors min-h-[36px] truncate',
              )}
              title={text}
            >
              <span className="truncate">{text}</span>
            </button>
          ))
        )}
      </div>
      {!isLoading && suggestions.length > 0 && conversationId && (
        <div className="mt-1.5">
          <DiaFeedbackBar
            conversationId={conversationId}
            surface="smart_reply"
            refId={refId ?? undefined}
          />
        </div>
      )}
    </div>
  );
};

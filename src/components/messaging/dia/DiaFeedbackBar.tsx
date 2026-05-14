import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitDiaFeedback, type SubmitDiaFeedbackInput } from '@/services/diaMessagingTelemetry';

interface DiaFeedbackBarProps {
  conversationId: string;
  surface: SubmitDiaFeedbackInput['surface'];
  refId?: string;
  className?: string;
  label?: string;
}

/**
 * Phase 13 - thumbs feedback strip for DIA messaging surfaces.
 * One-shot: hides itself once a vote is recorded.
 */
export const DiaFeedbackBar: React.FC<DiaFeedbackBarProps> = ({
  conversationId,
  surface,
  refId,
  className,
  label = 'Was this helpful?',
}) => {
  const [voted, setVoted] = useState<null | 'up' | 'down'>(null);

  const handleVote = (v: 'up' | 'down') => {
    setVoted(v);
    submitDiaFeedback({
      conversationId,
      surface,
      helpful: v === 'up',
      refId,
    });
  };

  if (voted) {
    return (
      <p className={cn('text-[11px] text-muted-foreground', className)}>
        Thanks - DIA will use this to get sharper.
      </p>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-[11px] text-muted-foreground', className)}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => handleVote('up')}
        aria-label="Helpful"
        className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => handleVote('down')}
        aria-label="Not helpful"
        className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
};

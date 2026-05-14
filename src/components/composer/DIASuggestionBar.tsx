/**
 * DIASuggestionBar — Proactive DIA suggestions within the Composer
 *
 * Per PRD Section 2.1 & 5.2:
 * - Displays one suggestion at a time
 * - Accept switches mode or adds field
 * - Dismiss hides suggestion with frequency limits
 * - Subtle animation on entry
 */

import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DIASuggestion } from '@/types/composer';
import { MateMasie } from '@/components/icons/adinkra';

interface DIASuggestionBarProps {
  suggestion: DIASuggestion;
  onAccept: (suggestion: DIASuggestion) => void;
  onDismiss: () => void;
}

export const DIASuggestionBar = ({
  suggestion,
  onAccept,
  onDismiss,
}: DIASuggestionBarProps) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        'bg-gradient-to-r from-teal-50/80 to-emerald-50/80',
        'dark:from-teal-950/30 dark:to-emerald-950/30',
        'border-teal-200/60 dark:border-teal-800/40',
        'animate-in slide-in-from-bottom-2 duration-300'
      )}
    >
      {/* DIA Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
          <MateMasie className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
        </div>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {suggestion.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => onAccept(suggestion)}
          >
            Switch
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

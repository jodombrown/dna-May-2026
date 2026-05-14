/**
 * ComposerFooter — Contextual submit button with C-module accent colors
 *
 * Sprint 3A: Uses MODE_HANDLERS for submit labels and colors.
 * Replaces switch/case getSubmitLabel with MODE_HANDLERS.submitLabel.
 */

import { Button } from '@/components/ui/button';
import { ComposerMode } from '@/hooks/useUniversalComposer';
import { MODE_HANDLERS } from './modeHandlers';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerFooterProps {
  mode: ComposerMode;
  isSubmitting: boolean;
  isValid: boolean;
  validationMessage?: string | null;
  /** Only show validation message after the user has tried to submit */
  hasAttemptedSubmit?: boolean;
  /** Optional slot rendered between Cancel and Submit (e.g. draft status). */
  leftSlot?: React.ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
}

export const ComposerFooter = ({
  mode,
  isSubmitting,
  isValid,
  validationMessage,
  hasAttemptedSubmit = false,
  leftSlot,
  onCancel,
  onSubmit,
}: ComposerFooterProps) => {
  const handler = MODE_HANDLERS[mode];
  const accentClass = `${handler.accentClass} ${handler.hoverClass}`;

  return (
    <div className="space-y-2 pt-3 sm:pt-4 border-t">
      {/* Validation message - only after submit attempt */}
      {hasAttemptedSubmit && !isValid && validationMessage && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
          {validationMessage}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} className="min-h-[44px]">
            Cancel
          </Button>
          {leftSlot}
        </div>

        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            'text-white min-w-[140px] min-h-[44px]',
            accentClass,
            !isValid && 'opacity-50',
            isSubmitting && 'opacity-70'
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? handler.submittingLabel : handler.submitLabel}
        </Button>
      </div>
    </div>
  );
};

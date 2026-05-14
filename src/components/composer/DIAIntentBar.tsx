/**
 * DIAIntentBar — Sprint 3B intent detection suggestion UI
 *
 * Appears below the text input, above mode-specific fields.
 * Slides in when DIA detects the user might be in the wrong mode.
 *
 * Behavior:
 * - Only shows when suggestion confidence >= threshold
 * - Dismissing adds mode to dismissedModes (won't re-suggest this session)
 * - Accepting triggers mode switch with text preservation
 * - Auto-dismisses after 10 seconds
 * - Only one suggestion at a time
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODE_HANDLERS } from './modeHandlers';
import type { IntentSuggestion } from '@/services/diaIntentDetectionService';
import type { ComposerMode } from '@/hooks/useUniversalComposer';
import { MateMasie } from '@/components/icons/adinkra';

interface DIAIntentBarProps {
  suggestion: IntentSuggestion | null;
  onAccept: (suggestedMode: ComposerMode) => void;
  onDismiss: () => void;
}

// No auto-dismiss - banner stays until user acts

export const DIAIntentBar = ({
  suggestion,
  onAccept,
  onDismiss,
}: DIAIntentBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const prevSuggestionId = useRef<string | null>(null);

  // Animate in when suggestion appears - no auto-dismiss
  useEffect(() => {
    if (suggestion && suggestion.id !== prevSuggestionId.current) {
      prevSuggestionId.current = suggestion.id;
      setIsVisible(true);
    } else if (!suggestion) {
      setIsVisible(false);
      prevSuggestionId.current = null;
    }
  }, [suggestion]);

  if (!suggestion) return null;

  const handler = MODE_HANDLERS[suggestion.suggestedMode];
  const accentColor = handler?.accentColor ?? '#4A8D77';

  const handleAccept = () => {
    setIsVisible(false);
    onAccept(suggestion.suggestedMode);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div
      className={cn(
        'mx-4 mb-3 p-3 rounded-xl border flex items-start gap-3 transition-all duration-200',
        'border-amber-300 bg-amber-50',
        isVisible
          ? 'opacity-100 translate-y-0 animate-in slide-in-from-top-2'
          : 'opacity-0 translate-y-2 pointer-events-none'
      )}
    >
      {/* DIA Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#B87333]/15"
      >
        <MateMasie className="h-4 w-4 text-[#B87333]" />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 leading-snug">
          {suggestion.message}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Detected: {handler?.label || suggestion.suggestedMode} mode
        </p>
        <Button
          size="sm"
          className="mt-2 w-full py-2 rounded-lg bg-[#B87333] hover:bg-[#A0622B] text-white text-sm font-semibold"
          onClick={handleAccept}
        >
          Switch to {handler?.label || suggestion.suggestedMode} mode
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full text-amber-600 hover:text-amber-800 hover:bg-amber-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

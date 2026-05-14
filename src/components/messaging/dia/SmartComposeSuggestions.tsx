import React from 'react';
import { Sparkles as _ } from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useDiaSmartCompose } from '@/hooks/messaging/useDiaSmartCompose';
import { useBlockedUserIds } from '@/hooks/messaging/useBlockedUserIds';
import { cn } from '@/lib/utils';

interface SmartComposeSuggestionsProps {
  otherUserId: string;
  otherUserName?: string;
  enabled: boolean;
  onPick: (text: string) => void;
}

/**
 * Phase 19 - Smart Compose openers for a fresh 1:1 thread.
 * Renders 3 tappable suggestions. Tap inserts the text into the composer
 * for editing before send. No emojis, no Adinkra decoration (utility surface).
 */
export const SmartComposeSuggestions: React.FC<SmartComposeSuggestionsProps> = ({
  otherUserId,
  otherUserName,
  enabled,
  onPick,
}) => {
  const { data: blocked } = useBlockedUserIds();
  const isBlocked = !!blocked?.has(otherUserId);
  const safeEnabled = enabled && !isBlocked;
  const { data, isLoading, isError } = useDiaSmartCompose(otherUserId, safeEnabled);

  if (!enabled || isBlocked) return null;

  const heading = otherUserName
    ? `DIA suggestions to start with ${otherUserName}`
    : 'DIA opener suggestions';

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span>{heading}</span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Drafting openers...
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground">
          Couldn't draft openers right now. Type your own message below.
        </p>
      )}

      {!isLoading && !isError && data?.suggestions?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No suggestions yet. Type a message below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {(data?.suggestions ?? []).map((s, i) => (
          <button
            key={`${i}-${s.slice(0, 16)}`}
            type="button"
            onClick={() => onPick(s)}
            className={cn(
              'text-left text-sm leading-snug',
              'rounded-lg border border-border bg-card hover:bg-muted/60',
              'px-3 py-2.5 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

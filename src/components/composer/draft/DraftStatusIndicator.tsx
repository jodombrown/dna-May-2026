/**
 * DraftStatusIndicator — persistent low-emphasis save state in the composer
 * footer, tappable to expose discard. Per PRD §3.2.
 *
 * - Tooltip explains each status and the keyboard shortcut.
 * - Subtle opacity-only fade on status change (no layout shift, honors
 *   prefers-reduced-motion).
 * - Responsive: collapses to icon-only on very narrow viewports so it never
 *   wraps next to the Cancel button.
 * - Keyboard shortcut: Cmd/Ctrl + Shift + D opens the discard menu while
 *   composer is open (wired in UniversalComposer).
 */

import { Check, FileText, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DraftSaveStatus } from '@/hooks/composer/useDraftStatus';

interface DraftStatusIndicatorProps {
  status: DraftSaveStatus;
  relativeTime: string;
  onDiscardClick: () => void;
}

const TOOLTIP_BY_STATUS: Record<Exclude<DraftSaveStatus, 'hidden'>, string> = {
  saving: 'Saving your draft…',
  saved: 'Draft saved locally. Press ⌘/Ctrl + Shift + D to discard.',
  idle: 'Draft is saved on this device. Press ⌘/Ctrl + Shift + D to discard.',
};

export const DraftStatusIndicator = ({
  status,
  relativeTime,
  onDiscardClick,
}: DraftStatusIndicatorProps) => {
  if (status === 'hidden') return null;

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const labelByStatus: Record<Exclude<DraftSaveStatus, 'hidden'>, React.ReactNode> = {
    saving: (
      <span className="flex items-center gap-1.5 text-dna-forest/60">
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full bg-dna-forest/60',
            !reduceMotion && 'animate-pulse',
          )}
          aria-hidden="true"
        />
        <span className="hidden xs:inline">Saving…</span>
      </span>
    ),
    saved: (
      <span className="flex items-center gap-1 text-dna-emerald">
        <Check className="h-3 w-3" aria-hidden="true" />
        <span className="hidden xs:inline">Saved</span>
      </span>
    ),
    idle: (
      <span className="flex items-center gap-1 text-dna-forest/70 max-w-[140px] sm:max-w-[180px] truncate">
        <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="hidden xs:inline truncate">
          Draft saved{relativeTime ? ` · ${relativeTime}` : ''}
        </span>
      </span>
    ),
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <Popover>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                key={status}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-1.5 min-h-[32px] rounded-md',
                  'shrink-0 max-w-[55%]',
                  'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'transition-opacity duration-200',
                  !reduceMotion && 'animate-fade-in',
                )}
                aria-label={
                  status === 'saving'
                    ? 'Draft saving'
                    : status === 'saved'
                      ? 'Draft saved. Open draft menu.'
                      : `Draft saved ${relativeTime}. Open draft menu.`
                }
                aria-keyshortcuts="Control+Shift+D"
                aria-live="polite"
              >
                {labelByStatus[status]}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="text-xs">
            {TOOLTIP_BY_STATUS[status]}
          </TooltipContent>
          <PopoverContent align="start" className="w-48 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-dna-copper hover:text-dna-copper hover:bg-dna-copper-light gap-2"
              onClick={onDiscardClick}
            >
              <X className="h-3.5 w-3.5" />
              Discard draft
              <kbd className="ml-auto text-[10px] text-muted-foreground font-mono">⇧⌘D</kbd>
            </Button>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  );
};

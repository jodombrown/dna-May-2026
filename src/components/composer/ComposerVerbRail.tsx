/**
 * ComposerVerbRail — the five verbs
 *
 * Fixes two things the founder hit in testing:
 *   1. Contrast — the active chip is FILLED with its C color and white text.
 *      The old chips fought the background and were hard to read.
 *   2. Desktop navigation — arrows. Not everyone has a trackpad, and a
 *      horizontally-scrolling row with no affordance is a dead end on a mouse.
 *
 * The rail is a FALLBACK, not the primary path. DIA picks the verb from what
 * the member writes; the rail is there to override it.
 */

import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, CalendarPlus, Hexagon, Gift, BookOpen } from 'lucide-react';
import { ComposerMode, MODE_ORDER, COMPOSER_MODE_CONFIG } from '@/config/composerModes';
import { cn } from '@/lib/utils';

const ICON: Record<ComposerMode, React.ElementType> = {
  connect: UserPlus,
  event: CalendarPlus,
  space: Hexagon,
  need: Gift,
  story: BookOpen,
};

/** Filled-chip classes. Explicit, so Tailwind doesn't purge a dynamic string. */
const ACTIVE_CLASS: Record<ComposerMode, string> = {
  connect: 'bg-bevel-connect text-white border-transparent',
  event: 'bg-bevel-event text-white border-transparent',
  space: 'bg-bevel-space text-white border-transparent',
  need: 'bg-bevel-opportunity text-[#3d2f05] border-transparent',
  story: 'bg-bevel-story text-white border-transparent',
};

interface ComposerVerbRailProps {
  mode: ComposerMode;
  onPick: (mode: ComposerMode) => void;
  /** The verb DIA inferred — subtly marked while the member hasn't overridden. */
  diaVerb?: ComposerMode | null;
  disabled?: (mode: ComposerMode) => boolean;
}

export const ComposerVerbRail: React.FC<ComposerVerbRailProps> = ({
  mode,
  onPick,
  diaVerb,
  disabled,
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLButtonElement>(null);

  // Keep the selected chip visible when DIA switches verbs under the member.
  useEffect(() => {
    active.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [mode]);

  const nudge = (dir: -1 | 1) =>
    scroller.current?.scrollBy({ left: dir * 190, behavior: 'smooth' });

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Previous verbs"
        className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scroller}
        className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MODE_ORDER.map((m) => {
          const cfg = COMPOSER_MODE_CONFIG[m];
          const Icon = ICON[m];
          const isActive = mode === m;
          const isDia = diaVerb === m && !isActive;
          const isOff = disabled?.(m) ?? false;

          return (
            <button
              key={m}
              ref={isActive ? active : undefined}
              type="button"
              disabled={isOff}
              onClick={() => onPick(m)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
                isActive
                  ? ACTIVE_CLASS[m]
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
                isDia && 'ring-2 ring-muted-foreground/20',
                isOff && 'cursor-not-allowed opacity-40'
              )}
            >
              <Icon className="h-4 w-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="More verbs"
        className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

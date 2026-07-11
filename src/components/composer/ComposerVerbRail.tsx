/**
 * ComposerVerbRail — the five verbs, one row, arrows on desktop
 *
 * The rail is how the member overrides DIA: pick a verb by hand and DIA stops
 * proposing verbs for the rest of the compose (rule 2, useDIACompose).
 *
 * Active chip is filled with its C color (BD083 bevel tokens) and stays
 * legible — the gold Contribute/Convene fills take dark text, the deep fills
 * take white. Class names are literal, not interpolated, so Tailwind sees
 * every one of them.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, Calendar, Gift, BookOpen, LucideIcon } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { ComposerMode, COMPOSER_MODE_CONFIG, MODE_ORDER } from '@/config/composerModes';
import { cn } from '@/lib/utils';

interface ComposerVerbRailProps {
  mode: ComposerMode;
  /** The member picked a verb by hand. */
  onPick: (mode: ComposerMode) => void;
  /** Verbs that cannot be composed in this context (e.g. event inside an event). */
  disabledModes?: ComposerMode[];
}

const CHIP_ICON: Record<ComposerMode, LucideIcon | typeof MateMasie> = {
  connect: UserPlus,
  event: Calendar,
  space: MateMasie,
  need: Gift,
  story: BookOpen,
};

/** Literal active-fill classes per verb — legible on every fill. */
const ACTIVE_FILL: Record<ComposerMode, string> = {
  connect: 'bg-bevel-connect text-white',
  event: 'bg-bevel-event text-white',
  space: 'bg-bevel-space text-white',
  need: 'bg-bevel-opportunity text-[#3d2f05]',
  story: 'bg-bevel-story text-white',
};

export const ComposerVerbRail: React.FC<ComposerVerbRailProps> = ({
  mode,
  onPick,
  disabledModes = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(updateArrows);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Keep the active chip in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [mode]);

  const nudge = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center">
      {/* Arrows are a desktop affordance; touch scrolls the rail directly. */}
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll verbs left"
          onClick={() => nudge(-1)}
          className="absolute left-0 z-10 hidden h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex w-full items-center gap-1.5 overflow-x-auto scrollbar-hide px-1 py-1"
      >
        {MODE_ORDER.filter((m) => COMPOSER_MODE_CONFIG[m].enabled).map((m) => {
          const cfg = COMPOSER_MODE_CONFIG[m];
          const Icon = CHIP_ICON[m];
          const isActive = mode === m;
          const disabled = disabledModes.includes(m);
          return (
            <button
              key={m}
              ref={isActive ? activeRef : undefined}
              type="button"
              disabled={disabled}
              onClick={() => onPick(m)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? cn(ACTIVE_FILL[m], 'shadow-md ring-1 ring-white/20')
                  : 'border border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                disabled && 'pointer-events-none cursor-not-allowed opacity-40'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {canRight && (
        <button
          type="button"
          aria-label="Scroll verbs right"
          onClick={() => nudge(1)}
          className="absolute right-0 z-10 hidden h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

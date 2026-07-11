/**
 * ComposerModeSelector — Horizontal scrolling chips with C-module accent colors
 *
 * Per PRD Section 2.1 & 7.2:
 * - Selected chip: filled background with C-module accent color, white text
 * - Unselected: outlined, DNA text color
 * - Horizontal scroll on mobile (no wrapping)
 * - Switching modes preserves base fields
 * - 200ms ease transition
 * - Auto-scrolls to keep selected chip visible
 */

import { useRef, useEffect } from 'react';
import { ComposerMode, ComposerContext } from '@/hooks/useUniversalComposer';
import { COMPOSER_MODE_CONFIG } from '@/config/composerModes';
import { MODE_HANDLERS } from './modeHandlers';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { UserPlus, BookOpen, Calendar, Gift, LucideIcon } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface ComposerModeSelectorProps {
  currentMode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  context: ComposerContext;
}

interface ModeChipConfig {
  id: ComposerMode;
  icon: LucideIcon;
  activeBgClass: string;
}

// The five verbs (BD075). No generic 'post' chip — plain text is Convey.
// Colors are BD083 bevel tokens, not hardcoded hexes.
const modeChips: ModeChipConfig[] = [
  { id: 'connect', icon: UserPlus, activeBgClass: 'bg-bevel-connect' },
  { id: 'event',   icon: Calendar, activeBgClass: 'bg-bevel-event' },
  { id: 'space',   icon: MateMasie, activeBgClass: 'bg-bevel-space' },
  { id: 'need',    icon: Gift, activeBgClass: 'bg-bevel-opportunity' },
  { id: 'story',   icon: BookOpen, activeBgClass: 'bg-bevel-story' },
];

export const ComposerModeSelector = ({
  currentMode,
  onModeChange,
  context,
}: ComposerModeSelectorProps) => {
  const { isMobile } = useMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const enabledChips = modeChips.filter(
    (chip) => COMPOSER_MODE_CONFIG[chip.id]?.enabled
  );

  // Auto-scroll to keep active chip + next chip visible
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeRef.current;
      // Find the next sibling chip to ensure it's partially visible
      const nextChip = chip.nextElementSibling as HTMLElement | null;
      const targetRight = nextChip
        ? nextChip.offsetLeft + nextChip.offsetWidth
        : chip.offsetLeft + chip.offsetWidth;
      const chipLeft = chip.offsetLeft;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      if (chipLeft < scrollLeft) {
        container.scrollTo({ left: Math.max(0, chipLeft - 8), behavior: 'smooth' });
      } else if (targetRight > scrollLeft + containerWidth) {
        container.scrollTo({ left: targetRight - containerWidth + 8, behavior: 'smooth' });
      }
    }
  }, [currentMode]);

  const isDisabled = (modeId: ComposerMode): boolean => {
    if (modeId === 'event' && context.eventId) return true;
    if (modeId === 'space' && context.spaceId) return true;
    return false;
  };

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
    >
      {enabledChips.map((chip) => {
        const Icon = chip.icon;
        const isActive = currentMode === chip.id;
        const disabled = isDisabled(chip.id);
        // Labels are the five verbs, from the mode config (Marketing Voice).
        const chipLabel = isMobile
          ? MODE_HANDLERS[chip.id].shortLabel
          : COMPOSER_MODE_CONFIG[chip.id].label;

        return (
          <button
            key={chip.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onModeChange(chip.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap',
              'transition-all duration-200 ease-out min-h-[44px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? `${chip.activeBgClass} text-white shadow-md ring-1 ring-white/20`
                : 'bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted',
              disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{chipLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * CardActionRow — the shared feed-card engagement row (BD177).
 *
 * Every card type previously hand-rolled its own row of ghost buttons with a
 * hardcoded label span. That guaranteed drift: fix one and the others diverge.
 * This is the single row they all compose.
 *
 * Layout rules (BD177):
 * - LEFT-PACKED. Distributed (`justify-between`) layout manufactures gaps
 *   between the buttons — the same trailing-gutter disease this BD removes.
 * - Exactly ONE trailing element (Save/Bookmark), pushed right by a `flex-1`
 *   spacer. Everything else packs from the left.
 * - Icon-only below 375px, icon + label at 375px and up, via the config `xs`
 *   breakpoint. No arbitrary widths.
 * - `min-h-11` (44px) on every button — BD176's touch-target floor.
 * - Accent is a PROP, so each C keeps its own `bevel-*` token; nothing is
 *   hardcoded to story green.
 *
 * Port order: StoryCard lands on this in BD177. The remaining six card types
 * follow as a deliberate, separate pass (see PR body).
 */

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CardAction {
  icon: LucideIcon;
  /** Shown at 375px and up; hidden below, where the icon stands alone. */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Engaged state — tints the icon with the row's accent (or `activeClassName`). */
  active?: boolean;
  /**
   * Icon classes applied when `active`. Defaults to the row's `accent`.
   * Use it to preserve a card's exact engaged treatment (e.g. a soft fill).
   */
  activeClassName?: string;
}

interface CardActionRowProps {
  /** Active-state accent color token, e.g. `text-bevel-story`. */
  accent: string;
  /** Left-packed leading actions (React / Comment / Reshare …). */
  actions: CardAction[];
  /** The single trailing action, pushed to the right edge (Save). */
  trailing: CardAction;
}

function ActionButton({
  action,
  accent,
}: {
  action: CardAction;
  accent: string;
}) {
  const iconActive = action.activeClassName ?? accent;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={action.disabled}
      onClick={action.onClick}
      className="flex min-h-11 items-center gap-1.5"
    >
      <action.icon
        className={cn('h-4 w-4', action.active ? iconActive : 'text-muted-foreground')}
      />
      <span className="hidden xs:inline">{action.label}</span>
    </Button>
  );
}

export function CardActionRow({ accent, actions, trailing }: CardActionRowProps) {
  return (
    <div className="mt-3 flex items-center gap-1 border-t pt-2">
      {actions.map((action) => (
        <ActionButton key={action.label} action={action} accent={accent} />
      ))}
      <div className="flex-1" />
      <ActionButton action={trailing} accent={accent} />
    </div>
  );
}

/**
 * CardActionRow — the shared feed-card engagement row (BD177).
 *
 * Every card type previously hand-rolled its own row of ghost buttons with a
 * hardcoded label span. That guaranteed drift: fix one and the others diverge.
 * This is the single row they all compose.
 *
 * Layout rules (BD177, amended BD185):
 * - Exactly ONE trailing element (Save/Bookmark); everything else leads.
 * - LABELS SHOWN (sm and up): left-packed, with the trailing Save pushed to the
 *   right edge by a `flex-1` spacer. Distributed (`justify-between`) layout would
 *   manufacture gaps between the wide labeled buttons — the trailing-gutter
 *   disease this row removes.
 * - ICON-ONLY (phone widths): no spacer; the four compact icon buttons are
 *   evenly distributed via `justify-between`, which keeps Save anchored to the
 *   right edge instead of stranding it behind one large gap.
 * - Icon-only on phones, icon + label at 640px and up, via the config `sm`
 *   breakpoint. No arbitrary widths. (BD185: the label breakpoint was `xs`
 *   (375px), which clipped the trailing Save — four labels never fit a
 *   phone-width card, whose inner width is ~330px against the ~346px they need.)
 * - `min-h-11` (44px) on every button — BD176's touch-target floor.
 * - `shrink-0` on every button — a flex item defaults to `min-width: auto` and
 *   refuses to shrink below its content, so without this a future overflow
 *   silently clips the trailing element (the BD185 defect).
 * - Accent is a PROP, so each C keeps its own `bevel-*` token; nothing is
 *   hardcoded to story green.
 *
 * Port order: StoryCard lands on this in BD177; EventCard, ConnectCard,
 * SpaceCard and OpportunityFeedCard follow in BD185.
 */

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CardAction {
  icon: LucideIcon;
  /** Shown at 640px (sm) and up; hidden below, where the icon stands alone. */
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
      className="flex min-h-11 shrink-0 items-center gap-1.5"
    >
      <action.icon
        className={cn('h-4 w-4', action.active ? iconActive : 'text-muted-foreground')}
      />
      <span className="hidden sm:inline">{action.label}</span>
    </Button>
  );
}

export function CardActionRow({ accent, actions, trailing }: CardActionRowProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-1 border-t pt-2 sm:justify-start">
      {actions.map((action) => (
        <ActionButton key={action.label} action={action} accent={accent} />
      ))}
      {/* Spacer only where labels show; phone widths distribute via justify-between. */}
      <div className="hidden flex-1 sm:block" />
      <ActionButton action={trailing} accent={accent} />
    </div>
  );
}

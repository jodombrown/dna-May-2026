/**
 * FeedCardBase — Universal wrapper for all feed cards
 *
 * DNA card chassis:
 * - 12px border radius
 * - Full-frame bevel at --bevel-width in the card's C color (BD083 locked palette)
 * - Hover lift, no resting shadow
 * - Padding driven by --card-padding (steps with viewport)
 *
 * The bevel is the single point where a card's C identity is applied.
 * Changing a color here changes it on every surface that renders the card.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type FeedCardBevelType =
  | 'post'
  | 'connect'
  | 'story'
  | 'event'
  | 'space'
  | 'opportunity'
  | 'need'
  | 'offer';

/**
 * BD083 — locked C palette.
 *   Connect      #2D6A4F
 *   Convene      #B87333
 *   Collaborate  #1D7A7A
 *   Contribute   #D4AF37
 *   Convey       #5B3A3A
 *
 * `post` stays neutral until BD075 retires the generic bucket.
 */
const bevelColors: Record<FeedCardBevelType, string> = {
  post: 'hsl(215 16% 47%)',
  connect: 'hsl(153 40% 30%)',
  story: 'hsl(0 22% 29%)',
  event: 'hsl(29 57% 46%)',
  space: 'hsl(180 62% 30%)',
  opportunity: 'hsl(46 65% 52%)',
  need: 'hsl(46 65% 52%)',
  offer: 'hsl(46 65% 52%)',
};

interface FeedCardBaseProps {
  bevelType: FeedCardBevelType;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const FeedCardBase: React.FC<FeedCardBaseProps> = ({
  bevelType,
  children,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        borderColor: bevelColors[bevelType],
        padding: 'var(--card-padding)',
      }}
      className={cn(
        'bg-card rounded-xl',
        // Full-frame bevel at --bevel-width (color applied via inline style)
        'border-bevel',
        'transition-all duration-200',
        'hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

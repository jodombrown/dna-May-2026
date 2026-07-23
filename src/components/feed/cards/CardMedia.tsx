/**
 * CardMedia — full-bleed media band for feed cards (BD178).
 *
 * The frame is the mat; the media is the plate. Media fills the inner card
 * width and presses to the C-colored bevel by cancelling one --card-padding on
 * each side. This is deliberately NOT edge-bleed: the media meets the frame, it
 * never runs past it — the frame carries the card's C identity and stays intact.
 *
 * The bleed MUST track the variable. --card-padding steps 12 → 14 → 16px with
 * viewport (see index.css), so a hardcoded -16px is correct only at ≥390 and
 * leaves a hairline of card background down both sides at 320 and 375. Expressing
 * it as calc(var(--card-padding) * -1) is the whole reason this primitive exists:
 * the value lives in exactly one place and cannot drift back to a literal.
 *
 * Corner treatment: both of today's callers sit mid-card, with content above and
 * below, so the media takes SQUARE corners — a radius there reads as a floating
 * rectangle rather than a plate spanning the frame. The touching-edge case
 * (inner radius = card radius − stroke, on the touching corners only) is
 * intentionally NOT built until a card actually has media at a card edge.
 *
 * `relative` is applied so a caller can absolutely position a scrim, a type pill,
 * or a text overlay against the media (EventCard does all three).
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardMediaProps {
  children: React.ReactNode;
  /** Layout only — height, cursor, vertical rhythm. Never restyling. */
  className?: string;
  onClick?: () => void;
}

/** Cancels one --card-padding on each side so the media meets the bevel. */
const bleedToFrame: React.CSSProperties = {
  marginLeft: 'calc(var(--card-padding) * -1)',
  marginRight: 'calc(var(--card-padding) * -1)',
  width: 'calc(100% + (var(--card-padding) * 2))',
};

export const CardMedia: React.FC<CardMediaProps> = ({ children, className, onClick }) => (
  <div style={bleedToFrame} onClick={onClick} className={cn('relative overflow-hidden', className)}>
    {children}
  </div>
);

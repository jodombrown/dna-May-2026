/**
 * EventCardFrame — the shared geometry primitive for every event card.
 *
 * A frame is four stacked bands in a fixed order (BD190). It knows nothing
 * about events: it accepts a React node per band and enforces the geometry, so
 * every surface that renders an event card — Convene rails, the feed, later the
 * detail and ticket surfaces — is byte-identical in shape.
 *
 *   1. Identity — 40px, absolutely positioned over the top of the image band.
 *   2. Image    — 16:9, aspect-locked. A cover <img> or an <EventPlate>.
 *   3. Fact     — title / where / proof. Flexes to fill; clips its overflow.
 *   4. Action   — fixed 56px, pinned to the bottom. Two actions max (BD193).
 *
 * Chassis (BD176): 12px radius, a 2px four-sided bevel in the card's C colour,
 * no resting shadow — the bevel is the edge. Padding steps with the viewport
 * via --card-padding (16 / 14 / 12); it is never hardcoded.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface EventCardFrameProps {
  /**
   * The bevel colour, named by its `--bevel-*` token key (e.g. `event`,
   * `connect`). Read straight from the token — no colour map lives here.
   */
  bevelToken: string;
  /** Optional fixed height. Set it to make a rail of cards share one height. */
  height?: number | string;
  /** Band 1 — overlays the top of the image band. Provenance marker, etc. */
  identity?: React.ReactNode;
  /** Band 2 — the aspect-locked cover: an <img>, or an <EventPlate>. */
  image: React.ReactNode;
  /** Band 3 — title, where, proof. Flexes; clips overflow. */
  fact: React.ReactNode;
  /** Band 4 — actions. One primary, one secondary at most (BD193). */
  action?: React.ReactNode;
  /** Layout positioning only — never restyling (design-system rule 6). */
  className?: string;
}

const CARD_PADDING = 'var(--card-padding)';

export const EventCardFrame: React.FC<EventCardFrameProps> = ({
  bevelToken,
  height,
  identity,
  image,
  fact,
  action,
  className,
}) => {
  return (
    <div
      style={{ borderColor: `hsl(var(--bevel-${bevelToken}))`, height }}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-card',
        // 2px four-sided bevel; colour applied via inline style above (BD083).
        'border-bevel',
        className,
      )}
    >
      {/* Band 2 — image, aspect-locked. Band 1 overlays its top. */}
      <div className="relative aspect-video w-full flex-shrink-0">
        {image}
        {identity && (
          <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center">
            {identity}
          </div>
        )}
      </div>

      {/* Band 3 — fact. Absorbs the height variation between cards so the frame
          stays uniform; clips anything that would push the geometry. */}
      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{ padding: CARD_PADDING }}
      >
        {fact}
      </div>

      {/* Band 4 — action. Fixed height, pinned bottom. Horizontal padding only,
          so a 44px touch target clears the 56px band. */}
      {action && (
        <div
          className="mt-auto flex h-14 flex-shrink-0 items-center"
          style={{ paddingLeft: CARD_PADDING, paddingRight: CARD_PADDING }}
        >
          {action}
        </div>
      )}
    </div>
  );
};

export default EventCardFrame;

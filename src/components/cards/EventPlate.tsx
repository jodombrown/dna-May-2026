/**
 * EventPlate — the generative, imageless cover (BD191).
 *
 * When a curated event has no real cover image, the plate stands in: a coloured
 * ground, a decorative Adinkra mark, and a serif lockup of who is hosting and
 * where. It makes NO claim about the event itself (BD111) — the field and mark
 * are identity, not photography, and the title always renders in the fact band
 * below, so the card is never contentless.
 *
 * Everything visual is deterministic in `event.id` (see plateComposition.ts).
 * The same event renders the same plate forever.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { curatedHostName } from '@/lib/events/curated';
import { composePlate } from './plateComposition';

export interface EventPlateEvent {
  id: string;
  event_type?: string | null;
  /** For host derivation (curatedHostName). */
  organizer_name?: string | null;
  curated_source_url?: string | null;
  /** City for the micro line / tier-2 promotion. */
  location_city?: string | null;
}

interface EventPlateProps {
  event: EventPlateEvent;
  className?: string;
}

/**
 * EventPlate fills the frame's aspect-locked image band (it does not set its
 * own aspect ratio — the frame owns geometry). It is a plain div, safe to drop
 * into the `image` slot of EventCardFrame.
 */
export const EventPlate: React.FC<EventPlateProps> = ({ event, className }) => {
  const { field, mark: Mark, markSize } = composePlate(event.id, event.event_type);

  const host = curatedHostName(event).trim();
  const city = (event.location_city ?? '').trim();

  // BD206 — the serif slot degrades: host, then city, then nothing.
  //   tier 1  host present            → lockup = host,  micro city line shown
  //   tier 2  host empty, city present → lockup = city,  micro line dropped
  //   tier 3  both empty              → no lockup, no rule, no text
  const lockup = host || city;
  const showMicroCity = Boolean(host) && Boolean(city);
  // The accent rule renders ONLY with a lockup. A rule stranded above an empty
  // slot reads as a failed render — the dashed-border failure through absence.
  const showRule = Boolean(lockup);

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${field.from}, ${field.to})` }}
    >
      {/* Lockup and mark share the lower zone; the top is left clear for the
          frame's identity band, which overlays band 2. Aligned to the baseline
          so a tall lockup and the mark sit on the same line. */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-2">
          {lockup && (
            <p
              className="line-clamp-2 break-words font-display text-h2 leading-tight"
              style={{ color: field.foreground }}
            >
              {lockup}
            </p>
          )}
          {showRule && (
            <span
              aria-hidden
              className="block h-0.5 w-7 rounded-full"
              style={{ backgroundColor: field.accent }}
            />
          )}
          {showMicroCity && (
            <span className="text-micro uppercase" style={{ color: field.foreground }}>
              {city}
            </span>
          )}
        </div>

        {/* Decorative: the host name is the real DOM text, so the mark is
            aria-hidden. No `title` and no `filled` prop — the mark composes
            `<AdinkraIcon filled ... {...props}>`, so passing `filled` would
            override its silhouette into a hairline outline. */}
        <Mark
          size={markSize}
          color={field.accent}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
};

export default EventPlate;

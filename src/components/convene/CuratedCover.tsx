/**
 * DNA | CONVENE — Curated Event Cover
 *
 * The cover a curated surface is allowed to show: the source's own image,
 * or a typographic cover — host name and city set large. Never stock
 * photography: a photograph of strangers in a room that is not the room is
 * the same fabrication as "TBD Venue".
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { realCuratedCover } from '@/lib/events/curated';

export interface CuratedCoverProps {
  event: {
    title: string;
    cover_image_url?: string | null;
    location_city?: string | null;
  };
  /** The line set large — the host's name (source domain when that's all DNA knows). */
  hostName: string;
  className?: string;
}

export function CuratedCover({ event, hostName, className }: CuratedCoverProps) {
  const realCover = realCuratedCover(event);

  if (realCover) {
    return (
      <div className={cn('overflow-hidden bg-muted', className)}>
        <img
          src={realCover}
          alt={event.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const headline = hostName || event.title;

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-end gap-1 bg-muted/40 p-4',
        className
      )}
    >
      <span className="font-serif text-xl sm:text-2xl font-bold leading-tight text-foreground break-words line-clamp-3">
        {headline}
      </span>
      {event.location_city && (
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {event.location_city}
        </span>
      )}
    </div>
  );
}

export default CuratedCover;

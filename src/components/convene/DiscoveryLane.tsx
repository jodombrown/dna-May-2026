/**
 * DNA | CONVENE — Discovery Lane
 * Reusable horizontal-scroll section for event discovery.
 * Shows section title + "See all →" + horizontal scroll on mobile, grid on desktop.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConveneEventCard } from '@/components/convene/ConveneEventCard';
import { CuratedEventCard } from '@/components/convene/CuratedEventCard';
import { pickEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { cn } from '@/lib/utils';

export interface DiscoveryEvent extends EventPlaceInput {
  id: string;
  title: string;
  slug?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  cover_image_url?: string | null;
  event_type?: string | null;
  format?: string | null;
  is_cancelled?: boolean;
  max_attendees?: number | null;
  organizer_id?: string | null;
  is_curated?: boolean;
  curated_source?: string | null;
  curated_source_url?: string | null;
  description?: string | null;
  short_description?: string | null;
  event_attendees?: Array<{ count: number }>;
  organizer?: {
    id?: string;
    full_name: string;
    avatar_url?: string | null;
    username?: string;
  } | null;
}

interface DiscoveryLaneProps {
  title: string;
  events: DiscoveryEvent[];
  onSeeAll?: () => void;
  seeAllLabel?: string;
  showMutualAttendees?: boolean;
  emptyMessage?: string;
  className?: string;
  /** eventId → distance label, rendered on the card when present (near-me sort) */
  distanceLabels?: Record<string, string>;
}

export function DiscoveryLane({
  title,
  events,
  onSeeAll,
  seeAllLabel = 'See all',
  showMutualAttendees = true,
  emptyMessage,
  className,
  distanceLabels,
}: DiscoveryLaneProps) {
  if (events.length === 0 && !emptyMessage) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-dna-forest">{title}</h3>
        {onSeeAll && events.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 -mr-2 text-sm font-medium"
            onClick={onSeeAll}
          >
            {seeAllLabel} <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Copper section divider */}
      <div className="h-px bg-dna-copper/20" />

      {events.length === 0 && emptyMessage ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
      ) : (
        /* Horizontal scroll on mobile, grid on desktop */
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {events.map((event) => (
            <div key={event.id} className="min-w-[300px] max-w-[340px] flex-shrink-0 md:min-w-0 md:max-w-none">
              {event.is_curated ? (
                <CuratedEventCard
                  event={{
                    id: event.id,
                    title: event.title,
                    start_time: event.start_time || null,
                    end_time: event.end_time,
                    time_confirmed: event.time_confirmed,
                    date_confirmed: event.date_confirmed,
                    ...pickEventPlace(event),
                    cover_image_url: event.cover_image_url,
                    format: event.format,
                    slug: event.slug,
                    organizer_name: event.organizer?.full_name ?? null,
                    curated_source: event.curated_source,
                    curated_source_url: event.curated_source_url,
                  }}
                />
              ) : (
                <ConveneEventCard
                  event={{
                    id: event.id,
                    title: event.title,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    time_confirmed: event.time_confirmed,
                    date_confirmed: event.date_confirmed,
                    ...pickEventPlace(event),
                    cover_image_url: event.cover_image_url,
                    event_type: event.event_type || undefined,
                    format: event.format || undefined,
                    is_cancelled: event.is_cancelled,
                    slug: event.slug,
                    max_attendees: event.max_attendees,
                    organizer: event.organizer ? {
                      id: event.organizer.id,
                      full_name: event.organizer.full_name,
                      avatar_url: event.organizer.avatar_url,
                      username: event.organizer.username,
                    } : undefined,
                    event_attendees: event.event_attendees,
                  }}
                  variant="full"
                  showOrganizer
                  showMutualAttendees={showMutualAttendees}
                  distanceLabel={distanceLabels?.[event.id]}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

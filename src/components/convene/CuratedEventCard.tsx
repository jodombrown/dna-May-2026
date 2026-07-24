/**
 * DNA | CONVENE — Curated Event Card
 *
 * A curated event is one DNA has SEEN at a source, not one DNA hosts. This
 * card composes the shared geometry primitive (EventCardFrame, BD190) so it is
 * byte-identical in shape to every other event surface, and fills the four
 * bands with the curated read:
 *
 *   Identity — a small "Seen by DNA" chip and the compact time, overlaid on
 *              the top of the image band.
 *   Image    — the source's own cover when it has one, else an <EventPlate>:
 *              a generative, imageless cover. Never stock photography.
 *   Fact     — title, city, and the DNA layer (how many Members are going).
 *   Action   — two, and only two (BD193): "I'm going" (sign-in wall at the
 *              action) and "Source ↗" (a clean handoff, no interception).
 *
 * Host identity lives on the plate, derived through curatedHostName, which
 * refuses the DNA-side profile join for a curated row (BD214): a curated
 * card's host is the source domain, never a DNA Member.
 *
 * Dates render through <EventTime>: an unconfirmed hour never prints. Covers
 * gate through realCuratedCover — the only stock-image check, never a second.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { EventTime } from '@/components/events/EventTime';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { realCuratedCover } from '@/lib/events/curated';
import { EventCardFrame } from '@/components/cards/EventCardFrame';
import { EventPlate } from '@/components/cards/EventPlate';
import { useCuratedEventPulse } from '@/hooks/convene/useCuratedEventPulse';
import { Nkonsonkonson } from '@/components/icons/adinkra';

export interface CuratedEventCardProps {
  event: EventPlaceInput & {
    id: string;
    title: string;
    start_time?: string | null;
    end_time?: string | null;
    time_confirmed: boolean | null | undefined;
    date_confirmed: boolean | null | undefined;
    cover_image_url?: string | null;
    slug?: string | null;
    event_type?: string | null;
    organizer_name?: string | null;
    curated_source?: string | null;
    curated_source_url?: string | null;
  };
  className?: string;
}

// The card-padding token steps with the viewport (16 / 14 / 12); it has no
// Tailwind utility, so the frame and plate apply it inline. The identity band
// overlays the image with no padding of its own, so the chip row matches that
// same rhythm here — the one certified way to read this token.
const CARD_PADDING = 'var(--card-padding)';

export function CuratedEventCard({ event, className }: CuratedEventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pulse, setGoing, isSettingGoing } = useCuratedEventPulse(event.id);

  const realCover = realCuratedCover(event);
  const cityLine = formatEventPlace(event, 'compact');
  const eventPath = `/dna/convene/events/${event.slug || event.id}`;
  const isGoing = pulse?.isGoing ?? false;

  const handleCardClick = () => navigate(eventPath);

  const handleGoing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      // Sign-in wall lives at the action, not the page: the wall returns
      // the member to this event once they're in.
      navigate(`/auth?redirect=${encodeURIComponent(eventPath)}`);
      return;
    }
    setGoing(!isGoing);
  };

  const handleSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.curated_source_url) {
      window.open(event.curated_source_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Band 1 — provenance chip leading, compact time trailing. Both sit on a
  // token-card ground so they read over a photo or a coloured plate alike.
  const identity = (
    <div
      className="flex w-full items-center justify-between gap-2"
      style={{ paddingLeft: CARD_PADDING, paddingRight: CARD_PADDING }}
    >
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/90 px-2 py-0.5 text-micro uppercase text-foreground backdrop-blur-sm">
        <Nkonsonkonson className="h-2.5 w-2.5" />
        Seen by DNA
      </span>
      <EventTime
        event={event}
        variant="compact"
        notifyAction={false}
        className="inline-flex shrink-0 items-center rounded-full border border-border/60 bg-card/90 px-2 py-0.5 text-micro text-foreground backdrop-blur-sm"
      />
    </div>
  );

  // Band 2 — the source's cover, or the generative plate when there is none.
  const image = realCover ? (
    <img
      src={realCover}
      alt={event.title}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <EventPlate
      event={{
        id: event.id,
        event_type: event.event_type,
        organizer_name: event.organizer_name,
        curated_source_url: event.curated_source_url,
        location_city: event.location_city,
      }}
    />
  );

  // Band 3 — the source's facts, then the DNA layer pinned to the bottom.
  const fact = (
    <div className="flex h-full flex-col gap-2">
      <h3 className="line-clamp-2 text-h3 text-foreground">{event.title}</h3>
      {cityLine && <p className="text-meta text-muted-foreground">{cityLine}</p>}
      <p className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0 text-meta">
        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {pulse && pulse.goingCount > 0 ? (
          <>
            <span className="font-semibold text-foreground">
              {pulse.goingCount} {pulse.goingCount === 1 ? 'Member' : 'Members'} going
            </span>
            {pulse.chapterCount > 0 && (
              <span className="text-muted-foreground">
                · {pulse.chapterCount} from your chapter
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No Members yet. Be the first.</span>
        )}
      </p>
    </div>
  );

  // Band 4 — exactly two actions (BD193).
  const action = (
    <div className="flex w-full items-center gap-2">
      <Button
        variant={isGoing ? 'default' : 'outline'}
        size="sm"
        className="flex-1"
        onClick={handleGoing}
        disabled={isSettingGoing}
      >
        {isGoing ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5" /> Going
          </>
        ) : (
          "I'm going"
        )}
      </Button>
      {event.curated_source_url && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:text-foreground"
          onClick={handleSource}
        >
          Source
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <div
      className={cn('group block h-full w-full cursor-pointer', className)}
      onClick={handleCardClick}
    >
      <EventCardFrame
        bevelToken="event"
        identity={identity}
        image={image}
        fact={fact}
        action={action}
        className="h-full transition-colors"
      />
    </div>
  );
}

export default CuratedEventCard;

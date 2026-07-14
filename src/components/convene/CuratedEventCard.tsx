/**
 * DNA | CONVENE — Curated Event Card
 *
 * A curated event is one DNA has SEEN at a source, not one DNA hosts — the
 * card is outlined with a dashed top rule (never the solid green bar of a
 * DNA-hosted card), the host's name leads, and DNA's mark is a small,
 * secondary "Seen by DNA" chip.
 *
 * Facts (title, dates, city) belong to the source; the DNA layer is the
 * reason the card exists: how many Members are going and how many from the
 * viewer's chapter. Actions: "I'm going" (DNA-side, sign-in wall at the
 * action) and "Register at source ↗" — a clean handoff, no interception.
 *
 * Dates render through <EventTime>: an unconfirmed hour never prints.
 * Covers render through <CuratedCover>: no stock photography, ever.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { EventTime } from '@/components/events/EventTime';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { curatedHostName, realCuratedCover } from '@/lib/events/curated';
import { CuratedCover } from '@/components/convene/CuratedCover';
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
    organizer_name?: string | null;
    curated_source?: string | null;
    curated_source_url?: string | null;
  };
  className?: string;
}

export function CuratedEventCard({ event, className }: CuratedEventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pulse, setGoing, isSettingGoing } = useCuratedEventPulse(event.id);

  const hostName = curatedHostName(event);
  // A typographic cover already leads with the host set large — repeating
  // it in the byline row would read as a stutter.
  const hostLeadsInCover = !realCuratedCover(event);
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

  const handleRegisterAtSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.curated_source_url) {
      window.open(event.curated_source_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className={cn(
        // Outlined with a dashed top rule — the visual grammar of "seen,
        // not hosted". Never the solid green bar.
        'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg',
        'border border-border bg-card shadow-none transition-colors hover:border-foreground/30',
        'border-t-2 [border-top-style:dashed]',
        className
      )}
      onClick={handleCardClick}
    >
      <CuratedCover event={event} hostName={hostName} className="aspect-[2/1] w-full" />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Host leads; DNA's mark is secondary */}
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-foreground">
            {hostLeadsInCover ? '' : hostName}
          </span>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-border/70 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
          >
            <Nkonsonkonson className="h-2.5 w-2.5" />
            Seen by DNA
          </Badge>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground">
          {event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <EventTime event={event} variant="compact" />
          {cityLine && (
            <>
              <span className="text-border">·</span>
              <span>{cityLine}</span>
            </>
          )}
        </div>

        {/* The DNA layer — the reason the card exists */}
        {pulse && pulse.goingCount > 0 && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {pulse.goingCount} {pulse.goingCount === 1 ? 'Member' : 'Members'} going
            {pulse.chapterCount > 0 && (
              <span className="text-muted-foreground">
                · {pulse.chapterCount} from your chapter
              </span>
            )}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button
            variant={isGoing ? 'default' : 'outline'}
            size="sm"
            className="h-9 flex-1 text-xs"
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
              className="h-9 flex-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleRegisterAtSource}
            >
              Register at source
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default CuratedEventCard;

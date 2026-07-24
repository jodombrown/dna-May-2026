/**
 * DNA | CONVENE — Curated Event Page (shared body)
 *
 * The detail surface for events DNA has SEEN at a source, not hosted.
 * Rendered by EventDetail (signed-in shell) and PublicEventPage (anon
 * chrome) whenever is_curated is true.
 *
 * Order is deliberate:
 *   1. The facts, which belong to the source: host, title, dates, city.
 *   2. Register at source — the terminal CTA. A clean handoff, never an
 *      interception.
 *   3. Who from the body is going — DNA's actual contribution — with the
 *      "I'm going" action (sign-in wall AT the action, D089).
 *   4. Open a Space to go together (D052/D084).
 *   5. The yield, after the event has passed (D088): the people, who
 *      outlast the room.
 *   6. A plain line naming what DNA has not confirmed, linked to the source.
 *
 * Dates render through <EventTime> — an unconfirmed hour never prints.
 * Covers render through realCuratedCover — no stock photography.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Share2, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EventTime } from '@/components/events/EventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { formatEventPlace, pickEventPlace } from '@/lib/events/formatPlace';
import { curatedHostName, curatedSourceDomain, realCuratedCover } from '@/lib/events/curated';
import { useCuratedEventPulse } from '@/hooks/convene/useCuratedEventPulse';
import { ROUTES } from '@/config/routes';
import { Nkonsonkonson } from '@/components/icons/adinkra';
import { LocationMap } from '@/components/maps/LocationMap';
import { LocationLine } from '@/components/maps/LocationLine';

interface CuratedEventPreviewProps {
  event: Record<string, unknown>;
  /** PublicEventPage brings its own chrome; the in-app shell wants a back row. */
  showBack?: boolean;
}

export function CuratedEventPreview({ event, showBack = true }: CuratedEventPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const eventId = event.id as string;
  const title = event.title as string;
  const description = event.description as string | null;
  const slug = event.slug as string | null;
  const eventFormat = event.format as string | null;
  const locationName = event.location_name as string | null;
  const curatedSourceUrl = event.curated_source_url as string | null;
  const organizerName =
    (event.organizer_name as string | null) ||
    (event.organizer as { full_name?: string } | null)?.full_name ||
    null;
  const timeConfirmed = (event.time_confirmed as boolean | null | undefined) ?? null;
  const endTime = event.end_time as string | null;

  const hostName = curatedHostName({
    organizer_name: organizerName,
    curated_source_url: curatedSourceUrl,
  });
  const sourceDomain = curatedSourceDomain(curatedSourceUrl);
  const cover = realCuratedCover({ cover_image_url: event.cover_image_url as string | null });
  const cityLine = formatEventPlace(pickEventPlace(event), 'compact');
  // The full block feeds <LocationMap>; the BD186 gate inside it decides
  // whether coordinates earn a pin — no branch on is_curated here.
  const place = formatEventPlace(pickEventPlace(event), 'full');

  const dateConfirmed = (event.date_confirmed as boolean | null | undefined) ?? null;
  const timeInput = {
    start_time: event.start_time as string | null,
    end_time: endTime,
    time_confirmed: timeConfirmed,
    date_confirmed: dateConfirmed,
    timezone: event.timezone as string | null,
  };

  // Completed is derived from the clock; an unannounced placeholder never
  // reads as past.
  const isPast = isEventCompleted({ end_time: endTime, date_confirmed: dateConfirmed });

  const { pulse, setGoing, isSettingGoing } = useCuratedEventPulse(eventId);
  // Signed-out viewers can't read attendee rows — the public projection's
  // going_count carries the headcount instead.
  const goingCount = pulse?.goingCount ?? Number((event.going_count as number | null) ?? 0);
  const chapterCount = pulse?.chapterCount ?? 0;
  const isGoing = pulse?.isGoing ?? false;
  const attendeePreview = (pulse?.attendees ?? []).slice(0, 8);

  const eventPath = `/dna/convene/events/${slug || eventId}`;

  const requireUser = (): boolean => {
    if (user) return true;
    // The sign-in wall lives at the action (D089) and returns here after.
    navigate(`/auth?redirect=${encodeURIComponent(eventPath)}`);
    return false;
  };

  const handleGoing = () => {
    if (!requireUser()) return;
    setGoing(!isGoing);
  };

  const handleOpenSpace = () => {
    if (!requireUser()) return;
    navigate(ROUTES.collaborate.createSpace, {
      state: {
        name: `Going to ${title}`,
        tagline: cityLine ? `Members heading to ${title} · ${cityLine}` : `Members heading to ${title}`,
        description: curatedSourceUrl
          ? `Coordinating around ${title}. Event details: ${curatedSourceUrl}`
          : `Coordinating around ${title}.`,
        spaceType: 'working_group',
      },
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', description: 'Event link copied to clipboard' });
    }
  };

  // The plain line: name exactly what DNA has not confirmed.
  const unconfirmed: string[] = [];
  if (timeConfirmed === false) unconfirmed.push('the start time');
  if (!locationName && eventFormat !== 'virtual') unconfirmed.push('the venue');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        ) : (
          <span />
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Only a real image from the source gets to be the cover. */}
      {cover && (
        <div className="rounded-lg overflow-hidden">
          <img src={cover} alt={title} className="w-full h-48 sm:h-64 object-cover" loading="lazy" />
        </div>
      )}

      {/* 1 — The facts, which belong to the source: host leads. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {hostName && (
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {hostName}
            </p>
          )}
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-border/70 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
          >
            <Nkonsonkonson className="h-2.5 w-2.5" />
            Seen by DNA
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-h1 font-serif text-foreground leading-tight">{title}</h1>

        <div className="space-y-0.5">
          <p className="font-medium text-sm text-foreground">
            <EventTime event={timeInput} eventId={eventId} variant="date" />
          </p>
          <EventTime
            event={timeInput}
            variant="clock"
            className="block text-sm text-muted-foreground"
          />
          <LocationLine
            locationName={place.venue}
            locationAddress={place.street}
            locality={place.locality}
            lat={event.location_lat as number}
            lng={event.location_lng as number}
          />
        </div>
      </div>

      {/* Where it sits — one template, no is_curated branch. The BD186 gate in
          LocationMap draws a pin only when coordinates carry a real venue;
          otherwise it shows the deep links and no map. */}
      <LocationMap
        locationName={place.venue}
        locationAddress={place.street}
        locality={place.locality}
        lat={event.location_lat as number}
        lng={event.location_lng as number}
      />

      {/* 2 — Register at source: the terminal CTA. Clean handoff. */}
      {curatedSourceUrl && !isPast && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => window.open(curatedSourceUrl, '_blank', 'noopener,noreferrer')}
        >
          Register at source
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      )}

      {description && (
        <>
          <Separator />
          <div className="prose prose-sm max-w-none text-foreground/90">
            <p className="whitespace-pre-wrap">{description}</p>
          </div>
        </>
      )}

      <Separator />

      {/* 3 — Who from the body is going (+ the DNA-side action). */}
      {!isPast && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">From the body</h3>
          {goingCount > 0 ? (
            <div className="flex items-center gap-3">
              {attendeePreview.length > 0 && (
                <div className="flex -space-x-2">
                  {attendeePreview.map((a) => (
                    <Avatar key={a.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={a.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(a.full_name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <p className="text-sm text-foreground">
                {goingCount} {goingCount === 1 ? 'Member is' : 'Members are'} going
                {chapterCount > 0 && (
                  <span className="text-muted-foreground"> · {chapterCount} from your chapter</span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Members have signed on yet.</p>
          )}
          <Button
            variant={isGoing ? 'default' : 'outline'}
            onClick={handleGoing}
            disabled={isSettingGoing}
          >
            {isGoing ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Going
              </>
            ) : (
              "I'm going"
            )}
          </Button>
        </div>
      )}

      {/* 4 — Go together (D052/D084). */}
      {!isPast && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Go together</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open a Space to coordinate travel, tickets, and meetups with Members who are going.
              </p>
            </div>
            <Button variant="outline" className="shrink-0" onClick={handleOpenSpace}>
              <Users className="h-4 w-4 mr-1.5" /> Open a Space
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 5 — The yield, after (D088): the room is gone; the people remain. */}
      {isPast && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">The yield</h3>
          {goingCount > 0 ? (
            <>
              <div className="flex items-center gap-3">
                {attendeePreview.length > 0 && (
                  <div className="flex -space-x-2">
                    {attendeePreview.map((a) => (
                      <Avatar key={a.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={a.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(a.full_name || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
                <p className="text-sm text-foreground">
                  {goingCount} {goingCount === 1 ? 'Member was' : 'Members were'} there
                  {chapterCount > 0 && (
                    <span className="text-muted-foreground">
                      {' '}
                      · {chapterCount} from your chapter
                    </span>
                  )}
                  .
                </p>
              </div>
              <Button variant="outline" onClick={handleOpenSpace}>
                <Users className="h-4 w-4 mr-1.5" /> Open a Space to follow up
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This event has passed. No Members marked themselves as going.
            </p>
          )}
        </div>
      )}

      {/* 6 — What DNA has not confirmed, in plain words, linked to the source. */}
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        {unconfirmed.length > 0 ? (
          <>DNA has not confirmed {unconfirmed.join(' or ')} for this event. </>
        ) : (
          <>DNA lists this event as seen at its source; details can change there. </>
        )}
        {curatedSourceUrl ? (
          <a
            href={curatedSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {sourceDomain || 'The source'} is authoritative
            <ExternalLink className="inline h-3 w-3 ml-0.5 align-[-1px]" />
          </a>
        ) : (
          <>The source is authoritative.</>
        )}
      </p>
    </div>
  );
}

export default CuratedEventPreview;

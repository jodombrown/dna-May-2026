/**
 * DNA | CONVENE — Curated Event Card
 *
 * Editorial / magazine-style card for DNA-curated events.
 * Visually distinct from user-hosted ConveneEventCard:
 *  - Emerald gradient top border (not amber left border)
 *  - "Curated by DNA" badge with MateMasie icon
 *  - Source attribution line with ExternalLink icon
 *  - Compact thumbnail layout
 *  - Two CTAs: "Interested" toggle + "View Event" external link
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, MapPin, Video, Globe, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatEventTime } from '@/utils/convene/formatEventTime';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { Nkonsonkonson } from '@/components/icons/adinkra';

export interface CuratedEventCardProps {
  event: EventPlaceInput & {
    id: string;
    title: string;
    description?: string | null;
    short_description?: string | null;
    start_time?: string;
    end_time?: string;
    cover_image_url?: string | null;
    banner_url?: string | null;
    image_url?: string | null;
    format?: string;
    is_virtual?: boolean;
    slug?: string | null;
    curated_source?: string | null;
    curated_source_url?: string | null;
    rsvp_status?: string | null;
    user_rsvp_status?: string | null;
  };
  variant?: 'full' | 'compact';
  showRsvp?: boolean;
  rsvpStatus?: 'going' | 'maybe' | 'not_going' | null;
  onRsvp?: (status: string) => void;
  className?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function CuratedEventCard({
  event,
  variant = 'full',
  rsvpStatus: rsvpStatusProp,
  onRsvp,
  className,
}: CuratedEventCardProps) {
  const navigate = useNavigate();
  const rsvpStatus = rsvpStatusProp ?? event.rsvp_status ?? event.user_rsvp_status ?? null;
  const isInterested = rsvpStatus === 'going' || rsvpStatus === 'maybe';

  const coverImg = event.cover_image_url || event.banner_url || event.image_url;
  const description = event.short_description || event.description;
  const sourceDomain = event.curated_source_url ? extractDomain(event.curated_source_url) : event.curated_source;
  const timeDisplay = formatEventTime(event.start_time, event.end_time);

  const locationText = formatEventPlace(event, 'compact') || event.location_name || null;

  const handleCardClick = () => {
    navigate(`/dna/convene/events/${event.slug || event.id}`);
  };

  const handleViewEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.curated_source_url) {
      window.open(event.curated_source_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/dna/convene/events/${event.slug || event.id}`);
    }
  };

  const handleInterested = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRsvp?.(isInterested ? 'not_going' : 'going');
  };

  // ── COMPACT VARIANT ────────────────────────────────
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative',
          'border-t-2',
          className,
        )}
        style={{ borderTopColor: '#4A8D77' }}
        onClick={handleCardClick}
      >
        <div className="p-4">
          {/* Curated badge */}
          <div className="flex items-center gap-1.5 mb-2">
            <Nkonsonkonson className="h-3 w-3 text-[hsl(var(--module-connect))]" />
            <span className="text-[11px] font-semibold text-[hsl(var(--module-connect))] uppercase tracking-wide">
              Curated by DNA
            </span>
          </div>

          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            {coverImg && (
              <div className="flex-shrink-0 w-[60px] h-[80px] rounded-lg overflow-hidden bg-muted">
                <img
                  src={coverImg}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
                {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                {timeDisplay && <span>{timeDisplay}</span>}
                {locationText && (
                  <>
                    <span className="text-border">·</span>
                    <span>{locationText}</span>
                  </>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* Source attribution */}
          {sourceDomain && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
              <span>via {sourceDomain}</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ── FULL VARIANT ───────────────────────────────────
  return (
    <Card
      className={cn(
        'overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative rounded-lg',
        'border-t-[3px] bg-gradient-to-b from-[hsl(var(--module-connect)/0.04)] via-transparent to-transparent',
        className,
      )}
      style={{ borderTopColor: '#4A8D77' }}
      onClick={handleCardClick}
    >
      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Curated badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Nkonsonkonson className="h-3.5 w-3.5 text-[hsl(var(--module-connect))]" />
          <span className="text-xs font-semibold text-[hsl(var(--module-connect))] uppercase tracking-wide">
            Curated by DNA
          </span>
        </div>

        {/* Editorial layout: thumbnail + info */}
        <div className="flex items-start gap-3 mb-3">
          {coverImg && (
            <div className="flex-shrink-0 w-[60px] h-[80px] rounded-lg overflow-hidden bg-muted">
              <img
                src={coverImg}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-[hsl(var(--module-connect))] transition-colors">
              {event.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-sm text-muted-foreground">
              {timeDisplay && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {timeDisplay}
                </span>
              )}
              {locationText && (
                <span className="flex items-center gap-1">
                  {event.format === 'virtual' || event.is_virtual
                    ? <Video className="h-3.5 w-3.5" />
                    : event.format === 'hybrid'
                      ? <Globe className="h-3.5 w-3.5" />
                      : <MapPin className="h-3.5 w-3.5" />
                  }
                  {locationText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        )}

        {/* Source attribution */}
        {sourceDomain && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <span>via {sourceDomain}</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTAs */}
        <div className="flex items-center gap-2 pt-2 mt-auto">
          <Button
            variant={isInterested ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 h-9 text-xs',
              isInterested
                ? 'bg-[hsl(var(--module-connect))] hover:bg-[hsl(var(--module-connect))]/90 text-white'
                : 'border-[hsl(var(--module-connect))]/30 text-[hsl(var(--module-connect))] hover:bg-[hsl(var(--module-connect))]/10',
            )}
            onClick={handleInterested}
          >
            <Heart className={cn('h-3.5 w-3.5 mr-1', isInterested && 'fill-current')} />
            {isInterested ? 'Interested' : 'Interested'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs"
            onClick={handleViewEvent}
          >
            View Event
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CuratedEventCard;

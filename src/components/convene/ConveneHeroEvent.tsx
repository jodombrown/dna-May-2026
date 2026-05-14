/**
 * DNA | CONVENE — Hero Event Section
 * Single commanding featured event at the top of the discovery hub.
 * Full-width cinematic with Copper accent and overlay text.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Video, Globe, Clock, Users } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeroEventProps {
  event: {
    id: string;
    title: string;
    slug?: string | null;
    start_time?: string;
    end_time?: string | null;
    location_name?: string | null;
    location_city?: string | null;
    cover_image_url?: string | null;
    event_type?: string | null;
    format?: string | null;
    max_attendees?: number | null;
    description?: string | null;
    short_description?: string | null;
    is_curated?: boolean;
    event_attendees?: Array<{ count: number }>;
    organizer?: {
      full_name: string;
      avatar_url?: string | null;
    } | null;
  };
}

export function ConveneHeroEvent({ event }: HeroEventProps) {
  const navigate = useNavigate();
  const imageUrl = (event as Record<string, unknown>).cover_image_url as string | null;
  const startDate = event.start_time ? new Date(event.start_time) : null;
  const attendeeCount = event.event_attendees?.[0]?.count ?? 0;

  const isVirtual = event.format === 'virtual';
  const isHybrid = event.format === 'hybrid';

  // Urgency
  const getUrgencyLabel = () => {
    if (!startDate) return null;
    if (isToday(startDate)) return { label: 'Today', color: 'bg-destructive' };
    if (isTomorrow(startDate)) return { label: 'Tomorrow', color: 'bg-destructive/90' };
    const days = differenceInDays(startDate, new Date());
    if (days <= 7) return { label: `${days} days away`, color: 'bg-module-convene' };
    return null;
  };
  const urgency = getUrgencyLabel();

  const handleClick = () => {
    navigate(`/dna/convene/events/${event.slug || event.id}`);
  };

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden cursor-pointer group shadow-xl"
      onClick={handleClick}
    >
      {/* Image — taller hero */}
      <div className="relative h-[240px] sm:h-[280px] md:h-[320px] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dna-copper/80 via-module-convene/60 to-dna-forest/80 flex items-center justify-center">
            <Calendar className="h-20 w-20 text-white/15" />
          </div>
        )}

        {/* Two-layer gradient overlay — bulletproof text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Featured label — top left */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-dna-copper hover:bg-dna-copper text-white border-0 text-xs font-semibold px-3 py-1 shadow-lg backdrop-blur-sm">
            Featured Event
          </Badge>
        </div>

        {/* Urgency — top right */}
        {urgency && (
          <div className="absolute top-4 right-4">
            <Badge className={cn(urgency.color, 'text-white border-0 text-xs font-semibold px-3 py-1 shadow-lg backdrop-blur-sm')}>
              <Clock className="h-3 w-3 mr-1" />
              {urgency.label}
            </Badge>
          </div>
        )}

        {/* Overlay text — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Category */}
          {event.event_type && (
            <span className="text-[11px] font-medium text-dna-copper uppercase tracking-wider mb-1.5 block" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              {event.event_type}
            </span>
          )}

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2 mb-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            {event.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm mb-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(startDate, 'EEE, MMM d · h:mm a')}
              </span>
            )}
            {isVirtual ? (
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> Online
              </span>
            ) : isHybrid ? (
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Hybrid
                {event.location_city && ` · ${event.location_city}`}
              </span>
            ) : event.location_city ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {event.location_city}
              </span>
            ) : null}
            {attendeeCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {attendeeCount} going
              </span>
            )}
          </div>

          {/* CTA */}
          <Button
            size="sm"
            className="bg-dna-copper hover:bg-dna-copper/90 text-white rounded-full px-6 h-9 font-semibold shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Explore Event
          </Button>
        </div>
      </div>
    </div>
  );
}

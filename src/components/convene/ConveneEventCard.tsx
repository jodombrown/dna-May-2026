import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Video, Globe, Users, Eye, Edit, BarChart3, CheckCircle2, HelpCircle, Clock } from 'lucide-react';
import { format, differenceInHours, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MutualAttendeesLine } from './MutualAttendeesLine';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { Nkonsonkonson } from '@/components/icons/adinkra';

export interface ConveneEventCardProps {
  event: EventPlaceInput & {
    id: string;
    title: string;
    start_time?: string;
    date_time?: string;
    end_time?: string;
    location?: string | null;
    cover_image_url?: string | null;
    banner_url?: string | null;
    image_url?: string | null;
    event_type?: string;
    format?: string;
    is_cancelled?: boolean;
    is_virtual?: boolean;
    slug?: string | null;
    max_attendees?: number | null;
    meeting_url?: string | null;
    organizer_id?: string;
    creator_profile?: {
      id?: string;
      full_name: string;
      avatar_url?: string;
      username?: string;
    } | null;
    organizer?: {
      id?: string;
      full_name: string;
      avatar_url?: string | null;
      username?: string;
    } | null;
    organizer_full_name?: string;
    organizer_avatar_url?: string | null;
    organizer_username?: string;
    is_curated?: boolean;
    curated_source?: string | null;
    curated_source_url?: string | null;
    attendee_count?: number;
    event_attendees?: Array<{ count: number }>;
    rsvp_status?: string | null;
    user_rsvp_status?: string | null;
  };
  variant?: 'full' | 'compact';
  showRsvp?: boolean;
  rsvpStatus?: 'going' | 'maybe' | 'not_going' | null;
  onRsvp?: (status: string) => void;
  showOrganizer?: boolean;
  showActions?: boolean;
  isOrganizer?: boolean;
  onClick?: () => void;
  showMutualAttendees?: boolean;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export function ConveneEventCard({
  event,
  variant = 'full',
  showRsvp = false,
  rsvpStatus: rsvpStatusProp,
  onRsvp,
  showOrganizer = true,
  showActions = false,
  isOrganizer = false,
  onClick,
  showMutualAttendees = true,
  className,
}: ConveneEventCardProps) {
  const navigate = useNavigate();

  // Normalize data
  const rsvpStatus = rsvpStatusProp ?? event.rsvp_status ?? event.user_rsvp_status ?? null;
  const attendeeCount =
    event.attendee_count ?? event.event_attendees?.[0]?.count ?? 0;
  const organizerName =
    event.organizer?.full_name ?? event.creator_profile?.full_name ?? event.organizer_full_name ?? '';
  const organizerAvatar =
    event.organizer?.avatar_url ?? event.creator_profile?.avatar_url ?? event.organizer_avatar_url ?? undefined;
  const organizerUsername =
    event.organizer?.username ?? event.creator_profile?.username ?? event.organizer_username;

  // Dates
  const rawDate = event.start_time || event.date_time;
  const startDate = rawDate ? new Date(rawDate) : null;
  const endDate = event.end_time ? new Date(event.end_time) : null;
  const monthAbbrev = startDate ? format(startDate, 'MMM').toUpperCase() : '';
  const dayNumber = startDate ? format(startDate, 'd') : '';
  const isPast = startDate ? startDate < new Date() : false;

  // Urgency calculation
  const getUrgencyChip = () => {
    if (!startDate || isPast) return null;
    const now = new Date();
    const hoursAway = differenceInHours(startDate, now);
    const daysAway = differenceInDays(startDate, now);

    if (isToday(startDate)) {
      return { label: 'Today', variant: 'today' as const, pulse: true };
    }
    if (isTomorrow(startDate)) {
      return { label: 'Tomorrow', variant: 'tomorrow' as const, pulse: false };
    }
    if (hoursAway <= 48) {
      return { label: `In ${hoursAway}h`, variant: 'urgent' as const, pulse: false };
    }
    if (daysAway <= 7) {
      return { label: `${daysAway} days away`, variant: 'soon' as const, pulse: false };
    }
    return null;
  };
  const urgency = getUrgencyChip();

  // Attendance capacity
  const capacityPercent = event.max_attendees
    ? Math.min(100, Math.round((attendeeCount / event.max_attendees) * 100))
    : null;
  const isNearCapacity = capacityPercent !== null && capacityPercent >= 80;

  // Location
  const getLocationInfo = () => {
    const isVirtual = event.is_virtual || event.format === 'virtual';
    const isHybrid = event.format === 'hybrid';
    const text = formatEventPlace(event, 'compact') || event.location_name;
    if (!text) return null;
    return {
      icon: isVirtual ? Video : isHybrid ? Globe : MapPin,
      text,
      pill: isVirtual || isHybrid,
    };
  };
  const locationInfo = getLocationInfo();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/dna/convene/events/${event.slug || event.id}`);
    }
  };

  const handleOrganizerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (organizerUsername) navigate(`/dna/${organizerUsername}`);
  };

  const imageUrl = event.cover_image_url || event.banner_url || event.image_url;

  // ── COMPACT VARIANT ────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-module-convene',
          event.is_cancelled && 'opacity-60',
          className,
        )}
        onClick={handleClick}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Date box */}
          <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold text-module-convene uppercase leading-none">
              {monthAbbrev}
            </span>
            <span className="text-lg font-bold leading-none mt-0.5">
              {dayNumber}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {event.event_type && (
                <Badge variant="secondary" className="capitalize text-xs">
                  {event.event_type}
                </Badge>
              )}
              {urgency && (
                <Badge
                  className={cn(
                    'text-xs border-0',
                    urgency.variant === 'today' && 'bg-destructive text-destructive-foreground',
                    urgency.variant === 'tomorrow' && 'bg-destructive/80 text-destructive-foreground',
                    urgency.variant === 'urgent' && 'bg-module-convene text-white',
                    urgency.variant === 'soon' && 'bg-module-convene/20 text-module-convene-dark',
                  )}
                >
                  {urgency.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1" />}
                  {urgency.label}
                </Badge>
              )}
              {isPast && <Badge variant="secondary" className="text-xs">Past</Badge>}
              {event.is_cancelled && (
                <Badge variant="destructive" className="text-xs">Cancelled</Badge>
              )}
            </div>
            <h3 className="font-semibold text-base leading-tight line-clamp-1 text-foreground">
              {event.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
              {startDate && <span>{format(startDate, 'MMM d, yyyy · h:mm a')}</span>}
              {locationInfo && (
                <span className="flex items-center gap-1">
                  <locationInfo.icon className="h-3 w-3" />
                  {locationInfo.text}
                </span>
              )}
            </div>

            {/* Mutual attendees in compact */}
            {showMutualAttendees && <MutualAttendeesLine eventId={event.id} />}

            {/* RSVP badge */}
            {rsvpStatus && (
              <Badge
                variant={rsvpStatus === 'going' ? 'default' : 'outline'}
                className={cn(
                  'mt-2 text-xs capitalize',
                  rsvpStatus === 'going' && 'bg-dna-copper text-white hover:bg-dna-copper-dark',
                )}
              >
                {rsvpStatus === 'going' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {rsvpStatus === 'maybe' && <HelpCircle className="h-3 w-3 mr-1" />}
                {rsvpStatus === 'going' ? 'Going ✓' : rsvpStatus}
              </Badge>
            )}
          </div>

          {/* Actions (host mode) */}
          {showActions && (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dna/convene/events/${event.slug || event.id}`);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {isOrganizer && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dna/convene/events/${event.slug || event.id}/analytics`);
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  {!isPast && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dna/convene/events/${event.slug || event.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Attendee count (non-action mode) */}
          {!showActions && attendeeCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Users className="h-3 w-3" />
              {attendeeCount}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ── FULL VARIANT — MAGNETIC CINEMATIC CARD ─────────────
  return (
    <Card
      className={cn(
        'overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-lg border-0 shadow-lg',
        event.is_cancelled && 'opacity-60',
        className,
      )}
      onClick={handleClick}
    >
      {/* Cinematic Banner Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-module-convene/70 via-dna-copper/60 to-module-convene-dark/80 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-white/20" />
          </div>
        )}

        {/* Two-layer gradient overlay — bulletproof chip legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Category chip — top left */}
        {event.event_type && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium capitalize" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {event.event_type}
            </span>
          </div>
        )}

        {/* Urgency chip — top right */}
        {urgency && !isPast && (
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 backdrop-blur-sm shadow-lg',
                urgency.variant === 'today' && 'bg-destructive text-white',
                urgency.variant === 'tomorrow' && 'bg-destructive/90 text-white',
                urgency.variant === 'urgent' && 'bg-module-convene text-white',
                urgency.variant === 'soon' && 'bg-module-convene text-white',
              )}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              {urgency.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              <Clock className="h-3 w-3" />
              {urgency.label}
            </span>
          </div>
        )}

        {/* Cancelled overlay */}
        {event.is_cancelled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="destructive" className="text-base px-4 py-1.5">Cancelled</Badge>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5">
        {/* Title — editorial typography */}
        <h3 className="font-bold text-lg leading-snug line-clamp-2 text-dna-forest group-hover:text-module-convene transition-colors">
          {event.title}
        </h3>

        {/* Location pill */}
        {locationInfo && (
          <div className="flex items-center gap-1.5">
            <locationInfo.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className={cn(
              'text-sm text-muted-foreground',
              locationInfo.pill && 'bg-muted px-2 py-0.5 rounded-full text-xs',
            )}>
              {locationInfo.text}
            </span>
          </div>
        )}

        {/* Date line */}
        {startDate && (
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-10 h-10 border border-module-convene/30 rounded-lg bg-module-convene-light flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-module-convene uppercase leading-none">
                {monthAbbrev}
              </span>
              <span className="text-base font-bold leading-none mt-0.5 text-module-convene-dark">
                {dayNumber}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">
                {format(startDate, 'EEEE, MMM d')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(startDate, 'h:mm a')}
                {endDate ? ` – ${format(endDate, 'h:mm a')}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Social Proof — Mutual Attendees */}
        {showMutualAttendees && <MutualAttendeesLine eventId={event.id} />}

        {/* Attendance capacity bar */}
        {event.max_attendees && attendeeCount > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isNearCapacity ? 'bg-dna-copper' : 'bg-primary',
                )}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {attendeeCount} of {event.max_attendees} spots
              {isNearCapacity && (
                <span className="text-dna-copper font-medium ml-1">· Almost full</span>
              )}
            </p>
          </div>
        )}

        {/* Footer — Organizer + CTA */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          {/* Left: Organizer or attendee count */}
          {event.is_curated ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-xs">
              <Nkonsonkonson className="h-3 w-3 mr-1" />
              Curated
            </Badge>
          ) : showOrganizer && organizerName ? (
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left min-w-0"
              onClick={handleOrganizerClick}
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={organizerAvatar} alt={organizerName} />
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                  {getInitials(organizerName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {organizerName}
              </span>
            </button>
          ) : attendeeCount > 0 && !event.max_attendees ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{attendeeCount} going</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Be the first to join</span>
          )}

          {/* Right: RSVP CTA */}
          {rsvpStatus === 'going' ? (
            <Badge className="bg-dna-copper hover:bg-dna-copper-dark text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Going ✓
            </Badge>
          ) : rsvpStatus === 'maybe' ? (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              <HelpCircle className="h-3 w-3 mr-1" />
              Maybe
            </Badge>
          ) : showRsvp && onRsvp ? (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 text-xs font-semibold h-8"
              onClick={(e) => {
                e.stopPropagation();
                onRsvp('going');
              }}
            >
              I'm Going
            </Button>
          ) : showActions && isOrganizer ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dna/convene/events/${event.slug || event.id}/edit`);
              }}
            >
              Manage
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default ConveneEventCard;

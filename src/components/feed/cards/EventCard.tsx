/**
 * Event Card for Universal Feed
 * 
 * Design System v2.2 Implementation:
 * - 2px Warm Amber full border (#F59E0B)
 * - Fetches event details for rich display
 * - Expandable card with full event info (type, timezone, virtual link, ticket info)
 * - RSVP CTA button
 * - Proper title display (never "Upcoming Event" as header)
 * - No "Location TBD" - hide if missing
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Video, 
  Globe,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Clock,
  ExternalLink,
  Ticket,
  Tag
} from 'lucide-react';
import { format as formatDate, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';
import { useEventDetailsForFeed } from '@/hooks/useEventDetailsForFeed';
import { Skeleton } from '@/components/ui/skeleton';

interface EventCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
}

// Format event type for display
const formatEventType = (type: string | null): string => {
  if (!type) return '';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Get event type badge color
const getEventTypeBadgeClass = (type: string | null): string => {
  const colors: Record<string, string> = {
    conference: 'bg-copper-100 text-copper-700 dark:bg-copper-900/30 dark:text-copper-300',
    workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    meetup: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    webinar: 'bg-copper-100 text-copper-700 dark:bg-copper-900/30 dark:text-copper-300',
    networking: 'bg-copper-100 text-copper-700 dark:bg-copper-900/30 dark:text-copper-300',
    social: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    other: 'bg-muted text-muted-foreground',
  };
  return colors[type || 'other'] || colors.other;
};

export const EventCard: React.FC<EventCardProps> = ({ item, currentUserId, onUpdate }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isOwnEvent = item.author_id === currentUserId;
  
  // Fetch full event details
  const { data: eventDetails, isLoading } = useEventDetailsForFeed(item.event_id);

  // Use fetched event details or fall back to feed item data
  const title = eventDetails?.title || item.event_title || item.title || 'Event';
  const description = eventDetails?.description || eventDetails?.short_description || item.content || '';
  const coverImage = eventDetails?.cover_image_url || item.media_url;
  const startTime = eventDetails?.start_time;
  const endTime = eventDetails?.end_time;
  const timezone = eventDetails?.timezone;
  const eventFormat = eventDetails?.format;
  const eventType = eventDetails?.event_type;
  const locationName = eventDetails?.location_name;
  const locationCity = eventDetails?.location_city;
  const locationCountry = eventDetails?.location_country;
  const meetingUrl = eventDetails?.meeting_url;
  const meetingPlatform = eventDetails?.meeting_platform;
  const attendeeCount = eventDetails?.attendee_count || 0;
  const maxAttendees = eventDetails?.max_attendees;
  const slug = eventDetails?.slug || item.event_id;
  const organizerName = eventDetails?.organizer_name || item.author_display_name;
  const organizerAvatar = eventDetails?.organizer_avatar || item.author_avatar_url;
  const isFree = eventDetails?.is_free ?? true;
  const ticketPriceCents = eventDetails?.ticket_price_cents;
  const speakers = eventDetails?.speakers;

  // Parse event dates
  const startDate = startTime ? parseISO(startTime) : null;
  const endDate = endTime ? parseISO(endTime) : null;
  const monthAbbrev = startDate ? formatDate(startDate, 'MMM').toUpperCase() : '';
  const dayNumber = startDate ? formatDate(startDate, 'd') : '';
  const dayOfWeek = startDate ? formatDate(startDate, 'EEEE') : '';
  const fullDate = startDate ? formatDate(startDate, 'MMMM d, yyyy') : '';
  const timeRange = startDate 
    ? `${formatDate(startDate, 'h:mm a')}${endDate ? ` - ${formatDate(endDate, 'h:mm a')}` : ''}`
    : '';

  // Build location string - hide if no valid location
  const getLocationInfo = () => {
    if (eventFormat === 'virtual') {
      return { 
        icon: Video, 
        primary: 'Virtual Event', 
        secondary: meetingPlatform || 'Online' 
      };
    }
    if (eventFormat === 'hybrid') {
      const locationParts = [locationName, locationCity].filter(Boolean);
      return { 
        icon: Globe, 
        primary: 'Hybrid Event', 
        secondary: locationParts.length > 0 ? locationParts.join(', ') : null 
      };
    }
    // In-person or unknown format
    const locationParts = [locationName, locationCity, locationCountry].filter(Boolean);
    if (locationParts.length === 0) {
      return null; // Don't show anything - no "Location TBD"
    }
    return { 
      icon: MapPin, 
      primary: locationParts[0], 
      secondary: locationParts.slice(1).join(', ') || null 
    };
  };

  const locationInfo = getLocationInfo();
  
  // Preview text for collapsed state
  const descriptionPreview = description.slice(0, 150);
  const hasMoreContent = description.length > 150 || eventType || timezone || (eventFormat !== 'in_person' && meetingUrl);

  const handleCardClick = () => {
    if (slug) {
      navigate(`/dna/convene/events/${slug}`);
    }
  };

  const handleRSVP = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (slug) {
      navigate(`/dna/convene/events/${slug}`);
    }
  };

  const handleJoinVirtual = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div 
        className="bg-card overflow-hidden rounded-xl border-2"
        style={{ borderColor: 'hsl(38 92% 50%)' }}
      >
        <Skeleton className="aspect-[2/1] w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-card overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg"
      style={{ borderColor: 'hsl(38 92% 50%)' }}
    >
      {/* Cover Image - Clickable */}
      <div 
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        {coverImage ? (
          <div className="aspect-[2/1] overflow-hidden relative">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[2/1] bg-gradient-to-br from-amber-500/60 via-amber-600 to-amber-700/80 flex items-center justify-center">
            <CalendarDays className="h-20 w-20 text-white/20" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Event Type Badge + Format Badge */}
        {(eventType || eventFormat) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {eventType && (
              <Badge variant="secondary" className={cn("text-xs", getEventTypeBadgeClass(eventType))}>
                {formatEventType(eventType)}
              </Badge>
            )}
            {eventFormat && eventFormat !== 'in_person' && (
              <Badge variant="outline" className="text-xs capitalize">
                {eventFormat === 'virtual' ? '🖥️ Virtual' : '🌐 Hybrid'}
              </Badge>
            )}
          </div>
        )}

        {/* Event Title - Primary Header */}
        <h3 
          className="font-bold text-xl sm:text-2xl leading-tight mb-3 line-clamp-2 text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={handleCardClick}
        >
          {title}
        </h3>

        {/* Date & Time - Calendar Box Style */}
        {startDate && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-12 h-12 border border-border rounded-lg overflow-hidden bg-background flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-primary uppercase leading-none">
                {monthAbbrev}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">
                {dayNumber}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{dayOfWeek}, {fullDate}</p>
              <p className="text-sm text-muted-foreground">{timeRange}</p>
            </div>
          </div>
        )}

        {/* Location - Only show if available */}
        {locationInfo && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 border border-border rounded-lg bg-background flex items-center justify-center">
              <locationInfo.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{locationInfo.primary}</p>
              {locationInfo.secondary && (
                <p className="text-sm text-muted-foreground truncate">{locationInfo.secondary}</p>
              )}
            </div>
          </div>
        )}

        {/* Description Preview (collapsed) */}
        {description && !isExpanded && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {descriptionPreview}
              {description.length > 150 && '...'}
            </p>
          </div>
        )}

        {/* EXPANDED SECTION - Full Event Details */}
        {isExpanded && (
          <div className="space-y-4 mb-4 pt-2 border-t border-border">
            {/* Full Description */}
            {description && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {/* Timezone */}
            {timezone && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Timezone:</span>
                <span className="font-medium text-foreground">{timezone}</span>
              </div>
            )}

            {/* Virtual Join Link */}
            {(eventFormat === 'virtual' || eventFormat === 'hybrid') && meetingUrl && (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJoinVirtual}
                  className="text-primary hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Join on {meetingPlatform || 'Virtual Platform'}
                </Button>
              </div>
            )}

            {/* Ticket Info */}
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              {isFree ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Free Event
                </Badge>
              ) : ticketPriceCents ? (
                <span className="font-medium text-foreground">
                  From ${(ticketPriceCents / 100).toFixed(2)}
                </span>
              ) : (
                <span className="text-muted-foreground">Tickets available</span>
              )}
            </div>

            {/* Speakers (if any) */}
            {speakers && speakers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Speakers</p>
                <div className="flex flex-wrap gap-2">
                  {speakers.slice(0, 3).map((speaker, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1">
                      {speaker.image_url && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={speaker.image_url} alt={speaker.name} />
                          <AvatarFallback className="text-[8px]">
                            {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-xs font-medium">{speaker.name}</span>
                      {speaker.title && (
                        <span className="text-xs text-muted-foreground">· {speaker.title}</span>
                      )}
                    </div>
                  ))}
                  {speakers.length > 3 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{speakers.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Learn More / Show Less Button */}
        {hasMoreContent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 mb-3 -ml-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Learn More
              </>
            )}
          </Button>
        )}

        {/* Host Info */}
        <div 
          className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dna/${item.author_username}`);
          }}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={organizerAvatar || ''} alt={organizerName || ''} />
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
              {(organizerName || 'DN').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Hosted by <span className="font-medium text-foreground">{organizerName}</span>
          </span>
        </div>

        {/* Footer: Attendees + RSVP */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {attendeeCount > 0 ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {attendeeCount} going
                  {maxAttendees && maxAttendees - attendeeCount > 0 && ` · ${maxAttendees - attendeeCount} spots left`}
                </span>
              </div>
            ) : (
              <span className="text-sm text-primary font-medium">Be the first to register</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* RSVP Button */}
            <Button
              size="sm"
              onClick={handleRSVP}
              className="bg-primary hover:bg-primary/90"
            >
              RSVP
            </Button>

            {/* Three-dot Menu */}
            <div onClick={(e) => e.stopPropagation()}>
              {isOwnEvent ? (
                <PostMenuOwn
                  postId={item.post_id}
                  authorId={item.author_id}
                  currentUserId={currentUserId}
                  content={item.content || ''}
                  isPinned={!!item.pinned_at}
                  commentsDisabled={!!item.comments_disabled}
                  onUpdate={onUpdate}
                />
              ) : (
                <PostMenuOthers
                  postId={item.post_id}
                  authorId={item.author_id}
                  authorName={item.author_display_name || item.author_username || 'User'}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
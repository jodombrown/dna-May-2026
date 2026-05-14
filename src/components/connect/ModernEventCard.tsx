import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Video, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Event } from '@/types/search';
import { format } from 'date-fns';
import { Sankofa } from '@/components/icons/adinkra';

interface ModernEventCardProps {
  event: Event;
  onEventClick: (event: Event) => void;
  onRegisterEvent: () => void;
  onCreatorClick?: (creatorId: string) => void;
}

const ModernEventCard: React.FC<ModernEventCardProps> = ({ 
  event, 
  onEventClick, 
  onRegisterEvent,
  onCreatorClick 
}) => {
  const eventBanner = event.cover_image_url || event.banner_url;
  const eventDate = event.start_time || event.date_time;
  const parsedDate = eventDate ? new Date(eventDate) : null;
  const endDate = event.end_time ? new Date(event.end_time) : null;
  
  // Date formatting
  const monthAbbrev = parsedDate ? format(parsedDate, 'MMM').toUpperCase() : '';
  const dayNumber = parsedDate ? format(parsedDate, 'd') : '';
  const dayOfWeek = parsedDate ? format(parsedDate, 'EEEE') : '';
  const fullDate = parsedDate ? format(parsedDate, 'MMMM d, yyyy') : 'Date TBD';
  const timeRange = parsedDate 
    ? `${format(parsedDate, 'h:mm a')}${endDate ? ` - ${format(endDate, 'h:mm a')}` : ''}`
    : '';

  // Location info - hide if not available
  const getLocationInfo = () => {
    if (event.format === 'virtual' || event.is_virtual) {
      return { icon: Video, text: 'Virtual Event', subtext: null };
    }
    if (event.format === 'hybrid') {
      const location = event.location || event.location_city || event.location_name;
      return { icon: Globe, text: 'Hybrid Event', subtext: location || null };
    }
    // Build location from available fields
    const locationParts = [event.location, event.location_name, event.location_city, event.location_country].filter(Boolean);
    if (locationParts.length === 0) {
      return null; // Hide section entirely
    }
    return { icon: MapPin, text: locationParts[0], subtext: locationParts.slice(1).join(', ') || null };
  };

  const locationInfo = getLocationInfo();
  const attendeeCount = event.attendee_count ?? 0;

  return (
    <Card 
      className="group cursor-pointer overflow-hidden bg-card hover:shadow-lg transition-all duration-300 w-full h-full flex flex-col rounded-xl border-2"
      style={{ borderColor: 'hsl(38 92% 50%)' }}
      onClick={() => onEventClick(event)}
    >
      {/* Cover Image - 2:1 aspect ratio */}
      {eventBanner ? (
        <div className="aspect-[2/1] overflow-hidden relative">
          <img
            src={eventBanner}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="aspect-[2/1] bg-gradient-to-br from-primary/60 via-primary to-primary/80 flex items-center justify-center">
          <Calendar className="h-16 w-16 text-primary-foreground/20" />
        </div>
      )}
      
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Event Title - Large & Bold */}
        <h3 className="font-bold text-xl leading-tight mb-4 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Host info or Curated Badge */}
        {(event as any).is_curated ? (
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              Curated by DNA
            </Badge>
          </div>
        ) : event.creator_profile ? (
          <button
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity text-left"
            onClick={(e) => {
              e.stopPropagation();
              onCreatorClick?.(event.creator_profile.id);
            }}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.creator_profile.avatar_url} alt={event.creator_profile.full_name} />
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                {(event.creator_profile.full_name || 'DN').split(' ').map(n => n[0]).join('') || 'DN'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate max-w-[150px]">
              {event.creator_profile.full_name}
            </span>
          </button>
        ) : null}

        {/* Date & Time - Luma-style with calendar box */}
        {parsedDate && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold text-primary uppercase leading-none">
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
            <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex items-center justify-center">
              <locationInfo.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{locationInfo.text}</p>
              {locationInfo.subtext && (
                <p className="text-sm text-muted-foreground truncate">{locationInfo.subtext}</p>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: Attendees */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          {attendeeCount > 0 ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{attendeeCount} going</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Be the first to register</span>
          )}

          <Button 
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={(e) => {
              e.stopPropagation();
              onRegisterEvent();
            }}
          >
            RSVP
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ModernEventCard;

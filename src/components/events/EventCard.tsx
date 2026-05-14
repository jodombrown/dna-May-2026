import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EventListItem } from '@/types/events';
import { Calendar, MapPin, Video, Users, Clock, Globe, CheckCircle2, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Nkonsonkonson } from '@/components/icons/adinkra';

interface EventCardProps {
  event: EventListItem;
  onRSVP?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
}

export function EventCard({ event, onRSVP }: EventCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Parse dates
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const monthAbbrev = format(startDate, 'MMM').toUpperCase();
  const dayNumber = format(startDate, 'd');
  const dayOfWeek = format(startDate, 'EEEE');
  const fullDate = format(startDate, 'MMMM d, yyyy');
  const timeRange = `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;

  // Location info - hide if not available
  const getLocationInfo = () => {
    if (event.format === 'virtual') {
      return { icon: Video, text: 'Virtual Event', subtext: null };
    }
    if (event.format === 'hybrid') {
      const location = event.location_city || event.location_name;
      return { icon: Globe, text: 'Hybrid Event', subtext: location || null };
    }
    // Build location from available fields
    const locationParts = [event.location_name, event.location_city, event.location_country].filter(Boolean);
    if (locationParts.length === 0) {
      return null; // Hide section entirely
    }
    return { icon: MapPin, text: locationParts[0], subtext: locationParts.slice(1).join(', ') || null };
  };

  const locationInfo = getLocationInfo();
  const attendeeCount = event.attendee_count || 0;
  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group rounded-xl border-2"
      style={{ borderColor: 'hsl(38 92% 50%)' }}
      onClick={() => navigate(`/dna/convene/events/${event.event_id}`)}
    >
      {/* Cover Image - 2:1 aspect ratio */}
      {event.cover_image_url ? (
        <div className="aspect-[2/1] overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[2/1] bg-gradient-to-br from-primary/60 via-primary to-primary/80 flex items-center justify-center">
          <Calendar className="h-16 w-16 text-primary-foreground/20" />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Event Title - Large & Bold */}
        <h3 className="font-bold text-xl leading-tight mb-4 line-clamp-2 text-foreground">
          {event.title}
        </h3>

        {/* Host info or Curated Badge */}
        {(event as any).is_curated ? (
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Nkonsonkonson className="h-3 w-3 mr-1" />
              Curated by DNA
            </Badge>
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dna/${event.organizer_username}`);
            }}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.organizer_avatar_url} alt={event.organizer_full_name} />
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                {getInitials(event.organizer_full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {event.organizer_full_name}
            </span>
          </div>
        )}

        {/* Date & Time - Luma-style with calendar box */}
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

        {/* Footer: Attendees + Status */}
        <div className="flex items-center justify-between pt-2">
          {attendeeCount > 0 ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {attendeeCount} going
                {isFull && <Badge variant="secondary" className="ml-2 text-xs">Full</Badge>}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Be the first to register</span>
          )}

          {/* RSVP Status */}
          {event.user_rsvp_status === 'going' ? (
            <Badge className="bg-primary hover:bg-primary/90">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Going
            </Badge>
          ) : event.user_rsvp_status === 'maybe' ? (
            <Badge variant="outline">
              <HelpCircle className="h-3 w-3 mr-1" />
              Maybe
            </Badge>
          ) : event.is_organizer ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dna/convene/events/${event.event_id}/edit`);
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

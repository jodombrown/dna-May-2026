
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users as UsersIcon, Image as ImageIcon, Video, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { eventStartMs, formatEventDateTime } from '@/lib/events/eventTime';
import { Event } from '@/types/search';
import { formatEventPlace } from '@/lib/events/formatPlace';
import ConnectDialogs from './ConnectDialogs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from "react-router-dom";
import { ROUTES } from '@/config/routes';

interface EventCardProps {
  event: Event;
  onRegister: () => void;
  isLoggedIn: boolean;
  onClick?: () => void;
}

// Event logo images - relevant to event types
const getEventLogo = (eventTitle: string, eventType: string) => {
  // Tech/Innovation events
  if (eventTitle.toLowerCase().includes('tech') || eventTitle.toLowerCase().includes('innovation')) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop'; // Tech/circuit board design
  }
  // Investment/Finance events
  if (eventTitle.toLowerCase().includes('investment') || eventTitle.toLowerCase().includes('finance')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&h=150&fit=crop'; // Financial/growth chart
  }
  // Healthcare events
  if (eventTitle.toLowerCase().includes('health')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=150&fit=crop'; // Medical/health symbol
  }
  // Agriculture events
  if (eventTitle.toLowerCase().includes('agri')) {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop'; // Agriculture/farming
  }
  // Climate/Environment events
  if (eventTitle.toLowerCase().includes('climate') || eventTitle.toLowerCase().includes('environment')) {
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop'; // Nature/environment
  }
  // Women/Leadership events
  if (eventTitle.toLowerCase().includes('women') || eventTitle.toLowerCase().includes('leadership')) {
    return 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop'; // Leadership/empowerment symbol
  }
  // Default event logo
  return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=150&h=150&fit=crop'; // Conference/networking
};

// Event banner images - contextually relevant
const getEventBanner = (eventTitle: string, eventType: string) => {
  // Tech events
  if (eventTitle.toLowerCase().includes('tech') || eventTitle.toLowerCase().includes('innovation')) {
    return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&h=300&fit=crop'; // Tech conference
  }
  // Investment events
  if (eventTitle.toLowerCase().includes('investment') || eventTitle.toLowerCase().includes('finance')) {
    return 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=700&h=300&fit=crop'; // Business meeting
  }
  // Healthcare events
  if (eventTitle.toLowerCase().includes('health')) {
    return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&h=300&fit=crop'; // Healthcare conference
  }
  // Agriculture events
  if (eventTitle.toLowerCase().includes('agri')) {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&h=300&fit=crop'; // Agricultural field
  }
  // Climate events
  if (eventTitle.toLowerCase().includes('climate') || eventTitle.toLowerCase().includes('environment')) {
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&h=300&fit=crop'; // Environmental/forest
  }
  // Women/Networking events
  if (eventTitle.toLowerCase().includes('women') || eventTitle.toLowerCase().includes('networking')) {
    return 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=700&h=300&fit=crop'; // Professional networking
  }
  // Default conference banner
  return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&h=300&fit=crop';
};

// Event creator images - diverse African professionals
const getEventCreatorImage = (eventTitle: string) => {
  const creatorImages: { [key: string]: string } = {
    'African Tech': 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', // African man - tech professional
    'Diaspora Investment': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', // African man - business professional
    'Women in Finance': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', // African woman - finance professional
    'Climate Solutions': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face', // African woman - environmental professional
    'Healthcare Innovation': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', // African man - healthcare professional
    'AgriTech': 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face' // African man - agriculture professional
  };

  // Find matching creator image based on event title keywords
  for (const [keyword, image] of Object.entries(creatorImages)) {
    if (eventTitle.includes(keyword)) {
      return image;
    }
  }

  // Default to first African professional if no match found
  return 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face';
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  isLoggedIn,
  onClick,
}) => {
  const [isRegisterEventDialogOpen, setIsRegisterEventDialogOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggedIn) {
      onRegister();
    } else {
      setIsRegisterEventDialogOpen(true);
    }
  };

  const eventBanner = event.banner_url || event.cover_image_url;
  const eventDate = event.start_time || event.date_time;
  const eventDateMs = eventStartMs({ start_time: eventDate, date_confirmed: event.date_confirmed });
  const parsedDate = eventDateMs !== null ? new Date(eventDateMs) : null;
  
  // Date formatting
  const monthAbbrev = parsedDate ? format(parsedDate, 'MMM').toUpperCase() : '';
  const dayNumber = parsedDate ? format(parsedDate, 'd') : '';
  const dayOfWeek = parsedDate ? format(parsedDate, 'EEEE') : '';
  const fullDate = parsedDate ? format(parsedDate, 'MMMM d, yyyy') : '';
  const timeRange = formatEventDateTime(
    { start_time: eventDate, time_confirmed: event.time_confirmed, date_confirmed: event.date_confirmed },
    'clock'
  );

  // Location info - hide if not available
  const getLocationInfo = () => {
    if (event.is_virtual || event.format === 'virtual') {
      return { icon: Video, text: 'Virtual Event', subtext: null };
    }
    if (event.format === 'hybrid') {
      const location = event.location || event.location_city || event.location_name;
      return { icon: Globe, text: 'Hybrid Event', subtext: location || null };
    }
    // Build location from available fields
    const text = event.location || event.location_name || formatEventPlace(event, 'compact');
    if (!text) {
      return null; // Hide section entirely
    }
    return { icon: MapPin, text, subtext: null };
  };

  const locationInfo = getLocationInfo();
  const attendeeCount = event.attendee_count ?? 0;

  return (
    <>
      <Card
        className="hover:shadow-lg transition-all cursor-pointer overflow-hidden group rounded-xl border-2"
        style={{ borderColor: 'hsl(38 92% 50%)' }}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`View event: ${event.title}`}
      >
        {/* Cover Image - 2:1 aspect ratio */}
        {eventBanner ? (
          <div className="aspect-[2/1] overflow-hidden">
            <img
              src={eventBanner}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
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

          {/* Host info */}
          {event.creator_profile && (
            <button
              className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigate(ROUTES.profile.view(event.creator_profile.username || event.creator_profile.id));
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
          )}

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
                {fullDate && (
                  <p className="font-medium text-sm text-foreground">{dayOfWeek}, {fullDate}</p>
                )}
                {timeRange && <p className="text-sm text-muted-foreground">{timeRange}</p>}
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

          {/* Footer: Attendees + RSVP */}
          <div className="flex items-center justify-between pt-2">
            {attendeeCount > 0 ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>{attendeeCount} going</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Be the first to register</span>
            )}

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={handleRegisterClick}
            >
              RSVP
            </Button>
          </div>
        </div>
      </Card>

      <ConnectDialogs
        isConnectDialogOpen={false}
        setIsConnectDialogOpen={() => {}}
        isMessageDialogOpen={false}
        setIsMessageDialogOpen={() => {}}
        isJoinCommunityDialogOpen={false}
        setIsJoinCommunityDialogOpen={() => {}}
        isRegisterEventDialogOpen={isRegisterEventDialogOpen}
        setIsRegisterEventDialogOpen={setIsRegisterEventDialogOpen}
      />
    </>
  );
};

export default EventCard;

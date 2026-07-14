import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowRight, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import { EVENT_PLACE_SELECT, formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';
import { EventTime } from '@/components/events/EventTime';

interface EventItem extends EventPlaceInput {
  id: string;
  title: string;
  start_time: string | null;
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  format: string;
  event_type: string;
  organizer_id: string;
  rsvp_status?: string;
}

interface MyEventsData {
  hosting: EventItem[];
  attending: EventItem[];
}

export const UpcomingEventsSection = ({ onCreateEvent }: { onCreateEvent?: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'attending' | 'hosting'>('attending');

  const { data: myEvents, isLoading } = useQuery<MyEventsData>({
    queryKey: ['my-upcoming-events', user?.id],
    queryFn: async () => {
      try {
        if (!user) return { hosting: [], attending: [] };
        
        const now = new Date().toISOString();
        
        // Fetch hosting events
        const { data: hosting, error: hostingError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            start_time,
            time_confirmed,
            date_confirmed,
            format,
            event_type,
            organizer_id,
            ${EVENT_PLACE_SELECT}
          `)
          .eq('organizer_id', user.id)
          .neq('status', 'cancelled')
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(5);

        if (hostingError) {
          logger.warn('UpcomingEventsSection', 'Failed to fetch hosting events:', hostingError);
        }

        // Fetch attending events
        const { data: attendeeData, error: attendeeError } = await supabase
          .from('event_attendees')
          .select('event_id, status')
          .eq('user_id', user.id)
          .in('status', ['going', 'maybe']);

        if (attendeeError) {
          logger.warn('UpcomingEventsSection', 'Failed to fetch attendee data:', attendeeError);
        }

        let attending: EventItem[] = [];
        if (attendeeData && attendeeData.length > 0) {
          const eventIds = attendeeData.map(a => a.event_id);
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select(`
              id,
              title,
              start_time,
              time_confirmed,
              format,
              event_type,
              organizer_id,
              ${EVENT_PLACE_SELECT}
            `)
            .in('id', eventIds)
            .neq('status', 'cancelled')
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(5);

          if (eventsError) {
            logger.warn('UpcomingEventsSection', 'Failed to fetch attending events:', eventsError);
          }

          attending = events?.map(event => ({
            ...event,
            rsvp_status: attendeeData.find(a => a.event_id === event.id)?.status
          })) || [];
        }

        return {
          hosting: hosting || [],
          attending: attending || []
        };
      } catch (error) {
        logger.warn('UpcomingEventsSection', 'Failed to fetch events:', error);
        return { hosting: [], attending: [] };
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  const displayEvents = activeTab === 'hosting' ? (myEvents?.hosting || []) : (myEvents?.attending || []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Your Upcoming Events</h2>
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!myEvents?.hosting?.length && !myEvents?.attending?.length) {
    return null; // Hide section if no events
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Upcoming Events</h2>
        <Button
          variant="ghost"
          onClick={() => navigate('/dna/convene/my-events')}
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'attending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('attending')}
          className={activeTab === 'attending' ? 'bg-[hsl(var(--module-convene))] hover:bg-[hsl(var(--module-convene-dark))] text-white' : ''}
        >
          Attending ({myEvents?.attending?.length || 0})
        </Button>
        <Button
          variant={activeTab === 'hosting' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('hosting')}
          className={activeTab === 'hosting' ? 'bg-[hsl(var(--module-convene))] hover:bg-[hsl(var(--module-convene-dark))] text-white' : ''}
        >
          Hosting ({myEvents?.hosting?.length || 0})
        </Button>
      </div>

      <div className="space-y-3">
        {displayEvents.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              {activeTab === 'attending' 
                ? "You're not attending any events yet. Explore events to get started."
                : "You're not hosting any events yet. Host one and invite your community."}
            </p>
            <Button
              onClick={() => activeTab === 'attending' ? navigate('/dna/convene/events') : onCreateEvent?.()}
              variant="outline"
            >
              {activeTab === 'attending' ? 'Explore Events' : 'Host an Event'}
            </Button>
          </Card>
        ) : (
          displayEvents.map((event: EventItem) => (
            <Card
              key={event.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/dna/convene/events/${event.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <EventTime
                        event={{
                          start_time: event.start_time,
                          time_confirmed: event.time_confirmed,
                          date_confirmed: event.date_confirmed,
                        }}
                        eventId={event.id}
                        variant="datetime"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatEventPlace(event, 'compact')}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={event.format === 'virtual' ? 'secondary' : 'default'} className="capitalize">
                    {event.format}
                  </Badge>
                  {event.organizer_id === user?.id && (
                    <Badge variant="outline" className="text-dna-emerald border-dna-emerald text-xs">
                      Host
                    </Badge>
                  )}
                  {event.rsvp_status && (
                    <Badge variant={event.rsvp_status === 'going' ? 'default' : 'secondary'} className="text-xs capitalize">
                      {event.rsvp_status}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

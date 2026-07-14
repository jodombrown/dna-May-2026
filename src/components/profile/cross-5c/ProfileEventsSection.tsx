import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { EventTime } from '@/components/events/EventTime';

interface ProfileEventsSectionProps {
  userId: string;
  limit?: number;
}

export const ProfileEventsSection: React.FC<ProfileEventsSectionProps> = ({ userId, limit = 5 }) => {
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ['profile-events', userId],
    queryFn: async () => {
      // Get events where user is organizer or attendee
      const { data: hostedEvents, error: hostedError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (hostedError) throw hostedError;

      const { data: attendeeEvents, error: attendeeError } = await supabase
        .from('event_attendees')
        .select(`
          status,
          events (
            id,
            title,
            description,
            start_time,
            time_confirmed,
            event_type,
            format,
            organizer_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'going')
        .limit(limit);

      if (attendeeError) throw attendeeError;

      // Combine and deduplicate
      const allEvents = [
        ...hostedEvents.map(e => ({ ...e, isOrganizer: true })),
        ...(attendeeEvents || [])
          .filter((a: { status: string; events: { id: string; title: string; description: string | null; start_time: string; time_confirmed: boolean | null; event_type: string; format: string; organizer_id: string } | null }) => a.events && a.events.organizer_id !== userId)
          .map((a: { status: string; events: { id: string; title: string; description: string | null; start_time: string; time_confirmed: boolean | null; event_type: string; format: string; organizer_id: string } | null }) => ({ ...a.events!, isOrganizer: false })),
      ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
       .slice(0, limit);

      return allEvents;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return null; // Hide section if no events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event: { id: string; title: string; description?: string | null; start_time: string; event_type?: string; format?: string; isOrganizer: boolean }) => (
            <div
              key={event.id}
              className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              onClick={() => navigate(`/dna/convene/events/${event.id}`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {event.isOrganizer ? 'Hosting' : 'Attending'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <EventTime
                    event={{
                      start_time: event.start_time,
                      time_confirmed:
                        (event as { time_confirmed?: boolean | null }).time_confirmed ?? null,
                    }}
                    variant="datetime"
                  />
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {event.description}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate('/dna/convene/events')}
          >
            View all events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

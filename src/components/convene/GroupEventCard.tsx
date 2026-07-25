import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventTime } from '@/components/events/EventTime';
import { eventStartMs, formatEventDateTime } from '@/lib/events/eventTime';
import { formatEventPlace } from '@/lib/events/formatPlace';
import { formatEventFormat } from '@/lib/events/eventFormat';
import { Event } from '@/types/events';

interface GroupEventCardProps {
  event: Event;
}

export function GroupEventCard({ event }: GroupEventCardProps) {
  const navigate = useNavigate();
  const startMs = eventStartMs(event);
  const isPast = startMs !== null && startMs < Date.now();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/dna/convene/events/${event.id}`)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">{event.event_type}</Badge>
              <Badge variant="outline">{formatEventFormat(event.format)}</Badge>
              {isPast && <Badge variant="secondary">Past</Badge>}
              {event.is_cancelled && <Badge variant="destructive">Cancelled</Badge>}
            </div>
            <CardTitle className="text-h3">{event.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">{event.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-body text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <EventTime
              event={{ ...event, time_confirmed: event.time_confirmed ?? null, date_confirmed: event.date_confirmed ?? null }}
              variant="date"
            />
          </div>
          {formatEventDateTime({ ...event, time_confirmed: event.time_confirmed ?? null, date_confirmed: event.date_confirmed ?? null }, 'clock') && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatEventDateTime({ ...event, time_confirmed: event.time_confirmed ?? null, date_confirmed: event.date_confirmed ?? null }, 'clock')}</span>
            </div>
          )}
          {event.format !== 'virtual' && formatEventPlace(event, 'compact') && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{formatEventPlace(event, 'compact')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span>View attendees</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// tripwire certification probe — this line reintroduces the retired operating system framing to prove the gate fires; branch is discarded after the red run

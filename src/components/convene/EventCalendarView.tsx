import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { EventPlaceInput } from '@/lib/events/formatPlace';
import './EventCalendarView.css';

const localizer = momentLocalizer(moment);

interface Event extends EventPlaceInput {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  time_confirmed?: boolean | null;
  format: 'in_person' | 'virtual' | 'hybrid';
  event_type?: string;
}

interface EventCalendarViewProps {
  events: Event[];
  onCreateEvent?: () => void;
}

export const EventCalendarView = ({ events, onCreateEvent }: EventCalendarViewProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Transform events to react-big-calendar format
  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        // An unconfirmed hour renders as an all-day entry — the grid never
        // places it at a fabricated clock position.
        allDay: event.time_confirmed === false,
        resource: event,
      })),
    [events]
  );

  const handleSelectEvent = useCallback(
    (event: { id: string; title: string; start: Date; end: Date; resource: Event }) => {
      navigate(`/dna/convene/events/${event.id}`);
    },
    [navigate]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => {
      // Open composer for event creation
      onCreateEvent?.();
    },
    [navigate]
  );

  const eventStyleGetter = useCallback((event: { id: string; title: string; start: Date; end: Date; resource: Event }) => {
    const isVirtual = event.resource.format === 'virtual';
    const isHybrid = event.resource.format === 'hybrid';

    return {
      style: {
        backgroundColor: isVirtual
          ? 'hsl(var(--chart-2))'
          : isHybrid
          ? 'hsl(var(--chart-3))'
          : 'hsl(var(--primary))',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span>In Person</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
              <span>Virtual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
              <span>Hybrid</span>
            </div>
          </div>
        </div>
        <Button onClick={() => onCreateEvent?.()} size="sm">
          Host an Event
        </Button>
      </div>

      <div className="calendar-container" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        />
      </div>
    </Card>
  );
};

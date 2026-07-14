
import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '@/types/search';
import { DATES_TBA, formatEventDateTime } from '@/lib/events/eventTime';

interface EventDetailsSectionProps {
  event: Event;
}

const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ event }) => {
  // Real fields only — never a date derived from the title. The one
  // renderer decides whether an hour may print.
  const timeInput = {
    start_time: event.start_time || event.date_time || null,
    end_time: event.end_time || null,
    time_confirmed: event.time_confirmed,
    date_confirmed: event.date_confirmed,
  };
  const dateLine = formatEventDateTime(timeInput, 'date') || DATES_TBA;
  const clockLine = formatEventDateTime(timeInput, 'clock');


  return (
    <div className="space-y-4">
      {dateLine && (
        <div className="flex items-center gap-3 text-neutral-700">
          <Calendar className="w-5 h-5 text-dna-emerald" />
          <div>
            <div className="font-medium">{dateLine}</div>
            {clockLine && <div className="text-sm text-neutral-500">{clockLine}</div>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-neutral-700">
        <MapPin className="w-5 h-5 text-dna-emerald" />
        <div>
          <div className="font-medium">{event.location}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-neutral-700">
        <Users className="w-5 h-5 text-dna-emerald" />
        <div>
          <div className="font-medium">{event.attendee_count} attending</div>
          {event.max_attendees && (
            <div className="text-sm text-neutral-500">
              {event.max_attendees - event.attendee_count} spots remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsSection;

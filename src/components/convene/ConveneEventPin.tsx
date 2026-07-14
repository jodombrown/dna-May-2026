/**
 * DNA | CONVENE — Custom Map Marker for Events
 * Uses Leaflet's DivIcon for convene-amber styled pins on the discovery map.
 */

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatEventDateTime } from '@/lib/events/eventTime';
import { formatEventPlace, type EventPlaceInput } from '@/lib/events/formatPlace';

export interface MapEventData extends EventPlaceInput {
  id: string;
  title: string;
  slug: string | null;
  start_time: string | null;
  end_time: string | null;
  time_confirmed: boolean | null;
  date_confirmed: boolean | null;
  location_lat: number;
  location_lng: number;
  cover_image_url: string | null;
  event_type: string | null;
  format: string | null;
  max_attendees: number | null;
  attendee_count: number;
}

interface ConveneEventPinProps {
  event: MapEventData;
  onClick: (eventId: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  conference: '🎤',
  workshop: '💡',
  networking: '🤝',
  meetup: '📍',
  webinar: '🖥',
  social: '🎨',
  other: '💼',
};

function createEventIcon(eventType: string | null): L.DivIcon {
  const emoji = CATEGORY_EMOJI[eventType || 'other'] || '📅';
  return L.divIcon({
    className: 'convene-event-pin',
    html: `<div style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: hsl(39 65% 47%);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export function ConveneEventPin({ event, onClick }: ConveneEventPinProps) {
  const icon = createEventIcon(event.event_type);
  const placeText = formatEventPlace(event, 'compact');

  return (
    <Marker
      position={[event.location_lat, event.location_lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(event.id),
      }}
    >
      <Popup>
        <div className="min-w-[200px] max-w-[260px]">
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-24 object-cover rounded-t-md -mt-3 -mx-3 mb-2"
              style={{ width: 'calc(100% + 24px)', maxWidth: 'calc(100% + 24px)' }}
            />
          )}
          <p className="font-semibold text-sm leading-tight mb-1">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatEventDateTime(event, 'compact')}
          </p>
          {(event.location_name || placeText) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[event.location_name, placeText].filter(Boolean).join(' · ')}
            </p>
          )}
          {event.attendee_count > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {event.attendee_count} attending
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

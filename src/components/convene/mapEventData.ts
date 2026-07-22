/**
 * DNA | CONVENE — shared shape for an event plotted on the discovery map.
 *
 * Lived in ConveneEventPin (Leaflet) until that component was removed in the
 * Mapbox migration; extracted here so ConveneMapView and ConveneDiscovery can
 * keep importing the type without depending on a map library.
 */
import { type EventPlaceInput } from '@/lib/events/formatPlace';

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

/**
 * DNA | CONVENE — Map View
 * LAZY LOADED via React.lazy(). Shows events on an interactive Mapbox GL map.
 * Default export required for React.lazy() compatibility.
 *
 * Migrated from react-leaflet to Mapbox GL JS (loaded at runtime from the
 * official CDN — see src/lib/mapbox/loadMapbox.ts — so the app takes no
 * `mapbox-gl` npm dependency). Event pins stay at the same coordinates with the
 * same click-to-open behavior; the old Leaflet-only ConveneEventPin is gone.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import {
  loadMapbox,
  getMapboxToken,
  type MapboxMap,
  type MapboxMarker,
  type MapboxPopup,
} from '@/lib/mapbox/loadMapbox';
import { tokenColor } from '@/lib/mapbox/tokenColor';
import { type MapEventData } from './mapEventData';
import { formatEventDateTime } from '@/lib/events/eventTime';
import { formatEventPlace } from '@/lib/events/formatPlace';
import { logger } from '@/lib/logger';

export type { MapEventData };

interface ConveneMapViewProps {
  events: MapEventData[];
  selectedCity: string | null;
  onEventSelect: (eventId: string) => void;
}

// Default view: the African continent. Mapbox uses [lng, lat] order.
const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 3;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const CATEGORY_EMOJI: Record<string, string> = {
  conference: '🎤',
  workshop: '💡',
  networking: '🤝',
  meetup: '📍',
  webinar: '🖥',
  social: '🎨',
  other: '💼',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPinElement(event: MapEventData): HTMLElement {
  const el = document.createElement('div');
  el.className = 'convene-event-pin';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Open event: ${event.title}`);
  const emoji = CATEGORY_EMOJI[event.event_type || 'other'] || '📅';
  // Geometry + token-derived colors set imperatively (canvas-overlay marker,
  // not a JSX element) — the fill tracks --dna-copper, Convene's accent.
  el.style.cssText = [
    'width:36px',
    'height:36px',
    'border-radius:9999px',
    `background:${tokenColor('--dna-copper')}`,
    'border:3px solid white',
    `box-shadow:0 2px 8px ${tokenColor('--foreground', 0.3)}`,
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'font-size:16px',
    'cursor:pointer',
  ].join(';');
  el.textContent = emoji;
  return el;
}

function buildPopupHtml(event: MapEventData): string {
  const placeText = formatEventPlace(event, 'compact');
  const dateText = formatEventDateTime(event, 'compact');
  const place = [event.location_name, placeText].filter(Boolean).join(' · ');
  const cover = event.cover_image_url
    ? `<img src="${escapeHtml(event.cover_image_url)}" alt="" class="convene-popup-cover" />`
    : '';
  const dateRow = dateText
    ? `<p class="text-meta text-muted-foreground">${escapeHtml(dateText)}</p>`
    : '';
  const placeRow = place
    ? `<p class="text-meta text-muted-foreground">${escapeHtml(place)}</p>`
    : '';
  const attendeesRow =
    event.attendee_count > 0
      ? `<p class="text-meta text-muted-foreground">${event.attendee_count} attending</p>`
      : '';
  return [
    '<div class="convene-popup-body">',
    cover,
    `<p class="text-body font-semibold text-foreground">${escapeHtml(event.title)}</p>`,
    dateRow,
    placeRow,
    attendeesRow,
    '</div>',
  ].join('');
}

function ConveneMapView({ events, selectedCity, onEventSelect }: ConveneMapViewProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const popupRef = useRef<MapboxPopup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const token = getMapboxToken();

  // Filter to events with coordinates only.
  const mappableEvents = useMemo(
    () => events.filter((e) => e.location_lat != null && e.location_lng != null),
    [events],
  );

  // Keep the latest select handler without re-initialising the map.
  const onEventSelectRef = useRef(onEventSelect);
  useEffect(() => {
    onEventSelectRef.current = onEventSelect;
  }, [onEventSelect]);

  // ── Initialise the map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!token || !containerRef.current) return;
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 22,
          className: 'convene-popup',
        });
        map.once('load', () => {
          if (!cancelled) setMapReady(true);
        });
        mapRef.current = map;
      })
      .catch((err) => {
        logger.warn('ConveneMapView', 'Mapbox failed to load', err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token]);

  // ── Render markers whenever the event set changes ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear previous markers.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mappableEvents.length === 0) return;

    void loadMapbox().then((mapboxgl) => {
      if (mapRef.current !== map) return;
      const bounds = new mapboxgl.LngLatBounds();

      mappableEvents.forEach((event) => {
        const coords: [number, number] = [event.location_lng, event.location_lat];
        const el = buildPinElement(event);

        const openEvent = () => {
          onEventSelectRef.current(event.id);
          navigate(`/dna/convene/events/${event.slug || event.id}`);
        };
        el.addEventListener('click', openEvent);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openEvent();
          }
        });
        el.addEventListener('mouseenter', () => {
          popupRef.current?.setLngLat(coords).setHTML(buildPopupHtml(event)).addTo(map);
        });
        el.addEventListener('mouseleave', () => {
          popupRef.current?.remove();
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coords)
          .addTo(map);
        markersRef.current.push(marker);
        bounds.extend(coords);
      });

      if (mappableEvents.length === 1) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 0 });
      } else {
        map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 0 });
      }
    });
  }, [mapReady, mappableEvents, navigate]);

  if (!token || failed) {
    return (
      <div className="relative w-full h-map md:h-map-lg rounded-xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <MapPin className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-body text-muted-foreground">
            {token
              ? 'The map could not be loaded. Please try again later.'
              : 'Map unavailable: Mapbox token not configured.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-map md:h-map-lg rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full h-full" />

      {/* Event count overlay */}
      <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-border">
        <span className="text-meta font-medium text-foreground">
          {mappableEvents.length} event{mappableEvents.length !== 1 ? 's' : ''} on map
          {selectedCity && (
            <span className="text-muted-foreground"> in {selectedCity}</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default ConveneMapView;

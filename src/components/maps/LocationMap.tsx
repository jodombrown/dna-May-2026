import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  loadMapbox,
  getMapboxToken,
  type MapboxMap,
} from '@/lib/mapbox/loadMapbox';
import { tokenColor } from '@/lib/mapbox/tokenColor';
import { logger } from '@/lib/logger';

interface LocationMapProps {
  locationName?: string;
  locationAddress?: string;
  /** Pre-formatted "city, state, country" line from formatEventPlace(e, 'full'). */
  locality?: string;
  lat?: number;
  lng?: number;
  className?: string;
}

// Same Mapbox style used by DiasporaDensityMap — kept in lockstep on purpose.
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

/**
 * LocationMap — the unified event location card.
 *
 * WITH coordinates AND a known venue: renders a Mapbox GL map (CDN-loaded, no
 * npm dependency; see src/lib/mapbox/loadMapbox.ts) centred on lat/lng at zoom
 * 15 with a single marker, following the established DiasporaDensityMap pattern.
 *
 * WITHOUT coordinates (or without a Mapbox token, or on a map load failure):
 * renders the text lines and the Google/Apple Maps deep links ONLY — no map, no
 * placeholder, no default center, no stock image. This is the BD111
 * no-fabrication gate: an event with no real location must never show a map that
 * implies one.
 *
 * BD186 precision gate: a pin is a building-level claim. Coordinates with NO
 * venue name and NO street address are a geocoded city centroid — nobody chose
 * that point — so pinning them asserts precision the record does not have. The
 * map renders only when hasCoordinates AND hasVenue (a venue name or a street
 * address). With coordinates but no venue, the text lines and the deep links
 * still render — handing off to a maps app is fine — but NO map, and no
 * lower-zoom / greyed / "approximate" substitute. Nothing.
 */
export function LocationMap({
  locationName,
  locationAddress,
  locality,
  lat,
  lng,
  className,
}: LocationMapProps) {
  const token = getMapboxToken();
  const hasCoordinates = lat !== undefined && lng !== undefined && lat !== null && lng !== null;
  // BD186: a pin needs a building-level anchor. A venue name or a street
  // address is that anchor; bare coordinates are a city centroid nobody chose.
  const hasVenue = Boolean(locationName) || Boolean(locationAddress);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  const displayLocation = locality || '';

  // Deep-link builders carried over verbatim from EventLocationMap, including
  // the search-by-name fallback when coordinates are absent.
  const getGoogleMapsUrl = () => {
    if (hasCoordinates) {
      // Use @lat,lng,zoom format for direct coordinates
      return `https://www.google.com/maps/@${lat},${lng},17z`;
    }
    // Fallback to searching by name
    const searchQuery = [locationName, locationAddress, locality].filter(Boolean).join(', ');
    return `https://www.google.com/maps/place/${encodeURIComponent(searchQuery)}`;
  };

  const getAppleMapsUrl = () => {
    if (hasCoordinates) {
      // Use sll (start latitude/longitude) parameter with daddr for directions-compatible link
      return `https://maps.apple.com/?sll=${lat},${lng}&z=17&q=${encodeURIComponent(locationName || locality || 'Event Location')}`;
    }
    const searchQuery = [locationName, locationAddress, locality].filter(Boolean).join(', ');
    return `https://maps.apple.com/?address=${encodeURIComponent(searchQuery)}`;
  };

  const showMap = hasCoordinates && hasVenue && !!token && !mapFailed;

  // ── Initialise the map once (only with a token, real coordinates AND a
  //    known venue — BD186; without a venue no container is rendered) ────────
  useEffect(() => {
    if (!token || !hasCoordinates || !hasVenue || !containerRef.current) return;
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: [lng as number, lat as number],
          zoom: 15,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        new mapboxgl.Marker({ color: tokenColor('--dna-copper') })
          .setLngLat([lng as number, lat as number])
          .addTo(map);
        mapRef.current = map;
      })
      .catch((err) => {
        logger.warn('LocationMap', 'Mapbox failed to load', err);
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, hasCoordinates, hasVenue, lat, lng]);

  if (!locationName && !locality && !hasCoordinates) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Map Preview — rendered only when there are real coordinates, a known
            venue (BD186) AND a working Mapbox token. Otherwise no map is shown
            at all (BD111); the deep links below still hand off to a maps app. */}
        {showMap && (
          <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        )}

        {/* Location Details */}
        <div className="p-4 space-y-3">
          <div>
            {locationName && (
              <p className="text-body font-semibold text-foreground">{locationName}</p>
            )}
            {locationAddress && (
              <p className="text-meta text-muted-foreground">{locationAddress}</p>
            )}
            {displayLocation && (
              <p className="text-meta text-muted-foreground">{displayLocation}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Google Maps
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href={getAppleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Apple Maps
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LocationMap;

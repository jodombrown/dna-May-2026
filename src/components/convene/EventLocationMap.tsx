import { MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventLocationMapProps {
  locationName?: string;
  locationAddress?: string;
  /** Pre-formatted "city, state, country" line from formatEventPlace(e, 'full'). */
  locality?: string;
  lat?: number;
  lng?: number;
  className?: string;
}

/**
 * EventLocationMap - Displays a static map preview with location details
 * Uses OpenStreetMap tiles for map preview (no API key required)
 */
export function EventLocationMap({
  locationName,
  locationAddress,
  locality,
  lat,
  lng,
  className,
}: EventLocationMapProps) {
  const hasCoordinates = lat !== undefined && lng !== undefined && lat !== null && lng !== null;

  const displayLocation = locality || '';

  // Generate OpenStreetMap static image URL
  const getStaticMapUrl = () => {
    if (!hasCoordinates) return null;
    
    // Using OpenStreetMap static map tiles via a free service
    const zoom = 14;
    const width = 600;
    const height = 300;
    
    // Using tiles.stadiamaps.com which is free for limited usage
    // Alternative: OpenStreetMap's own tiles
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.01},${lat! - 0.005},${lng! + 0.01},${lat! + 0.005}&layer=mapnik&marker=${lat},${lng}`;
  };

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

  if (!locationName && !locality && !hasCoordinates) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Map Preview */}
        {hasCoordinates ? (
          <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
            <iframe
              title="Event Location Map"
              src={getStaticMapUrl() || ''}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Overlay gradient for better text visibility */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-32 bg-muted/50 rounded-t-lg flex items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}

        {/* Location Details */}
        <div className="p-4 space-y-3">
          <div>
            {locationName && (
              <h4 className="font-semibold text-foreground">{locationName}</h4>
            )}
            {locationAddress && (
              <p className="text-sm text-muted-foreground">{locationAddress}</p>
            )}
            {displayLocation && (
              <p className="text-sm text-muted-foreground">{displayLocation}</p>
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

export default EventLocationMap;

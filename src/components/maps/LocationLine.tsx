import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LocationMap } from '@/components/maps/LocationMap';
import { getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/maps/directions';
import { cn } from '@/lib/utils';

interface LocationLineProps {
  locationName?: string;
  locationAddress?: string;
  /** Pre-formatted "city, state, country" line from formatEventPlace(e, 'full'). */
  locality?: string;
  lat?: number;
  lng?: number;
  className?: string;
}

/**
 * LocationLine — the tappable location primitive (the BD175 spine, second half).
 *
 * Renders the place text as a single real <button>. Tapping opens a sheet with,
 * in order: the full place text, a <LocationMap>, and Google/Apple Maps
 * directions actions.
 *
 * The BD186 precision gate is NOT reimplemented here. <LocationMap> is rendered
 * unconditionally inside the sheet and decides for itself whether a pin is
 * warranted (it draws no map when coordinates lack a venue name or street).
 * Duplicating that rule is how it drifts, so this component holds no
 * coordinates-versus-venue logic and no is_curated branch.
 *
 * With no location data at all, renders nothing — consistent with LocationMap.
 */
export function LocationLine({
  locationName,
  locationAddress,
  locality,
  lat,
  lng,
  className,
}: LocationLineProps) {
  const [open, setOpen] = useState(false);

  const hasCoordinates =
    lat !== undefined && lng !== undefined && lat !== null && lng !== null;

  // Nothing to point at → render nothing, mirroring LocationMap.
  if (!locationName && !locationAddress && !locality && !hasCoordinates) {
    return null;
  }

  const placeText = [locationName, locationAddress, locality].filter(Boolean).join(', ');
  const directionsInput = { locationName, locationAddress, locality, lat, lng };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={placeText ? `Open location: ${placeText}` : 'Open location'}
        className={cn('block text-left transition-opacity hover:opacity-80', className)}
      >
        {locationName && (
          <span className="block font-medium text-foreground">{locationName}</span>
        )}
        {locationAddress && (
          <span className="block text-meta text-muted-foreground">{locationAddress}</span>
        )}
        {locality && (
          <span className="block text-meta text-muted-foreground">{locality}</span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            {/* 1 — the full place text */}
            <SheetTitle>{placeText || 'Location'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* 2 — the map, gated entirely by LocationMap (BD186) */}
            <LocationMap
              locationName={locationName}
              locationAddress={locationAddress}
              locality={locality}
              lat={lat}
              lng={lng}
            />

            {/* 3 — directions actions, from the shared deep-link builders */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href={getGoogleMapsUrl(directionsInput)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Google Maps
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href={getAppleMapsUrl(directionsInput)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Apple Maps
                </a>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default LocationLine;

/**
 * Resolved Chips — DIA hands you an answer, not a field (BD089)
 *
 * The interaction the founder approved in prototype:
 *
 *   "Saturday at 6pm"  →  [ 📅 Sat, Jul 18 · 6:00 PM · in 7 days   ✕ ]
 *   "Lagos"            →  [ 📍 Lagos, Nigeria                       ✕ ]
 *                          + a map, so a wrong match is visible
 *
 * The member sees the RESOLVED value. A bad parse is obvious now, not at submit
 * — which is where the old composer surfaced it ("DIA couldn't read that date"),
 * the worst possible moment.
 *
 * Dismiss a chip and the real picker appears. Progressive disclosure: the picker
 * only exists when it is needed.
 */

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, MapPinCheck, AlertTriangle, X, MapPin } from 'lucide-react';
import {
  ResolvedDate,
  ResolvedPlace,
  describeDate,
  geocodeCity,
  staticMapUrl,
} from '@/services/composeResolvers';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------

interface DateFieldProps {
  /** DIA's resolved date, if it read one. */
  resolved: ResolvedDate | null;
  /** Member cleared DIA's parse, or picked their own. */
  onChange: (resolved: ResolvedDate | null) => void;
  fromDIA: boolean;
}

export const ComposerDateField: React.FC<DateFieldProps> = ({ resolved, onChange, fromDIA }) => {
  // DIA read it → show the answer, not an input.
  if (resolved) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-lg border px-3 py-2.5',
          resolved.isPast
            ? 'border-destructive/40 bg-destructive/5'
            : fromDIA
              ? 'border-bevel-opportunity/45 bg-bevel-opportunity/5'
              : 'border-border bg-muted/40'
        )}
      >
        {resolved.isPast ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />
        ) : (
          <CalendarCheck className="h-4 w-4 flex-shrink-0 text-bevel-opportunity" />
        )}

        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{resolved.label}</span>
          <span
            className={cn(
              'ml-1.5 text-xs',
              resolved.isPast ? 'font-medium text-destructive' : 'text-muted-foreground'
            )}
          >
            · {resolved.distance}
          </span>
        </p>

        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Not this date"
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // DIA could not read it → a real picker, not a text box that fails at submit.
  return (
    <div>
      <Label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        When
      </Label>
      <Input
        type="datetime-local"
        className="h-9 text-sm"
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return onChange(null);
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) onChange(describeDate(d));
        }}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        Or just write it above — “Saturday at 6pm” — and DIA will resolve it.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------

interface PlaceFieldProps {
  /** The city as written or extracted. */
  city: string;
  onCityChange: (city: string) => void;
  /** Called when geocoding lands — the composer writes lat/lng on submit. */
  onResolve: (place: ResolvedPlace | null) => void;
  fromDIA: boolean;
  /** Convene's "why this matters" line. */
  purpose?: string;
}

export const ComposerPlaceField: React.FC<PlaceFieldProps> = ({
  city,
  onCityChange,
  onResolve,
  fromDIA,
  purpose,
}) => {
  const [place, setPlace] = useState<ResolvedPlace | null>(null);
  const [loading, setLoading] = useState(false);

  // Geocode on settle, not per keystroke — respects Nominatim fair use.
  useEffect(() => {
    if (!city.trim()) {
      setPlace(null);
      onResolve(null);
      return;
    }
    let live = true;
    setLoading(true);

    const t = setTimeout(async () => {
      const hit = await geocodeCity(city);
      if (!live) return;
      setPlace(hit);
      onResolve(hit);
      setLoading(false);
    }, 700);

    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  return (
    <div>
      <Label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Where
      </Label>

      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={city}
          placeholder="Lagos"
          onChange={(e) => onCityChange(e.target.value)}
          className={cn(
            'h-9 pl-8 text-sm',
            fromDIA && place && 'border-bevel-opportunity/45 bg-bevel-opportunity/5'
          )}
        />
      </div>

      {loading && <Skeleton className="mt-2 h-24 w-full rounded-lg" />}

      {!loading && place && (
        <>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <MapPinCheck className="h-3.5 w-3.5 flex-shrink-0 text-bevel-connect" />
            <span className="font-semibold">
              {place.city}
              {place.country && `, ${place.country}`}
            </span>
          </div>

          {/* Confirmation, not decoration: a wrong match is visible at a glance. */}
          <div className="mt-1.5 overflow-hidden rounded-lg border">
            <iframe
              title={`Map of ${place.city}`}
              src={staticMapUrl(place.lat, place.lng)}
              className="h-24 w-full border-0"
              loading="lazy"
            />
          </div>

          {purpose && <p className="mt-1.5 text-[11px] text-muted-foreground">{purpose}</p>}
        </>
      )}

      {!loading && city.trim() && !place && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Couldn’t place that one. It will still post — it just won’t show on the map.
        </p>
      )}
    </div>
  );
};

/**
 * PlaceSearchField — ONE search box. A place is RESOLVED, never typed.
 *
 * Replaces the three free-text venue/city/country inputs that corrupted the
 * data ("CA 90014" as a country). The organizer types "Jonathan Club Los
 * Angeles", taps a result, and venue / street / city / state / country /
 * coordinates fill themselves via placeToLocationPatch — all at once.
 *
 * Once chosen, the resolved place renders as a compact card (the CONSEQUENCE,
 * not the inputs) with a "Change" affordance. For gatherings Google doesn't
 * know — a house party, a new venue — "Can't find it? Enter it manually"
 * reveals separate, clearly labelled fields. The manual country is a SELECT
 * over the DNA taxonomy (alpha-3, src/lib/dna-place.ts), never free text.
 * Manual entry leaves location_place_id and lat/lng NULL by design.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  CONTINENTS,
  CONTINENT_COUNTRY_LIST,
  getCountryNameByAlpha3,
} from '@/lib/dna-place';
import type { EventFormValues } from '@/lib/events/eventFormSchema';
import {
  placeToLocationPatch,
  type PlaceSearchResponse,
  type PlaceSearchResult,
} from '@/lib/events/placeSearch';

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p data-field-error className="mt-1 text-xs text-destructive">
      {message}
    </p>
  ) : null;

export interface PlaceSearchFieldProps {
  values: EventFormValues;
  setValues: (patch: Partial<EventFormValues>) => void;
  errors: Partial<Record<string, string>>;
  /** Fired on blur of the manual city/country fields — lets the form refresh
   *  its live timezone line the way the old free-text inputs did. */
  onManualBlur?: () => void;
}

export function PlaceSearchField({
  values,
  setValues,
  errors,
  onManualBlur,
}: PlaceSearchFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // "Change" pressed on the card — back to the search box, values kept until
  // a new place is picked (abandoning the change keeps the current place).
  const [changing, setChanging] = useState(false);
  const [manualOpen, setManualOpen] = useState(
    () =>
      !values.location_place_id &&
      !!(
        values.location_name ||
        values.location_address ||
        values.location_city ||
        values.location_state ||
        values.location_country
      )
  );
  const seq = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasResolved = !!values.location_place_id;
  const showCard = hasResolved && !changing;

  // Debounced search — ~300ms after the last keystroke.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      seq.current++;
      setResults([]);
      setDropdownOpen(false);
      setSearching(false);
      setSearchError(null);
      return;
    }
    const timer = setTimeout(async () => {
      const mySeq = ++seq.current;
      setSearching(true);
      setSearchError(null);
      try {
        const { data, error } = await supabase.functions.invoke('place-search', {
          body: { query: q },
        });
        if (mySeq !== seq.current) return;
        if (error) throw new Error(error.message || 'Place search failed');
        const response = (data ?? {}) as PlaceSearchResponse;
        // The function surfaces its own failures as { error } — show them.
        if (response.error) throw new Error(response.error);
        setResults(Array.isArray(response.places) ? response.places : []);
        setDropdownOpen(true);
      } catch (err) {
        if (mySeq !== seq.current) return;
        console.error('[PlaceSearchField] search failed:', err);
        setResults([]);
        setDropdownOpen(false);
        setSearchError(
          err instanceof Error && err.message
            ? err.message
            : 'Place search failed — try again, or enter it manually below.'
        );
      } finally {
        if (mySeq === seq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside closes the dropdown.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const selectPlace = (place: PlaceSearchResult) => {
    // ALL location fields written at once — the resolved place is atomic.
    setValues(placeToLocationPatch(place));
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
    setSearchError(null);
    setChanging(false);
    setManualOpen(false);
  };

  // Manual edits break the resolution: place_id and coordinates go NULL.
  const setManual = (patch: Partial<EventFormValues>) =>
    setValues({
      ...patch,
      location_place_id: '',
      location_lat: null,
      location_lng: null,
    });

  const cityStateLine = [values.location_city, values.location_state]
    .filter(Boolean)
    .join(', ');

  // Errors on fields that are not currently rendered as inputs (manual closed,
  // or card shown) still surface here — no field fails invisibly.
  const hiddenErrorKeys = (
    manualOpen
      ? []
      : [
          'location_address',
          'location_city',
          'location_state',
          'location_country',
          'location_country_code',
        ]
  ).filter((key) => errors[key]);

  return (
    <div ref={rootRef} className="space-y-3">
      {showCard ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1 text-sm">
            {values.location_name && (
              <p className="font-medium">{values.location_name}</p>
            )}
            {values.location_address && (
              <p className="text-muted-foreground">{values.location_address}</p>
            )}
            {cityStateLine && <p className="text-muted-foreground">{cityStateLine}</p>}
            {values.location_country && (
              <p className="text-muted-foreground">{values.location_country}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setChanging(true)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search a venue, address, or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setDropdownOpen(true)}
            className="pl-9 pr-9"
            aria-label="Search a venue, address, or city"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
              {results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No places found — try different words, or enter it manually below.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto">
                  {results.map((place) => (
                    <li key={place.placeId}>
                      <button
                        type="button"
                        onClick={() => selectPlace(place)}
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-muted"
                      >
                        <span className="block text-sm font-semibold">
                          {place.name ?? place.formatted ?? 'Unnamed place'}
                        </span>
                        {place.formatted && (
                          <span className="block text-xs text-muted-foreground">
                            {place.formatted}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {changing && hasResolved && (
        <p className="text-xs text-muted-foreground">
          Still using {values.location_name || values.location_city} until you pick a
          new place.{' '}
          <button
            type="button"
            onClick={() => {
              setChanging(false);
              setQuery('');
              setDropdownOpen(false);
            }}
            className="underline hover:text-foreground"
          >
            Keep it
          </button>
        </p>
      )}

      {searchError && (
        <p data-field-error role="alert" className="text-xs text-destructive">
          {searchError}
        </p>
      )}
      <FieldError message={errors.location_name} />
      {hiddenErrorKeys.map((key) => (
        <FieldError key={key} message={errors[key]} />
      ))}

      {!showCard && !manualOpen && (
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Can’t find it? Enter it manually
        </button>
      )}

      {!showCard && manualOpen && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
          <div>
            <Label className="text-sm font-medium">Venue</Label>
            <Input
              placeholder="Adjeley’s Community Hall"
              value={values.location_name}
              onChange={(e) => setManual({ location_name: e.target.value })}
              className="mt-1.5"
            />
            {/* location_name's error renders above, next to the search box. */}
          </div>
          <div>
            <Label className="text-sm font-medium">Street</Label>
            <Input
              placeholder="12 Oxford Street"
              value={values.location_address}
              onChange={(e) => setManual({ location_address: e.target.value })}
              className="mt-1.5"
            />
            <FieldError message={errors.location_address} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">City</Label>
              <Input
                placeholder="Accra"
                value={values.location_city}
                onChange={(e) => setManual({ location_city: e.target.value })}
                onBlur={onManualBlur}
                className="mt-1.5"
              />
              <FieldError message={errors.location_city} />
            </div>
            <div>
              <Label className="text-sm font-medium">State / region</Label>
              <Input
                placeholder="Greater Accra"
                value={values.location_state}
                onChange={(e) => setManual({ location_state: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.location_state} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Country</Label>
            <Select
              value={values.location_country_code || undefined}
              onValueChange={(alpha3) => {
                setManual({
                  location_country_code: alpha3,
                  location_country: getCountryNameByAlpha3(alpha3) ?? '',
                });
                onManualBlur?.();
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent>
                {CONTINENTS.map((continent) => (
                  <SelectGroup key={continent.code}>
                    <SelectLabel>{continent.name}</SelectLabel>
                    {CONTINENT_COUNTRY_LIST[continent.code].map((country) => (
                      <SelectItem key={country.alpha3} value={country.alpha3}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.location_country ?? errors.location_country_code} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceSearchField;

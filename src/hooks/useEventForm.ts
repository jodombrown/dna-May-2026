/**
 * useEventForm — the ONE submit path for authoring events.
 *
 * State, validation (eventFormSchema), geocoding, timezone derivation, and
 * submission for both the inline composer (level="compact") and the full
 * form. Create goes through the create-event edge function; update goes
 * straight to supabase — and EVERY status/visibility write goes through
 * eventStateWrite() so the legacy boolean mirror stays in sync.
 *
 * TIMEZONE: derived from the event's location, never the browser. Virtual
 * events with no location fall back to the organizer's zone — the form says
 * so explicitly. start_time/end_time are stored as the UTC instants of the
 * event-local wall clock.
 *
 * GEOCODING: awaited INSIDE submit via the geocode-city edge function
 * (Nominatim + geocode_cache). A failed geocode never blocks the save —
 * lat/lng stay NULL and the form notes it quietly.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { eventStateWrite, type EventStatus } from '@/lib/events/state';
import {
  eventFormSchema,
  emptyEventFormValues,
  type EventFormValues,
} from '@/lib/events/eventFormSchema';
import {
  browserTimezone,
  formatTimeInZone,
  timezoneForLocation,
  wallTimeToUtc,
  zoneCityLabel,
} from '@/lib/events/timezone';
import { geocodeCity, type ResolvedPlace } from '@/services/composeResolvers';
import { invalidateAllEventCaches } from '@/lib/eventCacheInvalidation';

export type EventFormMode = 'create' | 'edit';

/** What pressing a submit button means for `status`. */
export type SubmitIntent =
  | 'publish' // status = 'published'
  | 'draft' // status = 'draft'
  | 'save'; // keep the current status untouched

export interface UseEventFormOptions {
  mode: EventFormMode;
  /** Required when mode === 'edit'. */
  eventId?: string;
  initialValues?: Partial<EventFormValues>;
  /** The status the event already has (edit mode). */
  currentStatus?: EventStatus;
  onSuccess?: (result: { eventId: string | null; status: EventStatus }) => void;
}

export interface EventTimezoneInfo {
  /** IANA zone the times will be stored against. */
  timezone: string;
  /** "Accra" — for "Doors 7:00 PM in Accra". */
  cityLabel: string;
  /** True when we fell back to the organizer's zone (virtual / unknown place). */
  isOrganizerFallback: boolean;
  /** "That's 12:00 PM for you." — null when viewer clock matches. */
  viewerEquivalent: string | null;
  /** "7:00 PM" in the event's zone, when a start time is set. */
  localStart: string | null;
}

export function useEventForm({
  mode,
  eventId,
  initialValues,
  currentStatus,
  onSuccess,
}: UseEventFormOptions) {
  const queryClient = useQueryClient();
  const [values, setValuesState] = useState<EventFormValues>(() =>
    emptyEventFormValues(initialValues)
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  // Country code from the last geocode — sharpens timezone derivation.
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const geocodeSeq = useRef(0);

  const setValues = useCallback((patch: Partial<EventFormValues>) => {
    setValuesState((prev) => ({ ...prev, ...patch }));
    // A field that changes sheds its error — errors resurface on submit.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }, []);

  // ---- Timezone: location → zone, live, so the consequence is visible -----
  const derivedTimezone = useMemo(() => {
    if (values.format === 'virtual') return null;
    return timezoneForLocation({
      countryCode: resolvedPlace?.countryCode ?? null,
      country: values.location_country || resolvedPlace?.country || null,
      lat: values.location_lat ?? resolvedPlace?.lat ?? null,
      lng: values.location_lng ?? resolvedPlace?.lng ?? null,
    });
  }, [values.format, values.location_country, values.location_lat, values.location_lng, resolvedPlace]);

  // No location-derived zone → the event's STORED zone (edits must not shift
  // the instant just because the organizer's browser moved), else the
  // organizer's zone — stated explicitly in the UI.
  const timezone = derivedTimezone ?? (values.timezone || browserTimezone());
  const isOrganizerFallback = derivedTimezone === null;

  const tzInfo: EventTimezoneInfo = useMemo(() => {
    const viewerZone = browserTimezone();
    let viewerEquivalent: string | null = null;
    let localStart: string | null = null;
    if (values.startDate && values.startTime) {
      const instant = wallTimeToUtc(values.startDate, values.startTime, timezone);
      localStart = formatTimeInZone(instant.toISOString(), timezone);
      const viewerClock = formatTimeInZone(instant.toISOString(), viewerZone);
      if (viewerZone !== timezone && viewerClock !== localStart) {
        viewerEquivalent = viewerClock;
      }
    }
    return {
      timezone,
      cityLabel: zoneCityLabel(timezone),
      isOrganizerFallback,
      viewerEquivalent,
      localStart,
    };
  }, [timezone, isOrganizerFallback, values.startDate, values.startTime]);

  // ---- Geocode: best-effort live (for the timezone line), awaited on submit
  const geocodeNow = useCallback(
    async (current: EventFormValues): Promise<ResolvedPlace | null> => {
      const city = current.location_city.trim() || current.location_name.trim();
      if (!city) return null;
      const seq = ++geocodeSeq.current;
      const place = await geocodeCity(city, current.location_country.trim() || undefined);
      if (seq !== geocodeSeq.current) return place; // stale — don't overwrite state
      setResolvedPlace(place);
      return place;
    },
    []
  );

  /** Debounce-friendly: call from onBlur of the location fields. */
  const refreshPlace = useCallback(() => {
    if (values.format === 'virtual') return;
    void geocodeNow(values).catch(() => null);
  }, [values, geocodeNow]);

  // ---- Validation -----------------------------------------------------------
  const validate = useCallback(
    (current: EventFormValues): boolean => {
      const parsed = eventFormSchema.safeParse(current);
      if (parsed.success) {
        setErrors({});
        return true;
      }
      const next: Partial<Record<string, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return false;
    },
    []
  );

  // ---- Submit — the one path -----------------------------------------------
  const submit = useCallback(
    async (intent: SubmitIntent) => {
      if (isSubmitting) return;
      const current = values;
      if (!validate(current)) {
        toast({
          variant: 'destructive',
          description: 'A few fields need attention before this can go out.',
        });
        return;
      }

      setIsSubmitting(true);
      try {
        // 1. Geocode, awaited, inside the submit path. Never blocks the save.
        let lat = current.location_lat;
        let lng = current.location_lng;
        let countryCode = resolvedPlace?.countryCode ?? null;
        let country = current.location_country.trim();
        let city = current.location_city.trim();
        const wantsLocation = current.format !== 'virtual';
        if (wantsLocation && (lat === null || lng === null)) {
          const place = await geocodeNow(current).catch(() => null);
          if (place) {
            lat = place.lat;
            lng = place.lng;
            countryCode = place.countryCode;
            if (!country) country = place.country;
            if (!city) city = place.city;
            setGeocodeFailed(false);
          } else if (city || current.location_name.trim()) {
            setGeocodeFailed(true);
          }
        }

        // 2. Timezone from the EVENT'S location — never the browser, except
        //    the stated fallback (virtual / unrecognizable place). A stored
        //    zone from a previous save beats the browser, so editing from
        //    another country never shifts the instant.
        const tz =
          (wantsLocation
            ? timezoneForLocation({ countryCode, country, lat, lng })
            : null) ??
          (current.timezone || browserTimezone());

        // 3. Wall clock in the event's zone → UTC instants.
        const startUtc = wallTimeToUtc(current.startDate, current.startTime, tz);
        const endUtc = wallTimeToUtc(current.endDate, current.endTime, tz);

        if (mode === 'create' && startUtc.getTime() <= Date.now()) {
          setErrors({ startDate: 'The event has to start in the future' });
          toast({ variant: 'destructive', description: 'Pick a start time in the future.' });
          return;
        }

        const status: EventStatus =
          intent === 'publish'
            ? 'published'
            : intent === 'draft'
              ? 'draft'
              : currentStatus ?? 'published';

        const shared = {
          title: current.title.trim(),
          description: current.description.trim(),
          event_type: current.event_type,
          format: current.format,
          start_time: startUtc.toISOString(),
          end_time: endUtc.toISOString(),
          timezone: tz,
          location_name: wantsLocation ? current.location_name.trim() || null : null,
          location_address: wantsLocation ? current.location_address.trim() || null : null,
          location_city: wantsLocation ? city || null : null,
          location_country: wantsLocation ? country || null : null,
          location_lat: wantsLocation ? lat : null,
          location_lng: wantsLocation ? lng : null,
          meeting_url: current.format !== 'in_person' ? current.meeting_url.trim() || null : null,
          meeting_platform:
            current.format !== 'in_person' ? current.meeting_platform.trim() || null : null,
          max_attendees: current.max_attendees,
          requires_approval: current.requires_approval,
          allow_guests: current.allow_guests,
          cover_image_url: current.cover_image_url.trim() || null,
          subtitle: current.subtitle.trim() || null,
          short_description: current.short_description.trim() || null,
          tags: current.tags,
          agenda: current.agenda,
          speakers: current.speakers,
          dress_code: current.dress_code.trim() || null,
          is_flagship: current.is_flagship,
        };

        let resultEventId: string | null = eventId ?? null;

        if (mode === 'create') {
          const { data: authData } = await supabase.auth.getSession();
          const response = await supabase.functions.invoke('create-event', {
            body: {
              ...shared,
              status,
              visibility: current.visibility,
              group_id: current.group_id,
            },
            headers: { Authorization: `Bearer ${authData.session?.access_token}` },
          });
          if (response.error) {
            let message = 'Failed to create event';
            try {
              const ctx = response.error.context;
              if (ctx && typeof ctx.json === 'function') {
                const body = await ctx.json();
                if (body?.error) message = body.error;
              }
            } catch {
              // keep default message
            }
            throw new Error(message);
          }
          if (response.data && !response.data.success) {
            throw new Error(response.data.error || 'Failed to create event');
          }
          resultEventId = response.data?.event?.id ?? response.data?.event_id ?? null;
        } else {
          if (!eventId) throw new Error('Missing event id');
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;
          if (!userId) throw new Error('Not authenticated');
          const { error } = await supabase
            .from('events')
            .update({
              ...shared,
              group_id: current.group_id,
              // (status, visibility) + the transitional legacy boolean mirror.
              ...eventStateWrite(
                intent === 'save'
                  ? { visibility: current.visibility }
                  : { status, visibility: current.visibility }
              ),
            })
            .eq('id', eventId)
            .eq('organizer_id', userId);
          if (error) throw error;
        }

        invalidateAllEventCaches(queryClient, resultEventId ?? undefined);
        await queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
        await queryClient.invalidateQueries({ queryKey: ['universal-feed-infinite'] });

        toast({
          description:
            status === 'draft'
              ? 'Draft saved — only you can see it.'
              : mode === 'create'
                ? 'Your event is live!'
                : 'Changes saved.',
        });
        onSuccess?.({ eventId: resultEventId, status });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        toast({
          variant: 'destructive',
          title: 'Couldn’t save the event',
          description: `${message} — your details are safe, please try again.`,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      values,
      validate,
      isSubmitting,
      mode,
      eventId,
      currentStatus,
      resolvedPlace,
      geocodeNow,
      queryClient,
      onSuccess,
    ]
  );

  // ---- Cancel — status write + the reason, which is content -----------------
  const cancelEvent = useCallback(
    async (reason: string) => {
      if (mode !== 'edit' || !eventId) return;
      setIsSubmitting(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('Not authenticated');
        const { error } = await supabase
          .from('events')
          .update({
            ...eventStateWrite({ status: 'cancelled' }),
            cancellation_reason: reason.trim() || 'Cancelled by organizer',
          })
          .eq('id', eventId)
          .eq('organizer_id', userId);
        if (error) throw error;
        invalidateAllEventCaches(queryClient, eventId);
        toast({
          title: 'Event cancelled',
          description: 'Attendees will see your reason.',
        });
        onSuccess?.({ eventId, status: 'cancelled' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        toast({ variant: 'destructive', title: 'Couldn’t cancel', description: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, eventId, queryClient, onSuccess]
  );

  // ---- Delete — the settings page's danger zone folded in -------------------
  const deleteEvent = useCallback(async () => {
    if (mode !== 'edit' || !eventId) return false;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      invalidateAllEventCaches(queryClient, eventId);
      toast({ title: 'Event deleted', description: 'It’s gone, along with its registrations.' });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({ variant: 'destructive', title: 'Couldn’t delete', description: message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, eventId, queryClient]);

  return {
    values,
    setValues,
    errors,
    isSubmitting,
    geocodeFailed,
    tzInfo,
    refreshPlace,
    submit,
    cancelEvent,
    deleteEvent,
  };
}

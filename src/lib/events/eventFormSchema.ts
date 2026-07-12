// The ONE definition of an authorable event.
//
// Four surfaces used to each write their own subset of events columns
// (EventFormFields, EventModeFields, EditEventPage, EventSettingsPage) and
// drifted. This schema replaces all of their validation: 24 authorable
// fields, the DB CHECK constraints enforced client-side BEFORE submit
// (valid_times, valid_location, title 1..200, description 1..5000,
// max_attendees NULL or > 0), and nothing else. The remaining events columns
// are system-owned and never appear here.

import { z } from 'zod';
import {
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
  type EventStatus,
  type EventVisibility,
} from '@/lib/events/state';
import { utcToWallTime, browserTimezone } from '@/lib/events/timezone';

export const EVENT_TYPES = [
  'conference',
  'workshop',
  'meetup',
  'webinar',
  'networking',
  'social',
  'other',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_FORMATS = ['in_person', 'virtual', 'hybrid'] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export const agendaItemSchema = z.object({
  time: z.string(),
  title: z.string(),
});
export type AgendaItem = z.infer<typeof agendaItemSchema>;

export const speakerSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
});
export type Speaker = z.infer<typeof speakerSchema>;

const trimmed = (max: number) => z.string().trim().max(max);

export const eventFormSchema = z
  .object({
    // Required
    title: z
      .string()
      .trim()
      .min(1, 'Give your event a name')
      .max(200, 'Keep the title under 200 characters'),
    description: z
      .string()
      .trim()
      .min(1, 'Tell people what to expect')
      .max(5000, 'Keep the description under 5,000 characters'),
    event_type: z.enum(EVENT_TYPES),
    format: z.enum(EVENT_FORMATS),
    // When — the event's LOCAL wall clock. The timezone is derived from the
    // location (never shown as an input); useEventForm converts to UTC.
    startDate: z.string().min(1, 'When does it start?'),
    startTime: z.string().min(1, 'What time does it start?'),
    endDate: z.string().min(1, 'When does it end?'),
    endTime: z.string().min(1, 'What time does it end?'),
    // State
    visibility: z.enum(EVENT_VISIBILITIES),
    // Where
    location_name: trimmed(300),
    location_address: trimmed(300),
    location_city: trimmed(120),
    location_country: trimmed(120),
    location_lat: z.number().nullable(),
    location_lng: z.number().nullable(),
    meeting_url: trimmed(500),
    meeting_platform: trimmed(60),
    // Door
    max_attendees: z.number().int().nullable(),
    requires_approval: z.boolean(),
    allow_guests: z.boolean(),
    // Rich
    subtitle: trimmed(200),
    short_description: trimmed(300),
    cover_image_url: trimmed(1000),
    tags: z.array(z.string()),
    agenda: z.array(agendaItemSchema),
    speakers: z.array(speakerSchema),
    dress_code: trimmed(60),
    // Context
    group_id: z.string().nullable(),
    /** Derived from location on submit; carried so edits keep the stored zone. */
    timezone: z.string(),
    cancellation_reason: z.string().trim().max(1000).nullable(),
    // Admin — DNA-internal; rendered only for admins
    is_flagship: z.boolean(),
  })
  .superRefine((v, ctx) => {
    // valid_times (DB CHECK): end_time > start_time. Both are wall clocks in
    // the same zone, so lexicographic comparison of ISO-shaped strings holds.
    if (v.startDate && v.startTime && v.endDate && v.endTime) {
      const start = `${v.startDate}T${v.startTime}`;
      const end = `${v.endDate}T${v.endTime}`;
      if (end <= start) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'The event has to end after it starts',
        });
      }
    }
    // valid_location (DB CHECK): virtual, or a venue name or city.
    if (v.format !== 'virtual' && !v.location_name.trim() && !v.location_city.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['location_name'],
        message: 'Say where — a venue or at least a city',
      });
    }
    // create-event contract: virtual/hybrid need a link people can follow.
    if (v.format !== 'in_person') {
      if (!v.meeting_url.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['meeting_url'],
          message: 'Add the link people will join from',
        });
      } else if (!/^https?:\/\/\S+$/i.test(v.meeting_url.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['meeting_url'],
          message: 'That link doesn’t look like a URL',
        });
      }
    }
    // max_attendees NULL or > 0 (DB CHECK)
    if (v.max_attendees !== null && v.max_attendees <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['max_attendees'],
        message: 'Leave empty for unlimited, or set at least 1 seat',
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

export function emptyEventFormValues(
  overrides: Partial<EventFormValues> = {}
): EventFormValues {
  return {
    title: '',
    description: '',
    event_type: 'meetup',
    format: 'in_person',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    visibility: 'public',
    location_name: '',
    location_address: '',
    location_city: '',
    location_country: '',
    location_lat: null,
    location_lng: null,
    meeting_url: '',
    meeting_platform: '',
    max_attendees: null,
    requires_approval: false,
    allow_guests: true,
    subtitle: '',
    short_description: '',
    cover_image_url: '',
    tags: [],
    agenda: [],
    speakers: [],
    dress_code: '',
    group_id: null,
    timezone: '',
    cancellation_reason: null,
    is_flagship: false,
    ...overrides,
  };
}

/** The subset of an events row this form authors. */
export interface AuthorableEventRow {
  title: string;
  description: string;
  event_type: string;
  format: string;
  start_time: string;
  end_time: string;
  status: string | null;
  visibility: string | null;
  location_name: string | null;
  location_address: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  meeting_url: string | null;
  meeting_platform: string | null;
  max_attendees: number | null;
  requires_approval: boolean | null;
  allow_guests: boolean | null;
  subtitle: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  agenda: unknown;
  speakers: unknown;
  dress_code: string | null;
  group_id: string | null;
  timezone: string | null;
  cancellation_reason: string | null;
  is_flagship: boolean | null;
  // Legacy fallbacks read while (status, visibility) backfill completes
  is_cancelled?: boolean | null;
  is_public?: boolean | null;
}

function parseAgenda(raw: unknown): AgendaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      time: typeof item.time === 'string' ? item.time : '',
      title: typeof item.title === 'string' ? item.title : '',
    }))
    .filter((item) => item.time || item.title);
}

function parseSpeakers(raw: unknown): Speaker[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      title: typeof item.title === 'string' ? item.title : undefined,
    }))
    .filter((item) => item.name);
}

export function eventRowStatus(row: Pick<AuthorableEventRow, 'status' | 'is_cancelled'>): EventStatus {
  const s = row.status;
  if (s && (EVENT_STATUSES as readonly string[]).includes(s)) return s as EventStatus;
  return row.is_cancelled ? 'cancelled' : 'draft';
}

export function eventRowVisibility(
  row: Pick<AuthorableEventRow, 'visibility' | 'is_public'>
): EventVisibility {
  const v = row.visibility;
  if (v && (EVENT_VISIBILITIES as readonly string[]).includes(v)) return v as EventVisibility;
  return row.is_public === false ? 'private' : 'public';
}

/**
 * DB row → form values. Stored UTC instants become the wall clock of the
 * EVENT'S stored timezone, so an Accra event edited from Los Angeles still
 * shows 7:00 PM Accra time.
 */
export function eventRowToFormValues(row: AuthorableEventRow): EventFormValues {
  const tz = row.timezone || browserTimezone();
  const start = utcToWallTime(row.start_time, tz);
  const end = utcToWallTime(row.end_time, tz);
  return emptyEventFormValues({
    title: row.title ?? '',
    description: row.description ?? '',
    event_type: (EVENT_TYPES as readonly string[]).includes(row.event_type)
      ? (row.event_type as EventType)
      : 'other',
    format: (EVENT_FORMATS as readonly string[]).includes(row.format)
      ? (row.format as EventFormat)
      : 'in_person',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    visibility: eventRowVisibility(row),
    location_name: row.location_name ?? '',
    location_address: row.location_address ?? '',
    location_city: row.location_city ?? '',
    location_country: row.location_country ?? '',
    location_lat: row.location_lat,
    location_lng: row.location_lng,
    meeting_url: row.meeting_url ?? '',
    meeting_platform: row.meeting_platform ?? '',
    max_attendees: row.max_attendees,
    requires_approval: row.requires_approval ?? false,
    allow_guests: row.allow_guests ?? true,
    subtitle: row.subtitle ?? '',
    short_description: row.short_description ?? '',
    cover_image_url: row.cover_image_url ?? '',
    tags: row.tags ?? [],
    agenda: parseAgenda(row.agenda),
    speakers: parseSpeakers(row.speakers),
    dress_code: row.dress_code ?? '',
    group_id: row.group_id,
    timezone: row.timezone ?? '',
    cancellation_reason: row.cancellation_reason,
    is_flagship: row.is_flagship ?? false,
  });
}

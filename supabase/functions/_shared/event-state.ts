// TRANSITIONAL: legacy state mirror. Delete when is_public /
// is_published / is_cancelled are dropped from public.events.
//
// public.events canonical state is (status, visibility), but DB RLS and
// functions still enforce on the legacy boolean columns until the next
// migration. Until then EVERY events write must keep the legacy columns in
// sync, or a 'private' event stays publicly readable at the DB layer.
//
// Shared by the web app (via src/lib/events/state.ts) and by edge functions
// (relative import) — keep this file dependency-free and runtime-agnostic.

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_VISIBILITIES = ['public', 'community', 'private'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

export function isEventStatus(value: unknown): value is EventStatus {
  return typeof value === 'string' && (EVENT_STATUSES as readonly string[]).includes(value);
}

export function isEventVisibility(value: unknown): value is EventVisibility {
  return typeof value === 'string' && (EVENT_VISIBILITIES as readonly string[]).includes(value);
}

export interface EventStateWrite {
  status?: EventStatus;
  visibility?: EventVisibility;
  is_public?: boolean;
  is_published?: boolean;
  is_cancelled?: boolean;
}

/**
 * Columns for an events INSERT/UPDATE that touches event state.
 * Pass only the dimension(s) being changed; each canonical column is
 * written together with its legacy boolean mirror.
 */
export function eventStateWrite(state: {
  status?: EventStatus;
  visibility?: EventVisibility;
}): EventStateWrite {
  const write: EventStateWrite = {};
  if (state.status !== undefined) {
    write.status = state.status;
    write.is_published = state.status === 'published';
    write.is_cancelled = state.status === 'cancelled';
  }
  if (state.visibility !== undefined) {
    write.visibility = state.visibility;
    write.is_public = state.visibility === 'public';
  }
  return write;
}

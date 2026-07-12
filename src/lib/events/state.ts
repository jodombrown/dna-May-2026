// TRANSITIONAL: legacy state mirror. Delete when is_public /
// is_published / is_cancelled are dropped from public.events.
//
// The implementation lives in supabase/functions/_shared/event-state.ts so
// the create-event edge function (Deno) and the web app share ONE copy of
// the mirroring logic. App code imports it from here (@/lib/events/state).
export * from '../../../supabase/functions/_shared/event-state.ts';

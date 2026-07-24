// The ONE place that resolves "events near me" ordering for the Convene module.
// Placed alongside directions.ts so the maps-adjacent geo helpers live together
// rather than being scattered across feature folders.
//
// Fallback chain per BD212: device geolocation → declared (profile) location →
// chapter (DNA × Place) anchor → none. The device coordinate is used for the
// query only and is NEVER persisted; it does not leave this call.
import { supabase } from "@/integrations/supabase/client";

export type NearAnchor = "device" | "declared" | "chapter" | "none";
export interface NearOrder { eventId: string; distanceM: number }
export interface NearResult { order: NearOrder[]; anchor: NearAnchor }

const SOFT_RADIUS_M = 250_000; // fixed at v0.0 per BD212; matches the RPC default

function getDevicePosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000,
    });
  });
}

async function queryNear(lat: number, lng: number): Promise<NearOrder[]> {
  // rpc_events_near is not yet in the generated types; cast the name per the
  // repo convention for server-defined RPCs (see rpc_update_post et al.).
  const { data, error } = await supabase.rpc("rpc_events_near" as any, {
    p_lat: lat, p_lng: lng, p_radius_m: SOFT_RADIUS_M, p_limit: 50,
  });
  if (error) throw error;
  return ((data ?? []) as { event_id: string; distance_m: number }[]).map((r) => ({
    eventId: r.event_id, distanceM: r.distance_m,
  }));
}

// Fallback chain per BD212. The device coordinate is NEVER persisted.
// BD213: the try/catch guards ONLY the geolocation prompt. A prior version
// wrapped queryNear() in the same catch, so an RPC failure on the device
// branch was silently swallowed and mis-reported as a fall-through to
// declared/chapter. queryNear() now runs outside the catch: an RPC error
// propagates to the caller instead of being hidden as "no results".
export async function getEventsNear(fallbacks: {
  declared?: { lat: number; lng: number } | null;  // from the profile projection, read-only
  chapter?:  { lat: number; lng: number } | null;  // DNA × Place anchor
}): Promise<NearResult> {
  let coords: { lat: number; lng: number } | null = null;
  try {
    const pos = await getDevicePosition();          // ONLY the geolocation prompt is caught here
    coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch { /* denied / unavailable → fall through to declared/chapter */ }

  const anchorPoint =
    coords ? { pt: coords, anchor: "device" as const } :
    fallbacks.declared ? { pt: fallbacks.declared, anchor: "declared" as const } :
    fallbacks.chapter  ? { pt: fallbacks.chapter,  anchor: "chapter"  as const } :
    null;

  if (!anchorPoint) return { order: [], anchor: "none" };
  // queryNear() is OUTSIDE the try — an RPC error propagates, not hidden as "no results".
  return { order: await queryNear(anchorPoint.pt.lat, anchorPoint.pt.lng), anchor: anchorPoint.anchor };
}

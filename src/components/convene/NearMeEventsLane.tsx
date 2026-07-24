// NearMeEventsLane — the "Near Me" pill's list, ordered by real distance.
//
// It runs the rpc_events_near sort (useNearMeEvents) over the already-loaded
// upcoming events and renders them through the shared DiscoveryLane, so it is
// visually identical to every other Convene lane (BD110 — no bespoke layout,
// no new card). The only additions are an honest, anchor-aware header and a
// per-card distance label.
//
// The header is never blank and never dishonest:
//   • loading      → "Finding events near you…"
//   • RPC error    → "Couldn't load events near you" (BD213 — surfaced, not hidden)
//   • has results  → "Events near you" / "Near your saved location" / "Near your chapter"
//   • no results   → "Nothing near you yet" (the plain upcoming list still shows)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiscoveryLane, type DiscoveryEvent } from '@/components/convene/DiscoveryLane';
import { useNearMeEvents } from '@/hooks/convene/useNearMeEvents';

export function NearMeEventsLane({ events }: { events: DiscoveryEvent[] }) {
  const navigate = useNavigate();
  const { ordered, distanceLabels, header, isPending, isError } = useNearMeEvents(
    events,
    true,
  );

  const title = isError
    ? "Couldn't load events near you"
    : isPending
      ? 'Finding events near you…'
      : header;

  return (
    <DiscoveryLane
      title={title}
      events={ordered}
      distanceLabels={distanceLabels}
      emptyMessage="No upcoming events yet. Be the first to host one!"
      onSeeAll={() => navigate('/dna/convene/events')}
    />
  );
}

export default NearMeEventsLane;

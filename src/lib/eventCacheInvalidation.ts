/**
 * Centralized event cache invalidation.
 *
 * Call this after any event delete, cancel, or status change so the event
 * disappears from every surface immediately (feed widgets, Convene hub
 * discovery lanes, events index, My Events, profile sections, detail views).
 */
import { QueryClient } from '@tanstack/react-query';

const EVENT_KEY_PREFIXES = [
  // Core lists
  'events',
  'events-index',
  'event-detail',
  'event-details-feed',
  'event-attendees',
  'event-registration-count',
  'user-rsvp',
  // Convene hub discovery lanes (ConveneDiscovery + useConveneDiscoveryLanes)
  'convene-hero',
  'convene-weekend',
  'convene-network-going',
  'convene-diaspora',
  'convene-pill-filtered',
  'convene-featured-events',
  'convene-category-counts',
  'event-recommendations',
  'happening-now-events',
  // My Events / organizer
  'hosting-events',
  'attending-events',
  'organizer-stats',
  'organizer-event-count',
  // Feed widgets & activity
  'feed-happening-now',
  'feed-upcoming-events',
  'activities',
  // Profile sections
  'profile-events',
  // Groups
  'group-events',
];

export function invalidateAllEventCaches(queryClient: QueryClient, eventId?: string) {
  const prefixes = new Set(EVENT_KEY_PREFIXES);
  queryClient.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey?.[0];
      if (typeof first !== 'string') return false;
      if (prefixes.has(first)) return true;
      // Catch any future convene-* / event-* keys automatically
      return first.startsWith('convene-') || first.startsWith('event-');
    },
  });

  if (eventId) {
    queryClient.invalidateQueries({ queryKey: ['event-detail', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-details-feed', eventId] });
  }
}

/**
 * DIA | Event Matching Service (Events ↔ Interests)
 *
 * Matches events to users and predicts attendance likelihood based on:
 * - Topic/interest overlap
 * - Network presence (connections attending)
 * - Organizer relationship
 * - Event type preference (in-person vs virtual)
 * - Timezone compatibility
 * - Past attendance patterns
 * - Related space membership
 * - Regional alignment
 */

import { supabase } from '@/integrations/supabase/client';
import {
  EventMatchType,
  MatchSurface,
  MatchPriority,
  type EventMatchResult,
  type EventMatchSignals,
  type MatchReason,
  type MatchStatus,
} from '@/types/diaEngine';

/** Weights for event match signals */
const MATCH_WEIGHTS: Record<keyof EventMatchSignals, number> = {
  topicInterestOverlap: 0.20,
  connectionAttendeeCount: 0.20,
  connectionAttendeeStrength: 0.10,
  organizerRelationship: 0.10,
  eventTypePreference: 0.10,
  timezoneCompatibility: 0.10,
  pastAttendancePattern: 0.10,
  relatedSpaceMembership: 0.05,
  regionalAlignment: 0.05,
};

const MIN_MATCH_THRESHOLD = 0.35;

/**
 * Match upcoming events to a user based on their profile and behavior.
 */
async function matchUserToEvents(userId: string, limit = 20): Promise<EventMatchResult[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, interests, location, profession')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  // Get upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, tags, location_name, start_time, event_type, organizer_id')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(100);

  if (!events) return [];

  // Get user's events already registered for
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  const registeredEventIds = new Set((registrations || []).map(r => r.event_id));

  // Get user's connections
  const userConnections = await fetchUserConnectionIds(userId);

  // Get event attendee lists
  const eventIds = events.filter(e => !registeredEventIds.has(e.id)).map(e => e.id);
  const eventAttendeeMap = await fetchEventAttendees(eventIds);

  // Get user's past events for pattern matching
  const pastEventCategories = await fetchPastEventCategories(userId);

  // Get user's spaces for related-space matching
  const userSpaceIds = await fetchUserSpaceIds(userId);

  const userInterests = ((profile.interests || []) as string[]).map(s => s.toLowerCase());
  const userSkills = ((profile.skills || []) as string[]).map(s => s.toLowerCase());

  const results: EventMatchResult[] = events
    .filter(e => !registeredEventIds.has(e.id))
    .map(event => {
      const eventRecord = event as unknown as Record<string, unknown>;
      const attendees = eventAttendeeMap.get(event.id) || [];
      const signals = computeEventSignals(
        eventRecord,
        userInterests,
        userSkills,
        attendees,
        userConnections,
        pastEventCategories,
        userSpaceIds,
        profile as unknown as Record<string, unknown>,
      );
      const score = computeScore(signals);
      const matchType = classifyEventMatchType(signals);
      const reasons = generateEventReasons(signals, eventRecord, attendees, userConnections);

      return {
        eventId: event.id,
        userId,
        matchScore: score,
        matchType,
        matchReasons: reasons,
        signals,
        surfacedVia: determineSurfaces(score),
        priority: determinePriority(score, (event.start_time || '') as string),
        createdAt: new Date(),
        status: 'active' as MatchStatus,
      };
    });

  return results
    .filter(r => r.matchScore >= MIN_MATCH_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Find users who should be recommended a specific event.
 */
async function matchEventToUsers(eventId: string, limit = 50): Promise<EventMatchResult[]> {
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) return [];

  // Get already registered users to exclude
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('user_id')
    .eq('event_id', eventId);

  const registeredIds = new Set((registrations || []).map(r => r.user_id));

  // Get candidate profiles
  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, skills, interests, location, profession')
    .limit(200);

  if (!candidates) return [];

  const eventRecord = event as unknown as Record<string, unknown>;
  const eventText = `${eventRecord.title} ${eventRecord.description || ''} ${(eventRecord.tags as string[] || []).join(' ')}`.toLowerCase();

  const results: EventMatchResult[] = candidates
    .filter(c => !registeredIds.has(c.id) && c.id !== (eventRecord.organizer_id as string))
    .map(candidate => {
      const userInterests = ((candidate.interests || []) as string[]).map(s => s.toLowerCase());
      const userSkills = ((candidate.skills || []) as string[]).map(s => s.toLowerCase());
      const interestHits = userInterests.filter(i => eventText.includes(i));
      const skillHits = userSkills.filter(s => eventText.includes(s));

      const signals: EventMatchSignals = {
        topicInterestOverlap: Math.min((interestHits.length * 0.25 + skillHits.length * 0.2), 1),
        connectionAttendeeCount: 0,
        connectionAttendeeStrength: 0,
        organizerRelationship: 0,
        eventTypePreference: 0.5,
        timezoneCompatibility: 0.5,
        pastAttendancePattern: 0,
        relatedSpaceMembership: 0,
        regionalAlignment: computeLocationMatch(
          (candidate.location || '') as string,
          (eventRecord.location_name || '') as string,
        ),
      };

      const score = computeScore(signals);
      const matchType = classifyEventMatchType(signals);

      return {
        eventId,
        userId: candidate.id,
        matchScore: score,
        matchType,
        matchReasons: generateEventReasons(signals, eventRecord, [], new Set()),
        signals,
        surfacedVia: [MatchSurface.NOTIFICATION],
        priority: determinePriority(score, (eventRecord.start_time || '') as string),
        createdAt: new Date(),
        status: 'active' as MatchStatus,
      };
    });

  return results
    .filter(r => r.matchScore >= MIN_MATCH_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

function computeEventSignals(
  event: Record<string, unknown>,
  userInterests: string[],
  userSkills: string[],
  attendeeIds: string[],
  userConnections: Set<string>,
  pastCategories: Set<string>,
  userSpaceIds: Set<string>,
  profile: Record<string, unknown>,
): EventMatchSignals {
  const eventText = `${event.title} ${event.description || ''} ${((event.tags as string[]) || []).join(' ')}`.toLowerCase();

  // Topic/interest overlap
  const interestHits = userInterests.filter(i => eventText.includes(i));
  const skillHits = userSkills.filter(s => eventText.includes(s));
  const topicInterestOverlap = Math.min(interestHits.length * 0.25 + skillHits.length * 0.2, 1);

  // Connection attendee count
  const connectionAttendees = attendeeIds.filter(id => userConnections.has(id));
  const connectionAttendeeCount = Math.min(connectionAttendees.length / 5, 1);

  // Organizer relationship
  const organizerRelationship = userConnections.has(event.organizer_id as string) ? 0.7 : 0.1;

  // Past attendance pattern
  const eventTags = ((event.tags as string[]) || []).join(' ').toLowerCase();
  const pastAttendancePattern = pastCategories.has(eventTags) ? 0.8 : 0.2;

  // Regional alignment
  const userLocation = ((profile.location || '') as string).toLowerCase();
  const eventLocation = ((event.location_name || '') as string).toLowerCase();
  const regionalAlignment = computeLocationMatch(userLocation, eventLocation);

  return {
    topicInterestOverlap,
    connectionAttendeeCount,
    connectionAttendeeStrength: connectionAttendeeCount * 0.8,
    organizerRelationship,
    eventTypePreference: 0.5, // Default
    timezoneCompatibility: 0.5, // Default
    pastAttendancePattern,
    relatedSpaceMembership: 0, // Future: check if event is linked to a user's space
    regionalAlignment,
  };
}

function computeScore(signals: EventMatchSignals): number {
  let score = 0;
  for (const [key, weight] of Object.entries(MATCH_WEIGHTS)) {
    score += (signals[key as keyof EventMatchSignals] || 0) * weight;
  }
  return Math.min(Math.max(score, 0), 1);
}

function classifyEventMatchType(signals: EventMatchSignals): EventMatchType {
  if (signals.connectionAttendeeCount > 0.4) return EventMatchType.NETWORK_ATTENDING;
  if (signals.topicInterestOverlap > 0.5) return EventMatchType.TOPIC_MATCH;
  if (signals.organizerRelationship > 0.5) return EventMatchType.ORGANIZER_CONNECTION;
  if (signals.pastAttendancePattern > 0.5) return EventMatchType.HISTORY_PATTERN;
  if (signals.regionalAlignment > 0.6) return EventMatchType.REGIONAL_EVENT;
  if (signals.relatedSpaceMembership > 0.5) return EventMatchType.SPACE_EVENT;
  return EventMatchType.TOPIC_MATCH;
}

function generateEventReasons(
  signals: EventMatchSignals,
  event: Record<string, unknown>,
  attendeeIds: string[],
  userConnections: Set<string>,
): MatchReason[] {
  const reasons: MatchReason[] = [];

  const connectionAttendees = attendeeIds.filter(id => userConnections.has(id));
  if (connectionAttendees.length > 0) {
    reasons.push({
      type: 'mutual_connections',
      text: `${connectionAttendees.length} connection${connectionAttendees.length > 1 ? 's' : ''} attending`,
      strength: signals.connectionAttendeeCount,
      icon: 'people-network',
    });
  }

  if (signals.topicInterestOverlap > 0.3) {
    reasons.push({
      type: 'shared_interests',
      text: `Matches your interests`,
      strength: signals.topicInterestOverlap,
      icon: 'lightbulb',
    });
  }

  if (signals.organizerRelationship > 0.5) {
    reasons.push({
      type: 'mutual_connections',
      text: 'Organized by someone in your network',
      strength: signals.organizerRelationship,
      icon: 'person-check',
    });
  }

  if (signals.pastAttendancePattern > 0.5) {
    reasons.push({
      type: 'event_overlap',
      text: `You attend similar events`,
      strength: signals.pastAttendancePattern,
      icon: 'calendar-people',
    });
  }

  if (signals.regionalAlignment > 0.5) {
    reasons.push({
      type: 'same_region',
      text: `Event in your region`,
      strength: signals.regionalAlignment,
      icon: 'map-pin',
    });
  }

  return reasons.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

function determineSurfaces(score: number): MatchSurface[] {
  if (score >= 0.6) {
    return [MatchSurface.FEED_CARD, MatchSurface.NOTIFICATION, MatchSurface.EVENT_NETWORKING];
  }
  if (score >= 0.4) {
    return [MatchSurface.CONNECT_SUGGESTIONS];
  }
  return [];
}

function determinePriority(score: number, startDate: string): MatchPriority {
  const daysUntil = (new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  // Events starting soon get boosted priority
  if (daysUntil <= 3 && score >= 0.5) return MatchPriority.HIGH;
  if (score >= 0.7) return MatchPriority.HIGH;
  if (score >= 0.5) return MatchPriority.MEDIUM;
  return MatchPriority.LOW;
}

function computeLocationMatch(userLocation: string, eventLocation: string): number {
  if (!userLocation || !eventLocation) return 0.3;
  const userCity = userLocation.split(',')[0].trim().toLowerCase();
  const eventCity = eventLocation.split(',')[0].trim().toLowerCase();
  if (userCity === eventCity) return 1.0;
  if (eventLocation.toLowerCase().includes(userCity)) return 0.7;
  return 0.2;
}

// ── Data fetching helpers ───────────────────────────────────

async function fetchUserConnectionIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(500);

  const ids = new Set<string>();
  for (const conn of data || []) {
    ids.add(conn.requester_id === userId ? conn.recipient_id : conn.requester_id);
  }
  return ids;
}

async function fetchEventAttendees(eventIds: string[]): Promise<Map<string, string[]>> {
  if (eventIds.length === 0) return new Map();

  const { data } = await supabase
    .from('event_registrations')
    .select('event_id, user_id')
    .in('event_id', eventIds);

  const result = new Map<string, string[]>();
  for (const r of data || []) {
    const existing = result.get(r.event_id) || [];
    existing.push(r.user_id);
    result.set(r.event_id, existing);
  }
  return result;
}

async function fetchPastEventCategories(userId: string): Promise<Set<string>> {
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  if (!registrations || registrations.length === 0) return new Set();

  const eventIds = registrations.map(r => r.event_id);
  const { data: events } = await supabase
    .from('events')
    .select('tags')
    .in('id', eventIds.slice(0, 50));

  return new Set(
    (events || [])
      .flatMap(e => ((e.tags || []) as string[]).map(t => t.toLowerCase()))
      .filter(Boolean),
  );
}

async function fetchUserSpaceIds(userId: string): Promise<Set<string>> {
  // collaboration_memberships table retired (DIA/ADIN out of scope) — return empty.
  return new Set<string>();
}

export const eventMatchingService = {
  matchUserToEvents,
  matchEventToUsers,
  MATCH_WEIGHTS,
};

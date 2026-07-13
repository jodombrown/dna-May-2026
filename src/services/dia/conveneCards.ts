/**
 * DNA | DIA CONVENE Card Generators
 *
 * Generates intelligence cards for the Convene module:
 * - Event Overlap (connections attending)
 * - Event Recommendation
 * - Post-Event Follow-Up
 * - Event Hosting Nudge
 *
 * Uses event_registrations (not event_rsvps) and connections with requester_id/recipient_id.
 */

import { supabase } from '@/integrations/supabase/client';
import { formatEventPlace } from '@/lib/events/formatPlace';
import type { DIACard } from '@/services/diaCardService';
import { MateMasie } from '@/components/icons/adinkra';
const ACCENT = '#C4942A';

// ── Card Type 1: Event Overlap ─────────────────────

async function generateEventOverlap(userId: string): Promise<DIACard | null> {
  try {
    const { data: connections } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted')
      .limit(100);

    if (!connections || connections.length === 0) return null;

    const connectionIds = connections.map(c =>
      c.requester_id === userId ? c.recipient_id : c.requester_id
    );

    const { data: connectionRegs } = await supabase
      .from('event_registrations')
      .select('event_id, user_id')
      .in('user_id', connectionIds)
      .eq('status', 'confirmed');

    if (!connectionRegs || connectionRegs.length === 0) return null;

    const eventCounts: Record<string, string[]> = {};
    for (const reg of connectionRegs) {
      if (!eventCounts[reg.event_id]) eventCounts[reg.event_id] = [];
      eventCounts[reg.event_id].push(reg.user_id);
    }

    let bestEventId = '';
    let bestCount = 0;
    for (const [eventId, userIds] of Object.entries(eventCounts)) {
      if (userIds.length > bestCount) {
        bestCount = userIds.length;
        bestEventId = eventId;
      }
    }

    if (bestCount < 2) return null;

    const { count: userReg } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', bestEventId)
      .eq('user_id', userId);

    if ((userReg || 0) > 0) return null;

    const now = new Date().toISOString();
    const { data: event } = await supabase
      .from('events')
      .select('id, title, start_time')
      .eq('id', bestEventId)
      .gte('start_time', now)
      .single();

    if (!event) return null;

    return {
      id: `convene-overlap-${bestEventId}`,
      category: 'convene',
      cardType: 'event_overlap',
      headline: `${bestCount} connections are attending ${event.title}`,
      body: 'People in your network are going. Join them and make the most of the event together.',
      accentColor: ACCENT,
      icon: 'Users',
      priority: 70,
      actions: [
        { label: 'View Event', type: 'navigate' as const, payload: { url: `/dna/convene/events/${bestEventId}` }, isPrimary: true },
        { label: 'Not now', type: 'dismiss' as const, payload: {}, isPrimary: false },
      ],
      metadata: { eventId: bestEventId, eventTitle: event.title, attendingConnectionCount: bestCount },
      dismissKey: `overlap-${bestEventId}`,
    };
  } catch {
    return null;
  }
}

// ── Card Type 2: Event Recommendation ──────────────

async function generateEventRecommendation(userId: string): Promise<DIACard | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests, skills')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const userInterests: string[] = [
      ...((profile.interests as string[]) || []),
      ...((profile.skills as string[]) || []),
    ];
    if (userInterests.length === 0) return null;

    const now = new Date().toISOString();
    const { data: events } = await supabase
      .from('events')
      .select('id, title, description, tags, start_time')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(20);

    if (!events || events.length === 0) return null;

    const eventIds = events.map(e => e.id);
    const { data: existingRegs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', eventIds);

    const regEventIds = new Set((existingRegs || []).map(r => r.event_id));

    let bestEvent: typeof events[0] | null = null;
    let bestScore = 0;
    let matchReasons: string[] = [];

    for (const event of events) {
      if (regEventIds.has(event.id)) continue;
      const eventTags: string[] = (event.tags as string[]) || [];
      const descLower = (event.description || '').toLowerCase();
      const titleLower = event.title.toLowerCase();

      let score = 0;
      const reasons: string[] = [];
      for (const interest of userInterests) {
        const iLower = interest.toLowerCase();
        if (eventTags.some(t => t.toLowerCase().includes(iLower))) { score += 2; reasons.push(interest); }
        else if (descLower.includes(iLower) || titleLower.includes(iLower)) { score += 1; reasons.push(interest); }
      }

      if (score > bestScore) { bestScore = score; bestEvent = event; matchReasons = [...new Set(reasons)]; }
    }

    if (!bestEvent || bestScore === 0) return null;

    return {
      id: `convene-rec-${bestEvent.id}`,
      category: 'convene',
      cardType: 'event_recommendation',
      headline: `You might enjoy: ${bestEvent.title}`,
      body: `Based on your interest in ${matchReasons.slice(0, 2).join(' and ')}, this event looks like a fit.`,
      accentColor: ACCENT,
      icon: 'Calendar',
      priority: 60,
      actions: [
        { label: 'View Event', type: 'navigate' as const, payload: { url: `/dna/convene/events/${bestEvent.id}` }, isPrimary: true },
        { label: 'Not interested', type: 'dismiss' as const, payload: {}, isPrimary: false },
      ],
      metadata: { eventId: bestEvent.id, eventTitle: bestEvent.title, matchReasons, matchScore: bestScore },
      dismissKey: `rec-event-${bestEvent.id}`,
    };
  } catch {
    return null;
  }
}

// ── Card Type 3: Post-Event Follow-Up ──────────────

async function generatePostEventFollowUp(userId: string): Promise<DIACard | null> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: attendedRegs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (!attendedRegs || attendedRegs.length === 0) return null;

    const attendedEventIds = attendedRegs.map(r => r.event_id);

    const { data: recentEvents } = await supabase
      .from('events')
      .select('id, title, end_time')
      .in('id', attendedEventIds)
      .lt('end_time', now)
      .gte('end_time', sevenDaysAgo)
      .limit(5);

    if (!recentEvents || recentEvents.length === 0) return null;

    const event = recentEvents[0];

    const { count: attendeeCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'confirmed')
      .neq('user_id', userId);

    return {
      id: `convene-followup-${event.id}`,
      category: 'convene',
      cardType: 'post_event_follow_up',
      headline: `Follow up from ${event.title}`,
      body: `You attended this event recently. ${attendeeCount || 0} other attendees were there. Connect with them while the conversation is fresh.`,
      accentColor: ACCENT,
      icon: 'MessageCircle',
      priority: 65,
      actions: [
        { label: 'See Attendees', type: 'navigate' as const, payload: { url: `/dna/convene/events/${event.id}` }, isPrimary: true },
        { label: 'Not now', type: 'dismiss' as const, payload: {}, isPrimary: false },
      ],
      metadata: { eventId: event.id, eventTitle: event.title, attendeeCount: attendeeCount || 0 },
      dismissKey: `followup-${event.id}`,
    };
  } catch {
    return null;
  }
}

// ── Card Type 4: Event Hosting Nudge ───────────────

async function generateHostingNudge(userId: string): Promise<DIACard | null> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: attendedCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('registered_at', thirtyDaysAgo);

    if ((attendedCount || 0) < 3) return null;

    const { count: hostedCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', userId);

    if ((hostedCount || 0) > 0) return null;

    return {
      id: `convene-host-nudge-${userId}`,
      category: 'convene',
      cardType: 'hosting_nudge',
      headline: 'Have you considered hosting an event?',
      body: `You have attended ${attendedCount} events this month. Your experience as an engaged participant could make you a great host.`,
      accentColor: ACCENT,
      icon: 'Mic',
      priority: 35,
      actions: [
        { label: 'Create Event', type: 'navigate' as const, payload: { url: '/dna/convene/my-events' }, isPrimary: true },
        { label: 'Not for me', type: 'dismiss' as const, payload: {}, isPrimary: false },
      ],
      metadata: { attendedCount },
      dismissKey: `host-nudge-${new Date().toISOString().slice(0, 7)}`,
    };
  } catch {
    return null;
  }
}

// ── Card Type 5: Curated Event Discovery ──────────

async function generateCuratedEventCard(_userId: string): Promise<DIACard | null> {
  try {
    const now = new Date().toISOString();

    const { data: curatedEvents } = await supabase
      .from('events')
      .select('id, title, description, location_city, location_state, location_country, start_time, event_type, tags')
      .eq('is_curated', true)
      .eq('is_public', true)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(5);

    if (!curatedEvents || curatedEvents.length === 0) return null;

    // Pick the soonest curated event
    const event = curatedEvents[0];
    const location = formatEventPlace(event, 'compact');
    const tags = (event.tags as string[]) || [];

    return {
      id: `convene-curated-${event.id}`,
      category: 'convene',
      cardType: 'curated_event',
      headline: event.title,
      body: `${location ? `📍 ${location} · ` : ''}${event.event_type || 'Event'} curated by DNA for the diaspora community.${tags.length > 0 ? ` Tags: ${tags.join(', ')}` : ''}`,
      accentColor: ACCENT,
      icon: 'MateMasie',
      priority: 55,
      actions: [
        { label: 'View Event', type: 'navigate' as const, payload: { url: `/dna/convene/events/${event.id}` }, isPrimary: true },
        { label: 'Browse All', type: 'navigate' as const, payload: { url: '/dna/convene' }, isPrimary: false },
      ],
      metadata: { eventId: event.id, eventTitle: event.title, isCurated: true },
      dismissKey: `curated-${event.id}`,
    };
  } catch {
    return null;
  }
}

// ── Export ──────────────────────────────────────────

export function generateConveneCards(): Array<(userId: string) => Promise<DIACard | null>> {
  return [generateEventOverlap, generateEventRecommendation, generatePostEventFollowUp, generateHostingNudge, generateCuratedEventCard];
}

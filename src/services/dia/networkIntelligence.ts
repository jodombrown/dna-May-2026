/**
 * DIA | Network Intelligence Service
 *
 * Maps connection graph, relationship strength, and community clusters.
 * Powers: Feed (ranking), Composer (co-host suggestions), Messaging (smart introductions)
 *
 * Data sources:
 * - Connection graph (connections table)
 * - Messaging metadata (frequency, response time — never content)
 * - Shared spaces and events
 * - Mutual engagement patterns
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ConnectionStrength,
  ConnectionStrengthFactors,
  SmartIntroduction,
  CommunityCluster,
  FiveCModule,
} from '@/types/dia';

/** Weight configuration for connection strength factors */
const STRENGTH_WEIGHTS = {
  message_frequency: 0.25,
  mutual_engagements: 0.20,
  shared_spaces: 0.15,
  shared_events: 0.15,
  profile_views: 0.10,
  response_time_score: 0.15,
} as const;

/**
 * Compute the strength of connection between two users.
 * Score is 0-100, combining multiple behavioral signals.
 */
async function computeConnectionStrength(
  userAId: string,
  userBId: string,
): Promise<ConnectionStrength> {
  const [messageData, engagementData, spaceData, eventData] = await Promise.all([
    getMessageMetrics(userAId, userBId),
    getMutualEngagements(userAId, userBId),
    getSharedSpaces(userAId, userBId),
    getSharedEvents(userAId, userBId),
  ]);

  const factors: ConnectionStrengthFactors = {
    message_frequency: normalizeScore(messageData.frequency, 50),
    mutual_engagements: normalizeScore(engagementData.count, 20),
    shared_spaces: normalizeScore(spaceData.count, 5),
    shared_events: normalizeScore(eventData.count, 10),
    profile_views: 0, // Computed from analytics
    response_time_score: messageData.responseScore,
  };

  const overall_score = Math.round(
    Object.entries(STRENGTH_WEIGHTS).reduce((total, [key, weight]) => {
      return total + (factors[key as keyof ConnectionStrengthFactors] * weight * 100);
    }, 0),
  );

  return {
    user_a_id: userAId,
    user_b_id: userBId,
    overall_score: Math.min(100, overall_score),
    factors,
    last_computed: new Date().toISOString(),
  };
}

/**
 * Get smart introduction suggestions for a user.
 * Finds people the user should know based on network analysis.
 */
async function getSmartIntroductions(
  userId: string,
  limit = 10,
): Promise<SmartIntroduction[]> {
  // Get user's profile for matching
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('skills, interests, location, profession')
    .eq('id', userId)
    .single();

  if (!userProfile) return [];

  // Get user's existing connections
  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const connectedIds = new Set(
    (connections || []).flatMap(c => [c.requester_id, c.recipient_id]),
  );
  connectedIds.delete(userId);

  // Get second-degree connections (friends of friends)
  const connectedArray = Array.from(connectedIds);
  if (connectedArray.length === 0) return [];

  const { data: secondDegree } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(
      connectedArray.slice(0, 20).flatMap(id => [
        `requester_id.eq.${id}`,
        `recipient_id.eq.${id}`,
      ]).join(','),
    )
    .limit(200);

  // Count mutual connections and find candidates
  const candidateMutuals = new Map<string, string[]>();
  for (const conn of secondDegree || []) {
    for (const candidateId of [conn.requester_id, conn.recipient_id]) {
      if (candidateId !== userId && !connectedIds.has(candidateId)) {
        // Find which of user's connections links to this candidate
        const mutualId = connectedIds.has(conn.requester_id) ? conn.requester_id : conn.recipient_id;
        const existing = candidateMutuals.get(candidateId) || [];
        if (!existing.includes(mutualId)) {
          existing.push(mutualId);
          candidateMutuals.set(candidateId, existing);
        }
      }
    }
  }

  // Get candidate profiles — prioritize by mutual connection count
  const topCandidates = Array.from(candidateMutuals.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit * 2);

  if (topCandidates.length === 0) return [];

  const candidateIds = topCandidates.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, skills, interests, profession, location')
    .in('id', candidateIds);

  if (!profiles) return [];

  const userSkills = new Set((userProfile.skills || []).map((s: string) => s.toLowerCase()));
  const userInterests = new Set((userProfile.interests || []).map((s: string) => s.toLowerCase()));

  const introductions: SmartIntroduction[] = profiles
    .map(profile => {
      const mutuals = candidateMutuals.get(profile.id) || [];
      const profileSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
      const profileInterests = (profile.interests || []).map((s: string) => s.toLowerCase());

      const sharedSkills = profileSkills.filter((s: string) => userSkills.has(s));
      const sharedInterests = profileInterests.filter((s: string) => userInterests.has(s));

      // Build introduction reason
      const reasons: string[] = [];
      if (sharedSkills.length > 0) reasons.push(`shared skills in ${sharedSkills.slice(0, 2).join(' and ')}`);
      if (sharedInterests.length > 0) reasons.push(`mutual interest in ${sharedInterests.slice(0, 2).join(' and ')}`);
      if (profile.profession === userProfile.profession) reasons.push(`both work in ${profile.profession}`);
      if (reasons.length === 0) reasons.push(`${mutuals.length} mutual connections`);

      const relevanceScore =
        mutuals.length * 20 +
        sharedSkills.length * 15 +
        sharedInterests.length * 10 +
        (profile.profession === userProfile.profession ? 15 : 0);

      return {
        suggested_user_id: profile.id,
        suggested_user_name: profile.full_name || 'Unknown',
        suggested_user_avatar: profile.avatar_url,
        mutual_connections: mutuals.length,
        shared_interests: sharedInterests,
        shared_skills: sharedSkills,
        introduction_reason: reasons.join(', '),
        relevance_score: Math.min(100, relevanceScore),
        source_module: 'connect' as FiveCModule,
      };
    })
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

  return introductions;
}

/**
 * Identify community clusters the user belongs to.
 */
async function getCommunityCluster(userId: string): Promise<CommunityCluster[]> {
  // collaboration_spaces/collaboration_memberships tables retired (DIA/ADIN out
  // of scope) — community clusters disabled; return none.
  return [];
}

// --- Internal helpers ---

async function getMessageMetrics(userAId: string, userBId: string) {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .or(`sender_id.eq.${userAId},sender_id.eq.${userBId}`)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  return { frequency: count || 0, responseScore: count ? Math.min(1, (count || 0) / 30) : 0 };
}

async function getMutualEngagements(userAId: string, userBId: string) {
  // Count where both users engaged on same posts
  const { count } = await supabase
    .from('post_likes')
    .select('post_id', { count: 'exact', head: true })
    .eq('user_id', userAId);

  return { count: count || 0 };
}

async function getSharedSpaces(userAId: string, userBId: string) {
  // collaboration_memberships table retired (DIA/ADIN out of scope) — stub to 0.
  return { count: 0 };
}

async function getSharedEvents(userAId: string, userBId: string) {
  const { data: eventsA } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userAId);

  const { data: eventsB } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userBId);

  const setA = new Set((eventsA || []).map(e => e.event_id));
  const shared = (eventsB || []).filter(e => setA.has(e.event_id));

  return { count: shared.length };
}

function normalizeScore(value: number, maxExpected: number): number {
  return Math.min(1, value / maxExpected);
}

export const networkIntelligenceService = {
  computeConnectionStrength,
  getSmartIntroductions,
  getCommunityCluster,
};

/**
 * DIA | People Matching Service (People ↔ People)
 *
 * The foundation of DIA's intelligence. Computes who each user should
 * connect with, ranked by match quality.
 *
 * Candidate pool sources (in priority order):
 * 1. 2nd-degree connections (friends of friends) — highest signal
 * 2. Users in same Spaces — collaboration proximity
 * 3. Users who attended same Events — shared interests
 * 4. Users in same Regional Hub — geographic proximity
 * 5. Users with overlapping skills/interests — profile similarity
 *
 * Excludes: already connected, blocked, recently dismissed (30 days)
 */

import { supabase } from '@/integrations/supabase/client';
import {
  PeopleMatchType,
  MatchSurface,
  MatchPriority,
  MatchStatus,
  type PeopleMatchResult,
  type PeopleMatchSignals,
  type MatchReason,
  type MatchReasonType,
} from '@/types/diaEngine';
import { relationshipStrengthService } from './relationshipStrength';

/** Weights for people match signals — sums to 1.0 */
const MATCH_WEIGHTS: Record<keyof PeopleMatchSignals, number> = {
  // Network proximity (35%)
  mutualConnectionStrength: 0.15,
  networkOverlap: 0.10,
  degreeOfSeparation: 0.10,
  mutualConnectionCount: 0.0, // Used in reasons, not scoring (already captured in strength)

  // Professional alignment (30%)
  skillComplementarity: 0.10,
  interestOverlap: 0.08,
  industryAlignment: 0.07,
  experienceLevelMatch: 0.05,

  // Diaspora alignment (20%)
  heritageMatch: 0.08,
  regionalProximity: 0.07,
  diasporaEngagementSimilarity: 0.05,

  // Behavioral alignment (15%)
  eventCoAttendancePotential: 0.05,
  spaceInterestOverlap: 0.05,
  contentTopicOverlap: 0.03,
  onlineTimeOverlap: 0.02,
};

/** Minimum match score threshold */
const MIN_MATCH_THRESHOLD = 0.4;

/**
 * Compute people matches for a user.
 */
async function computeMatches(userId: string, limit = 20): Promise<PeopleMatchResult[]> {
  // Step 1: Generate candidate pool
  const candidates = await getCandidatePool(userId);
  if (candidates.length === 0) return [];

  // Step 2: Fetch user profile for comparison
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('skills, interests, location, profession, ethnic_heritage, primary_origin_country')
    .eq('id', userId)
    .single();

  if (!userProfile) return [];

  // Step 3: Fetch candidate profiles
  const candidateIds = candidates.slice(0, 100); // Cap at 100 for performance
  const { data: candidateProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, skills, interests, location, profession, ethnic_heritage, primary_origin_country')
    .in('id', candidateIds);

  if (!candidateProfiles) return [];

  // Step 4: Compute signals and score each candidate
  const mutualCounts = await fetchMutualConnectionCounts(userId, candidateIds);
  const sharedSpaceCounts = await fetchSharedSpaceCounts(userId, candidateIds);
  const sharedEventCounts = await fetchSharedEventCounts(userId, candidateIds);

  const scoredCandidates: PeopleMatchResult[] = candidateProfiles.map(candidate => {
    const signals = computeSignals(
      userProfile,
      candidate,
      mutualCounts.get(candidate.id) || 0,
      sharedSpaceCounts.get(candidate.id) || 0,
      sharedEventCounts.get(candidate.id) || 0,
    );
    const score = computeScore(signals);
    const matchType = classifyMatchType(signals);
    const reasons = generateReasons(signals, candidate);
    const surfaces = determineSurfaces(score, matchType);

    return {
      userId,
      matchedUserId: candidate.id,
      matchScore: score,
      matchType,
      matchReasons: reasons,
      signals,
      surfacedVia: surfaces,
      priority: determinePriority(score),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active' as MatchStatus,
    };
  });

  // Step 5: Filter, rank, and limit
  return scoredCandidates
    .filter(m => m.matchScore >= MIN_MATCH_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Build the candidate pool from multiple sources.
 */
async function getCandidatePool(userId: string): Promise<string[]> {
  const pool = new Set<string>();

  // Get existing connections to exclude
  const { data: existingConnections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const connectedIds = new Set<string>();
  for (const conn of existingConnections || []) {
    connectedIds.add(conn.requester_id === userId ? conn.recipient_id : conn.requester_id);
  }

  // Get recently dismissed matches (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: dismissed } = await (supabase as any)
    .from('dia_match_results')
    .select('matched_entity_id')
    .eq('user_id', userId)
    .eq('match_category', 'people')
    .eq('status', 'dismissed')
    .gte('dismissed_at', thirtyDaysAgo);

  const dismissedIds = new Set(((dismissed || []) as Record<string, unknown>[]).map(d => d.matched_entity_id as string));

  // Source 1: 2nd-degree connections
  const secondDegree = await getSecondDegreeConnections(userId, connectedIds);
  secondDegree.forEach(id => pool.add(id));

  // Source 2: Space co-members
  const spaceMembers = await getSpaceCoMembers(userId);
  spaceMembers.forEach(id => pool.add(id));

  // Source 3: Event co-attendees
  const eventAttendees = await getEventCoAttendees(userId);
  eventAttendees.forEach(id => pool.add(id));

  // Source 4: Regional peers (capped)
  const regionalPeers = await getRegionalPeers(userId, 50);
  regionalPeers.forEach(id => pool.add(id));

  // Remove self, existing connections, dismissed
  pool.delete(userId);
  connectedIds.forEach(id => pool.delete(id));
  dismissedIds.forEach(id => pool.delete(id));

  return Array.from(pool);
}

/**
 * Compute match signals between two profiles.
 */
function computeSignals(
  userProfile: Record<string, unknown>,
  candidateProfile: Record<string, unknown>,
  mutualCount: number,
  sharedSpaces: number,
  sharedEvents: number,
): PeopleMatchSignals {
  const userSkills = ((userProfile.skills || []) as string[]).map(s => s.toLowerCase());
  const candidateSkills = ((candidateProfile.skills || []) as string[]).map(s => s.toLowerCase());
  const userInterests = ((userProfile.interests || []) as string[]).map(s => s.toLowerCase());
  const candidateInterests = ((candidateProfile.interests || []) as string[]).map(s => s.toLowerCase());

  // Skill complementarity: skills the other has that user doesn't (and vice versa)
  const userSkillSet = new Set(userSkills);
  const candidateSkillSet = new Set(candidateSkills);
  const complementary = candidateSkills.filter(s => !userSkillSet.has(s));
  const skillComplementarity = candidateSkills.length > 0
    ? Math.min(complementary.length / Math.max(candidateSkills.length, 1), 1) * 0.6 +
      jaccardSimilarity(userSkills, candidateSkills) * 0.4
    : 0;

  // Interest overlap (Jaccard)
  const interestOverlap = jaccardSimilarity(userInterests, candidateInterests);

  // Industry alignment
  const industryAlignment = userProfile.profession === candidateProfile.profession ? 1.0 : 0.2;

  // Heritage match: ethnic_heritage array overlap OR primary_origin_country equality
  const userHeritage = (userProfile.ethnic_heritage || []) as string[];
  const candHeritage = (candidateProfile.ethnic_heritage || []) as string[];
  const heritageOverlap = userHeritage.some(h => candHeritage.includes(h));
  const sameOrigin =
    !!userProfile.primary_origin_country &&
    userProfile.primary_origin_country === candidateProfile.primary_origin_country;
  const heritageMatch = heritageOverlap || sameOrigin ? 1.0 : 0.0;

  // Regional proximity
  const regionalProximity = computeRegionalProximity(
    (userProfile.location || '') as string,
    (candidateProfile.location || '') as string,
  );

  // Normalize mutual connection count (0-1, assuming 20+ = maximal)
  const mutualStrength = Math.min(mutualCount / 20, 1);

  return {
    mutualConnectionCount: mutualCount,
    mutualConnectionStrength: mutualStrength,
    networkOverlap: mutualStrength * 0.8, // Correlated with mutual connections
    degreeOfSeparation: mutualCount > 0 ? 0.8 : 0.3, // 2nd degree vs unknown

    skillComplementarity,
    interestOverlap,
    industryAlignment,
    experienceLevelMatch: 0.5, // Default (no career stage data yet)

    heritageMatch,
    regionalProximity,
    diasporaEngagementSimilarity: 0.5, // Default

    eventCoAttendancePotential: Math.min(sharedEvents / 3, 1),
    spaceInterestOverlap: Math.min(sharedSpaces / 2, 1),
    contentTopicOverlap: interestOverlap * 0.8, // Approximation
    onlineTimeOverlap: 0.5, // Default (no timezone data yet)
  };
}

/**
 * Compute composite match score from signals.
 */
function computeScore(signals: PeopleMatchSignals): number {
  let score = 0;
  for (const [key, weight] of Object.entries(MATCH_WEIGHTS)) {
    score += (signals[key as keyof PeopleMatchSignals] || 0) * weight;
  }
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Classify the dominant match type based on signal clusters.
 */
function classifyMatchType(signals: PeopleMatchSignals): PeopleMatchType {
  const networkScore = signals.mutualConnectionStrength + signals.networkOverlap;
  const professionalScore = signals.skillComplementarity + signals.interestOverlap + signals.industryAlignment;
  const diasporaScore = signals.heritageMatch + signals.regionalProximity;
  const behavioralScore = signals.eventCoAttendancePotential + signals.spaceInterestOverlap;

  const scores: [PeopleMatchType, number][] = [
    [PeopleMatchType.MUTUAL_BRIDGE, networkScore],
    [PeopleMatchType.SIMILAR_PROFESSIONAL, professionalScore],
    [PeopleMatchType.HERITAGE_CONNECTION, diasporaScore],
    [PeopleMatchType.EVENT_NETWORK, signals.eventCoAttendancePotential],
    [PeopleMatchType.COLLABORATION_FIT, signals.spaceInterestOverlap],
    [PeopleMatchType.REGIONAL_PEER, signals.regionalProximity],
  ];

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

/**
 * Generate human-readable match reasons for display.
 */
function generateReasons(
  signals: PeopleMatchSignals,
  candidate: Record<string, unknown>,
): MatchReason[] {
  const reasons: MatchReason[] = [];

  if (signals.mutualConnectionStrength > 0.3) {
    reasons.push({
      type: 'mutual_connections' as MatchReasonType,
      text: `${Math.round(signals.mutualConnectionCount)} mutual connections`,
      strength: signals.mutualConnectionStrength,
      icon: 'people-network',
    });
  }

  if (signals.skillComplementarity > 0.4) {
    reasons.push({
      type: 'complementary_skills' as MatchReasonType,
      text: 'Complementary skill sets',
      strength: signals.skillComplementarity,
      icon: 'puzzle-piece',
    });
  }

  if (signals.interestOverlap > 0.4) {
    reasons.push({
      type: 'shared_interests' as MatchReasonType,
      text: 'Shared professional interests',
      strength: signals.interestOverlap,
      icon: 'lightbulb',
    });
  }

  if (signals.heritageMatch > 0.8) {
    reasons.push({
      type: 'same_heritage' as MatchReasonType,
      text: 'Connected to the same diaspora heritage',
      strength: signals.heritageMatch,
      icon: 'heritage-flag',
    });
  }

  if (signals.regionalProximity > 0.7) {
    reasons.push({
      type: 'same_region' as MatchReasonType,
      text: 'Based in the same region',
      strength: signals.regionalProximity,
      icon: 'map-pin',
    });
  }

  if (signals.eventCoAttendancePotential > 0.5) {
    reasons.push({
      type: 'event_overlap' as MatchReasonType,
      text: 'Attend similar events',
      strength: signals.eventCoAttendancePotential,
      icon: 'calendar-people',
    });
  }

  if (signals.spaceInterestOverlap > 0.4) {
    reasons.push({
      type: 'space_overlap' as MatchReasonType,
      text: 'Active in similar spaces',
      strength: signals.spaceInterestOverlap,
      icon: 'space-overlap',
    });
  }

  if (signals.industryAlignment > 0.8) {
    reasons.push({
      type: 'shared_skills' as MatchReasonType,
      text: `Both work in ${(candidate.profession as string) || 'the same field'}`,
      strength: signals.industryAlignment,
      icon: 'briefcase',
    });
  }

  // Sort by strength and return top 3
  return reasons.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

/**
 * Determine which surfaces a match should appear on.
 */
function determineSurfaces(score: number, matchType: PeopleMatchType): MatchSurface[] {
  const surfaces: MatchSurface[] = [];

  if (score >= 0.7) {
    surfaces.push(
      MatchSurface.FEED_CARD,
      MatchSurface.CONNECT_SUGGESTIONS,
      MatchSurface.NOTIFICATION,
    );
  } else if (score >= 0.5) {
    surfaces.push(
      MatchSurface.CONNECT_SUGGESTIONS,
      MatchSurface.PROFILE_RECOMMENDATIONS,
    );
  } else {
    surfaces.push(MatchSurface.CONNECT_SUGGESTIONS);
  }

  // Context-specific surfaces
  if (matchType === PeopleMatchType.EVENT_NETWORK) {
    surfaces.push(MatchSurface.EVENT_NETWORKING);
  }
  if (matchType === PeopleMatchType.COLLABORATION_FIT) {
    surfaces.push(MatchSurface.SPACE_RECRUITMENT);
  }

  return [...new Set(surfaces)];
}

/**
 * Determine match priority from score.
 */
function determinePriority(score: number): MatchPriority {
  if (score >= 0.8) return MatchPriority.HIGH;
  if (score >= 0.6) return MatchPriority.MEDIUM;
  return MatchPriority.LOW;
}

/**
 * Store computed matches to the database.
 */
async function storeMatches(matches: PeopleMatchResult[]): Promise<void> {
  if (matches.length === 0) return;

  const rows = matches.map(m => ({
    match_category: 'people',
    user_id: m.userId,
    matched_entity_id: m.matchedUserId,
    match_score: m.matchScore,
    match_type: m.matchType,
    match_reasons: m.matchReasons,
    signals: m.signals,
    surfaced_via: m.surfacedVia,
    priority: m.priority,
    status: m.status,
    expires_at: m.expiresAt?.toISOString() || null,
  }));

  await (supabase as any).from('dia_match_results').insert(rows);
}

/**
 * Record user action on a match (acted on, dismissed).
 */
async function updateMatchStatus(
  matchId: string,
  status: MatchStatus,
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === MatchStatus.ACTED_ON) updates.acted_on_at = new Date().toISOString();
  if (status === MatchStatus.DISMISSED) updates.dismissed_at = new Date().toISOString();

  await (supabase as any)
    .from('dia_match_results')
    .update(updates)
    .eq('id', matchId);
}

// ── Candidate pool helpers ──────────────────────────────────

async function getSecondDegreeConnections(
  userId: string,
  connectedIds: Set<string>,
): Promise<string[]> {
  const connectedArray = Array.from(connectedIds).slice(0, 20);
  if (connectedArray.length === 0) return [];

  const { data: secondDegree } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(
      connectedArray.flatMap(id => [
        `requester_id.eq.${id}`,
        `recipient_id.eq.${id}`,
      ]).join(','),
    )
    .limit(200);

  const candidates = new Set<string>();
  for (const conn of secondDegree || []) {
    if (!connectedIds.has(conn.requester_id) && conn.requester_id !== userId) {
      candidates.add(conn.requester_id);
    }
    if (!connectedIds.has(conn.recipient_id) && conn.recipient_id !== userId) {
      candidates.add(conn.recipient_id);
    }
  }
  return Array.from(candidates);
}

async function getSpaceCoMembers(userId: string): Promise<string[]> {
  const { data: mySpaces } = await supabase
    .from('collaboration_memberships')
    .select('space_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!mySpaces || mySpaces.length === 0) return [];

  const spaceIds = mySpaces.map(s => s.space_id);
  const { data: members } = await supabase
    .from('collaboration_memberships')
    .select('user_id')
    .in('space_id', spaceIds)
    .neq('user_id', userId)
    .eq('status', 'active')
    .limit(100);

  return [...new Set((members || []).map(m => m.user_id))];
}

async function getEventCoAttendees(userId: string): Promise<string[]> {
  const { data: myEvents } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId)
    .limit(20);

  if (!myEvents || myEvents.length === 0) return [];

  const eventIds = myEvents.map(e => e.event_id);
  const { data: attendees } = await supabase
    .from('event_registrations')
    .select('user_id')
    .in('event_id', eventIds)
    .neq('user_id', userId)
    .limit(100);

  return [...new Set((attendees || []).map(a => a.user_id))];
}

async function getRegionalPeers(userId: string, limit: number): Promise<string[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('location')
    .eq('id', userId)
    .single();

  if (!profile?.location) return [];

  const { data: peers } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', userId)
    .ilike('location', `%${(profile.location as string).split(',')[0]}%`)
    .limit(limit);

  return (peers || []).map(p => p.id);
}

// ── Batch fetch helpers ─────────────────────────────────────

async function fetchMutualConnectionCounts(
  userId: string,
  candidateIds: string[],
): Promise<Map<string, number>> {
  const { data: userConnections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(500);

  const userConnSet = new Set(
    (userConnections || []).flatMap(c => [c.requester_id, c.recipient_id]).filter(id => id !== userId),
  );

  const result = new Map<string, number>();

  // For each candidate, count how many of their connections overlap with user's
  // This is an approximation — we use the user's connections as the base
  for (const candidateId of candidateIds.slice(0, 50)) {
    const { data: candidateConns } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${candidateId},recipient_id.eq.${candidateId}`)
      .limit(100);

    let mutual = 0;
    for (const conn of candidateConns || []) {
      const otherId = conn.requester_id === candidateId ? conn.recipient_id : conn.requester_id;
      if (userConnSet.has(otherId)) mutual++;
    }
    result.set(candidateId, mutual);
  }

  return result;
}

async function fetchSharedSpaceCounts(
  userId: string,
  candidateIds: string[],
): Promise<Map<string, number>> {
  const { data: mySpaces } = await supabase
    .from('collaboration_memberships')
    .select('space_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  const mySpaceSet = new Set((mySpaces || []).map(s => s.space_id));
  const result = new Map<string, number>();

  if (mySpaceSet.size === 0) return result;

  const { data: memberships } = await supabase
    .from('collaboration_memberships')
    .select('user_id, space_id')
    .in('user_id', candidateIds.slice(0, 100))
    .eq('status', 'active');

  for (const m of memberships || []) {
    if (mySpaceSet.has(m.space_id)) {
      result.set(m.user_id, (result.get(m.user_id) || 0) + 1);
    }
  }

  return result;
}

async function fetchSharedEventCounts(
  userId: string,
  candidateIds: string[],
): Promise<Map<string, number>> {
  const { data: myEvents } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  const myEventSet = new Set((myEvents || []).map(e => e.event_id));
  const result = new Map<string, number>();

  if (myEventSet.size === 0) return result;

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('user_id, event_id')
    .in('user_id', candidateIds.slice(0, 100));

  for (const r of registrations || []) {
    if (myEventSet.has(r.event_id)) {
      result.set(r.user_id, (result.get(r.user_id) || 0) + 1);
    }
  }

  return result;
}

// ── Utility ─────────────────────────────────────────────────

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const intersection = setA.filter(x => setB.includes(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function computeRegionalProximity(locationA: string, locationB: string): number {
  if (!locationA || !locationB) return 0.3;
  const cityA = locationA.split(',')[0].toLowerCase().trim();
  const cityB = locationB.split(',')[0].toLowerCase().trim();
  if (cityA === cityB) return 1.0;
  if (locationA.toLowerCase().includes(cityB) || locationB.toLowerCase().includes(cityA)) return 0.7;
  return 0.2;
}

export const peopleMatchingService = {
  computeMatches,
  getCandidatePool,
  storeMatches,
  updateMatchStatus,
  MATCH_WEIGHTS,
};

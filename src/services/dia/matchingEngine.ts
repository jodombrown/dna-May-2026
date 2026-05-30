/**
 * DIA | Matching Engine Service
 *
 * Unified matching service that matches across all Five C's:
 * - Opportunities ↔ Profiles
 * - Events ↔ Interests
 * - Spaces ↔ Skills
 * - Profile ↔ Profile
 *
 * Extends the existing matchingService and opportunityMatchingService
 * with a unified interface and tier-gated scoring.
 *
 * Algorithms start rule-based, graduate to ML as data accumulates.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  MatchRequest,
  MatchResult,
  MatchFactor,
  MatchType,
  SubscriptionTier,
} from '@/types/dia';

/**
 * Find matches based on the request type and user context.
 */
async function findMatches(request: MatchRequest): Promise<MatchResult[]> {
  const { user_id, match_type, filters, limit = 20 } = request;

  switch (match_type) {
    case 'opportunity_to_profile':
      return matchOpportunitiesToProfile(user_id, limit, filters?.min_score);
    case 'event_to_interests':
      return matchEventsToInterests(user_id, limit);
    case 'space_to_skills':
      return matchSpacesToSkills(user_id, limit);
    case 'profile_to_profile':
      return matchProfilesToProfile(user_id, limit, filters?.skills, filters?.regions);
    default:
      return [];
  }
}

/**
 * Match open opportunities to a user's profile.
 */
async function matchOpportunitiesToProfile(
  userId: string,
  limit: number,
  minScore = 0,
): Promise<MatchResult[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, interests, location, profession')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  const { data: opportunities } = await supabase
    .from('contribution_needs')
    .select('id, title, description, type, region')
    .eq('status', 'open')
    .limit(100);

  if (!opportunities) return [];

  const userSkills = new Set((profile.skills || []).map((s: string) => s.toLowerCase()));
  const userInterests = new Set((profile.interests || []).map((s: string) => s.toLowerCase()));

  const results: MatchResult[] = opportunities
    .map(opp => {
      const factors: MatchFactor[] = [];
      let totalScore = 0;

      // Interest alignment from description (weight: 0.50)
      const description = (opp.description || '').toLowerCase();
      const interestMatches = Array.from(userInterests).filter(i => description.includes(i));
      const skillMatches = Array.from(userSkills).filter(s => description.includes(s));
      const relevanceScore = Math.min(100, (interestMatches.length * 25) + (skillMatches.length * 20));
      factors.push({
        factor: 'relevance',
        weight: 0.50,
        score: relevanceScore,
        detail: [...interestMatches, ...skillMatches].slice(0, 3).join(', ') || 'General match',
      });
      totalScore += relevanceScore * 0.50;

      // Region proximity (weight: 0.30)
      const locationScore = opp.region && profile.location &&
        (opp.region.toLowerCase().includes(profile.location.toLowerCase().split(',')[0]))
        ? 80 : 20;
      factors.push({
        factor: 'location',
        weight: 0.30,
        score: locationScore,
        detail: locationScore > 50 ? 'Region match' : 'Different region',
      });
      totalScore += locationScore * 0.30;

      // Type alignment (weight: 0.20)
      const typeScore = 50; // Baseline
      factors.push({
        factor: 'type_alignment',
        weight: 0.20,
        score: typeScore,
        detail: `${opp.type || 'general'} opportunity`,
      });
      totalScore += typeScore * 0.20;

      return {
        entity_id: opp.id,
        entity_type: 'opportunity' as const,
        match_score: Math.round(totalScore),
        match_factors: factors,
        match_reason: buildMatchReason(factors),
        tier_gated: false, // Scores visible to all; details gated for Pro
      };
    })
    .filter(r => r.match_score >= minScore)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return results;
}

/**
 * Match upcoming events to a user's interests.
 */
async function matchEventsToInterests(userId: string, limit: number): Promise<MatchResult[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('interests, location, skills')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, tags, location_name, start_time')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(50);

  if (!events) return [];

  const userInterests = new Set((profile.interests || []).map((s: string) => s.toLowerCase()));
  const userSkills = new Set((profile.skills || []).map((s: string) => s.toLowerCase()));

  return events
    .map(event => {
      const factors: MatchFactor[] = [];
      let totalScore = 0;

      // Topic / interest match
      const desc = `${event.title} ${event.description || ''} ${((event.tags || []) as string[]).join(' ')}`.toLowerCase();
      const interestHits = Array.from(userInterests).filter(i => desc.includes(i));
      const skillHits = Array.from(userSkills).filter(s => desc.includes(s));
      const relevanceScore = Math.min(100, (interestHits.length * 25) + (skillHits.length * 20));

      factors.push({
        factor: 'relevance',
        weight: 0.60,
        score: relevanceScore,
        detail: [...interestHits, ...skillHits].slice(0, 3).join(', ') || 'General interest',
      });
      totalScore += relevanceScore * 0.60;

      // Location proximity
      const locScore = event.location_name && profile.location &&
        (event.location_name as string).toLowerCase().includes(profile.location.toLowerCase().split(',')[0])
        ? 80 : 30;
      factors.push({ factor: 'location', weight: 0.25, score: locScore, detail: '' });
      totalScore += locScore * 0.25;

      // Recency boost — sooner events score higher
      factors.push({ factor: 'timing', weight: 0.15, score: 60, detail: '' });
      totalScore += 60 * 0.15;

      return {
        entity_id: event.id,
        entity_type: 'event' as const,
        match_score: Math.round(totalScore),
        match_factors: factors,
        match_reason: buildMatchReason(factors),
        tier_gated: false,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

/**
 * Match collaboration spaces to a user's skills.
 */
async function matchSpacesToSkills(userId: string, limit: number): Promise<MatchResult[]> {
  // collaboration_spaces/collaboration_memberships tables retired (DIA/ADIN out
  // of scope) — space recommendations disabled; return no matches.
  return [];
}

/**
 * Match profiles to a user for "People You Should Know" recommendations.
 */
async function matchProfilesToProfile(
  userId: string,
  limit: number,
  skillFilter?: string[],
  regionFilter?: string[],
): Promise<MatchResult[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, interests, location, profession')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  // Build query for candidate profiles
  let query = supabase
    .from('profiles')
    .select('id, full_name, skills, interests, location, profession')
    .neq('id', userId)
    .limit(100);

  if (skillFilter && skillFilter.length > 0) {
    query = query.overlaps('skills', skillFilter);
  }

  const { data: candidates } = await query;
  if (!candidates) return [];

  const userSkills = new Set((profile.skills || []).map((s: string) => s.toLowerCase()));
  const userInterests = new Set((profile.interests || []).map((s: string) => s.toLowerCase()));

  return candidates
    .map(candidate => {
      const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
      const candidateInterests = (candidate.interests || []).map((s: string) => s.toLowerCase());

      const sharedSkills = candidateSkills.filter((s: string) => userSkills.has(s));
      const sharedInterests = candidateInterests.filter((s: string) => userInterests.has(s));
      const sameProfession = candidate.profession === profile.profession;

      const score = Math.min(100,
        sharedSkills.length * 15 +
        sharedInterests.length * 10 +
        (sameProfession ? 20 : 0) +
        10, // Baseline
      );

      return {
        entity_id: candidate.id,
        entity_type: 'profile' as const,
        match_score: score,
        match_factors: [
          { factor: 'skills', weight: 0.4, score: sharedSkills.length * 25, detail: sharedSkills.join(', ') },
          { factor: 'interests', weight: 0.3, score: sharedInterests.length * 20, detail: sharedInterests.join(', ') },
          { factor: 'profession', weight: 0.3, score: sameProfession ? 100 : 0, detail: candidate.profession || '' },
        ],
        match_reason: buildMatchReason([
          { factor: 'skills', weight: 0.4, score: sharedSkills.length * 25, detail: sharedSkills.join(', ') },
        ]),
        tier_gated: false,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

/**
 * Build a human-readable match reason from the top factors.
 */
function buildMatchReason(factors: MatchFactor[]): string {
  const topFactors = factors
    .filter(f => f.score > 30 && f.detail)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 2);

  if (topFactors.length === 0) return 'Recommended for you';
  return topFactors.map(f => f.detail).filter(Boolean).join(' • ') || 'Recommended for you';
}

export const matchingEngineService = {
  findMatches,
  matchOpportunitiesToProfile,
  matchEventsToInterests,
  matchSpacesToSkills,
  matchProfilesToProfile,
};

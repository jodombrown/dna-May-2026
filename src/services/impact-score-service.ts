/**
 * DNA | Impact Score Service — Sprint 13A
 *
 * Computes a 0-100 engagement score for each of the Five C's
 * based on user activity. This powers the radar chart on profiles.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ImpactScores {
  connect: number;
  convene: number;
  collaborate: number;
  contribute: number;
  convey: number;
  overall: number;
  trend: 'rising' | 'stable' | 'declining';
  strongestC: string;
  growthOpportunityC: string;
}

// ============================================================
// HELPER: Diminishing returns curve
// ============================================================
function diminishingScore(value: number, thresholds: [number, number][], maxScore: number): number {
  let score = 0;
  for (const [threshold, points] of thresholds) {
    if (value >= threshold) {
      score = points;
    }
  }
  return Math.min(score, maxScore);
}

// ============================================================
// CONNECT SCORE (100 pts)
// ============================================================
async function computeConnectScore(userId: string): Promise<number> {
  // Connection count
  const { count: connectionCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted');

  const connCount = connectionCount ?? 0;
  const connectionPts = diminishingScore(connCount, [
    [0, 0], [1, 10], [10, 20], [25, 35], [50, 50],
  ], 50);

  // Country span — count distinct countries from connected profiles
  const { data: connectedUsers } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted')
    .limit(200);

  const connectedIds = (connectedUsers ?? []).map(c =>
    c.requester_id === userId ? c.recipient_id : c.requester_id
  );

  let countrySpan = 0;
  if (connectedIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('current_country')
      .in('id', connectedIds.slice(0, 100));

    const uniqueCountries = new Set(
      (profiles ?? []).map(p => p.current_country).filter(Boolean)
    );
    countrySpan = uniqueCountries.size;
  }

  const countryPts = diminishingScore(countrySpan, [
    [0, 0], [1, 5], [3, 10], [5, 20], [10, 30],
  ], 30);

  // Recent growth (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted')
    .gte('created_at', thirtyDaysAgo);

  const recentPts = diminishingScore(recentCount ?? 0, [
    [0, 0], [1, 5], [3, 10], [6, 20],
  ], 20);

  return Math.min(connectionPts + countryPts + recentPts, 100);
}

// ============================================================
// CONVENE SCORE (100 pts)
// ============================================================
async function computeConveneScore(userId: string): Promise<number> {
  // Events hosted
  const { count: hostedCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', userId);

  const hostedPts = diminishingScore(hostedCount ?? 0, [
    [0, 0], [1, 15], [3, 30], [5, 50],
  ], 50);

  // Events attended
  const { count: attendedCount } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const attendedPts = diminishingScore(attendedCount ?? 0, [
    [0, 0], [1, 10], [3, 20], [5, 30],
  ], 30);

  // Upcoming events
  const now = new Date().toISOString();
  const { count: upcomingCount } = await supabase
    .from('event_attendees')
    .select('*, events!inner(start_time)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('events.start_time', now);

  const upcomingPts = (upcomingCount ?? 0) >= 1 ? 20 : 0;

  return Math.min(hostedPts + attendedPts + upcomingPts, 100);
}

// ============================================================
// COLLABORATE SCORE (100 pts)
// ============================================================
async function computeCollaborateScore(userId: string): Promise<number> {
  // Spaces created/led
  const { count: spacesLed } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId);

  const ledPts = diminishingScore(spacesLed ?? 0, [
    [0, 0], [1, 15], [2, 25], [3, 40],
  ], 40);

  // Spaces participating in
  const { count: spacesJoined } = await supabase
    .from('space_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const joinedPts = diminishingScore(spacesJoined ?? 0, [
    [0, 0], [1, 10], [2, 20], [3, 30],
  ], 30);

  // Active in last 14 days bonus
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentActivity } = await supabase
    .from('space_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', fourteenDaysAgo);

  // Tasks completed — check if tasks table exists, if query fails just skip
  let taskPts = 0;
  try {
    const { count: tasksCompleted } = await supabase
      .from('space_tasks' as any)
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'completed');
    taskPts = diminishingScore(tasksCompleted ?? 0, [
      [0, 0], [5, 10], [10, 20],
    ], 20);
  } catch {
    // Tasks table may not exist — skip
  }

  const activePts = (recentActivity ?? 0) > 0 ? 10 : 0;

  return Math.min(ledPts + joinedPts + taskPts + activePts, 100);
}

// ============================================================
// CONTRIBUTE SCORE (100 pts)
// ============================================================
async function computeContributeScore(userId: string): Promise<number> {
  // Opportunities posted
  const { count: postedCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId);

  const postedPts = diminishingScore(postedCount ?? 0, [
    [0, 0], [1, 15], [3, 30], [5, 40],
  ], 40);

  // Opportunities fulfilled (status = fulfilled and user was creator)
  const { count: fulfilledCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('status', 'fulfilled');

  const fulfilledPts = diminishingScore(fulfilledCount ?? 0, [
    [0, 0], [1, 20], [3, 40],
  ], 40);

  // Interest expressed in others' opportunities
  let interestPts = 0;
  try {
    const { count: interestCount } = await supabase
      .from('opportunity_interests' as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    interestPts = diminishingScore(interestCount ?? 0, [
      [0, 0], [1, 5], [3, 10],
    ], 10);
  } catch {
    // Table may not exist yet — check opportunity_applications as fallback
    try {
      const { count: appCount } = await supabase
        .from('opportunity_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', userId);
      interestPts = diminishingScore(appCount ?? 0, [
        [0, 0], [1, 5], [3, 10],
      ], 10);
    } catch {
      // Skip
    }
  }

  // Active participation bonus
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentOppActivity } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', thirtyDaysAgo);

  const activePts = (recentOppActivity ?? 0) > 0 ? 10 : 0;

  return Math.min(postedPts + fulfilledPts + interestPts + activePts, 100);
}

// ============================================================
// CONVEY SCORE (100 pts)
// ============================================================
async function computeConveyScore(userId: string): Promise<number> {
  // Posts/stories published
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);

  const postPts = diminishingScore(postCount ?? 0, [
    [0, 0], [1, 10], [3, 20], [5, 30], [10, 40],
  ], 40);

  // Follower count
  const { count: followerCount } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_id', userId);

  const followerPts = diminishingScore(followerCount ?? 0, [
    [0, 0], [5, 10], [15, 20], [30, 30],
  ], 30);

  // Engagement rate (reactions + comments on user's posts)
  let engagementPts = 0;
  const totalPosts = postCount ?? 0;
  if (totalPosts > 0) {
    const { count: reactionCount } = await supabase
      .from('post_reactions')
      .select('*, posts!inner(author_id)', { count: 'exact', head: true })
      .eq('posts.author_id', userId);

    const { count: commentCount } = await supabase
      .from('post_comments')
      .select('*, posts!inner(author_id)', { count: 'exact', head: true })
      .eq('posts.author_id', userId);

    const totalEngagement = (reactionCount ?? 0) + (commentCount ?? 0);
    const rate = totalEngagement / totalPosts;
    if (rate >= 5) {
      engagementPts = 30;
    } else if (rate >= 2) {
      engagementPts = 15;
    }
  }

  return Math.min(postPts + followerPts + engagementPts, 100);
}

// ============================================================
// TREND DETECTION
// ============================================================
function detectTrend(
  currentScores: Omit<ImpactScores, 'trend' | 'strongestC' | 'growthOpportunityC' | 'overall'>,
  previousScores: Record<string, number> | null
): 'rising' | 'stable' | 'declining' {
  if (!previousScores) return 'stable';

  const currentTotal =
    currentScores.connect + currentScores.convene +
    currentScores.collaborate + currentScores.contribute + currentScores.convey;
  const previousTotal =
    (previousScores.connect ?? 0) + (previousScores.convene ?? 0) +
    (previousScores.collaborate ?? 0) + (previousScores.contribute ?? 0) +
    (previousScores.convey ?? 0);

  const diff = currentTotal - previousTotal;
  if (diff > 15) return 'rising';
  if (diff < -15) return 'declining';
  return 'stable';
}

// ============================================================
// MAIN: Compute all Impact Scores
// ============================================================
export async function computeImpactScores(userId: string): Promise<ImpactScores> {
  try {
    const [connect, convene, collaborate, contribute, convey] = await Promise.all([
      computeConnectScore(userId),
      computeConveneScore(userId),
      computeCollaborateScore(userId),
      computeContributeScore(userId),
      computeConveyScore(userId),
    ]);

    const scores = { connect, convene, collaborate, contribute, convey };
    const overall = Math.round(
      (connect + convene + collaborate + contribute + convey) / 5
    );

    // Determine strongest and growth opportunity
    const cEntries = Object.entries(scores) as [string, number][];
    cEntries.sort((a, b) => b[1] - a[1]);
    const strongestC = cEntries[0][0];
    const growthOpportunityC = cEntries[cEntries.length - 1][0];

    // Get previous scores for trend detection
    let previousScores: Record<string, number> | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: profile } = await db
        .from('profiles')
        .select('impact_scores')
        .eq('id', userId)
        .single();

      if (profile?.impact_scores && typeof profile.impact_scores === 'object') {
        previousScores = profile.impact_scores as Record<string, number>;
      }
    } catch {
      // No previous scores
    }

    const trend = detectTrend(scores, previousScores);

    const result: ImpactScores = {
      ...scores,
      overall,
      trend,
      strongestC,
      growthOpportunityC,
    };

    // Cache the computed scores
    try {
      await supabase
        .from('profiles')
        .update({
          impact_scores: result as unknown as Record<string, unknown>,
          impact_scores_updated_at: new Date().toISOString(),
        } as any)
        .eq('id', userId);
    } catch (err) {
      logger.warn('ImpactScoreService', 'Failed to cache scores', err);
    }

    return result;
  } catch (err) {
    logger.warn('ImpactScoreService', 'Failed to compute scores', err);
    // Return zeros on failure
    return {
      connect: 0,
      convene: 0,
      collaborate: 0,
      contribute: 0,
      convey: 0,
      overall: 0,
      trend: 'stable',
      strongestC: 'connect',
      growthOpportunityC: 'connect',
    };
  }
}

/**
 * Get cached scores if fresh, else recompute
 */
export async function getOrComputeImpactScores(userId: string): Promise<ImpactScores> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db
      .from('profiles')
      .select('impact_scores, impact_scores_updated_at')
      .eq('id', userId)
      .single();

    if (profile?.impact_scores && profile?.impact_scores_updated_at) {
      const updatedAt = new Date(profile.impact_scores_updated_at as string).getTime();
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - updatedAt < staleThreshold) {
        return profile.impact_scores as unknown as ImpactScores;
      }
    }
  } catch {
    // Fall through to compute
  }

  return computeImpactScores(userId);
}

/**
 * DIA | Regional Intelligence Service
 *
 * Aggregates activity by region and identifies regional patterns.
 * Powers: Regional Hubs, Feed (regional relevance), Events (attendance prediction)
 *
 * Regions are based on the African continental model:
 * North, West, East, Central, Southern Africa + Global Diaspora hubs
 */

import { supabase } from '@/integrations/supabase/client';
import type { RegionalInsight, RegionalQuery } from '@/types/dia';

/** Known African regions and major diaspora hubs */
export const AFRICAN_REGIONS = [
  'North Africa',
  'West Africa',
  'East Africa',
  'Central Africa',
  'Southern Africa',
] as const;

export const DIASPORA_HUBS = [
  'North America',
  'Europe',
  'United Kingdom',
  'Caribbean',
  'Middle East',
  'Asia Pacific',
] as const;

/**
 * Get intelligence insights for a specific region.
 */
async function getRegionalInsight(query: RegionalQuery): Promise<RegionalInsight> {
  const { region, time_window = 'month' } = query;

  const [userStats, eventStats, spaceStats, opportunityStats, trendingTopics] =
    await Promise.all([
      getRegionalUserStats(region),
      getRegionalEventStats(region),
      getRegionalSpaceStats(region),
      getRegionalOpportunityStats(region),
      getRegionalTrending(region),
    ]);

  // Compute growth rate (simplified — compare this month vs last month)
  const growthRate = userStats.newUsers > 0
    ? Math.round((userStats.newUsers / Math.max(1, userStats.totalUsers - userStats.newUsers)) * 100)
    : 0;

  // Generate insights
  const insights = generateRegionalInsights(
    region,
    userStats,
    eventStats,
    spaceStats,
    opportunityStats,
  );

  return {
    region,
    active_users: userStats.totalUsers,
    trending_topics: trendingTopics,
    top_skills_demand: [],
    upcoming_events_count: eventStats.upcomingCount,
    active_spaces_count: spaceStats.activeCount,
    open_opportunities_count: opportunityStats.openCount,
    growth_rate: growthRate,
    insights,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Get active user count for a region.
 */
async function getRegionalUserStats(region: string) {
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .ilike('location', `%${region}%`);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .ilike('location', `%${region}%`)
    .gte('created_at', thirtyDaysAgo);

  return { totalUsers: totalUsers || 0, newUsers: newUsers || 0 };
}

/**
 * Get event stats for a region.
 */
async function getRegionalEventStats(region: string) {
  const { count: upcomingCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .ilike('location', `%${region}%`)
    .gte('start_date', new Date().toISOString());

  return { upcomingCount: upcomingCount || 0 };
}

/**
 * Get collaboration space stats for a region.
 */
async function getRegionalSpaceStats(region: string) {
  // collaboration_spaces table retired (DIA/ADIN out of scope) — stub to 0.
  return { activeCount: 0 };
}

/**
 * Get opportunity stats for a region.
 */
async function getRegionalOpportunityStats(region: string) {
  const { count: openCount } = await supabase
    .from('contribution_needs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .ilike('location', `%${region}%`);

  return { openCount: openCount || 0 };
}

/**
 * Get trending topics for a region.
 */
async function getRegionalTrending(region: string): Promise<string[]> {
  // Simplified: get topics from recent posts by users in the region
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recentPosts) return [];

  // Count hashtags
  const tagCounts = new Map<string, number>();
  for (const post of recentPosts) {
    const tags = (post.content || '').match(/#(\w{2,30})/g);
    if (tags) {
      for (const tag of tags) {
        const normalized = tag.toLowerCase();
        tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

/**
 * Generate human-readable insights for a region.
 */
function generateRegionalInsights(
  region: string,
  userStats: { totalUsers: number; newUsers: number },
  eventStats: { upcomingCount: number },
  spaceStats: { activeCount: number },
  opportunityStats: { openCount: number },
): string[] {
  const insights: string[] = [];

  if (userStats.newUsers > 0) {
    insights.push(`${userStats.newUsers} new members joined from ${region} this month`);
  }

  if (eventStats.upcomingCount > 0) {
    insights.push(`${eventStats.upcomingCount} upcoming events in ${region}`);
  }

  if (opportunityStats.openCount > 0) {
    insights.push(`${opportunityStats.openCount} open opportunities in ${region}`);
  }

  if (insights.length === 0) {
    insights.push(`Be an early mover — start building the ${region} diaspora network`);
  }

  return insights;
}

export const regionalIntelligenceService = {
  getRegionalInsight,
  AFRICAN_REGIONS,
  DIASPORA_HUBS,
};

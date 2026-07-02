/**
 * DNA | Weekly Digest Engine
 *
 * DIA-curated weekly digest generation across all Five C's.
 * "Here's what happened in your diaspora network this week."
 *
 * The digest provides:
 * - Summary stats (connections, events, tasks, opportunities, engagement)
 * - Top highlights per C module
 * - DIA-generated insights about Five C's balance
 * - Actionable calls to action
 */

import { supabase } from '@/integrations/supabase/client';
import { CModule } from '@/types/composer';
import type {
  WeeklyDigest,
  DigestStats,
  DigestHighlight,
  DigestAction,
} from '@/types/notificationSystem';

// Cast for tables not in generated types
const db = supabase as any;

export const digestService = {

  // ============================================
  // GENERATE WEEKLY DIGEST
  // ============================================

  async generateDigest(userId: string): Promise<WeeklyDigest> {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [stats, highlights] = await Promise.all([
      this.computeStats(userId, weekStart, weekEnd),
      this.curateHighlights(userId, weekStart, weekEnd),
    ]);

    const insights = this.generateInsights(stats, highlights);
    const actions = this.generateActions(stats);

    return {
      userId,
      weekStarting: weekStart.toISOString(),
      weekEnding: weekEnd.toISOString(),
      stats,
      highlights,
      diaInsights: insights,
      actions,
    };
  },

  // ============================================
  // COMPUTE WEEKLY STATS
  // ============================================

  async computeStats(userId: string, weekStart: Date, weekEnd: Date): Promise<DigestStats> {
    const since = weekStart.toISOString();

    const [
      connectionsRes,
      profileViewsRes,
      eventsAttendedRes,
      upcomingEventsRes,
      tasksCompletedRes,
      opportunityMatchesRes,
      postsRes,
    ] = await Promise.all([
      // New connections this week
      supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .gte('created_at', since),

      // Profile views
      db
        .from('notification_records')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('type', 'profile_viewed')
        .gte('created_at', since),

      // Events attended
      supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since),

      // Upcoming events
      supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekEnd.toISOString()),

      // Tasks completed
      supabase
        .from('space_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', userId)
        .eq('status', 'done')
        .gte('updated_at', since),

      // Opportunity matches
      db
        .from('notification_records')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('type', 'opportunity_match')
        .gte('created_at', since),

      // Post engagement — posts has view_count, not like_count/comment_count/share_count
      supabase
        .from('posts')
        .select('view_count')
        .eq('author_id', userId)
        .gte('created_at', since),
    ]);

    const totalEngagement = (postsRes.data || []).reduce(
      (sum: number, p: { view_count: number | null }) => sum + (p.view_count || 0),
      0
    );

    const newConnections = connectionsRes.count || 0;
    const totalInteractions =
      newConnections +
      (profileViewsRes.count || 0) +
      (eventsAttendedRes.count || 0) +
      (tasksCompletedRes.count || 0) +
      totalEngagement;

    return {
      newConnections,
      profileViews: profileViewsRes.count || 0,
      eventsAttended: eventsAttendedRes.count || 0,
      upcomingEvents: upcomingEventsRes.count || 0,
      tasksCompleted: tasksCompletedRes.count || 0,
      opportunityMatches: opportunityMatchesRes.count || 0,
      storyEngagement: totalEngagement,
      totalInteractions,
      networkGrowthPercent: 0, // Would need previous week data
    };
  },

  // ============================================
  // CURATE HIGHLIGHTS
  // ============================================

  async curateHighlights(
    userId: string,
    weekStart: Date,
    _weekEnd: Date
  ): Promise<WeeklyDigest['highlights']> {
    const since = weekStart.toISOString();

    const [connectHighlights, conveneHighlights, collaborateHighlights, contributeHighlights, conveyHighlights] =
      await Promise.all([
        this.getConnectHighlights(userId, since),
        this.getConveneHighlights(userId, since),
        this.getCollaborateHighlights(userId, since),
        this.getContributeHighlights(userId, since),
        this.getConveyHighlights(userId, since),
      ]);

    return {
      connect: connectHighlights,
      convene: conveneHighlights,
      collaborate: collaborateHighlights,
      contribute: contributeHighlights,
      convey: conveyHighlights,
    };
  },

  async getConnectHighlights(userId: string, since: string): Promise<DigestHighlight[]> {
    const highlights: DigestHighlight[] = [];

    const { data: topPost } = await supabase
      .from('posts')
      .select('id, content, view_count')
      .eq('author_id', userId)
      .gte('created_at', since)
      .order('view_count', { ascending: false })
      .limit(1)
      .single();

    if (topPost && (topPost.view_count || 0) > 0) {
      highlights.push({
        cModule: CModule.CONNECT,
        type: 'top_post',
        title: 'Your top post this week',
        subtitle: (topPost.content || '').slice(0, 60) + '...',
        metric: `${topPost.view_count} views`,
        actionUrl: `/dna/feed?post=${topPost.id}`,
      });
    }

    return highlights;
  },

  async getConveneHighlights(userId: string, since: string): Promise<DigestHighlight[]> {
    const highlights: DigestHighlight[] = [];

    const { data: events } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId)
      .gte('created_at', since)
      .limit(3);

    if (events && events.length > 0) {
      highlights.push({
        cModule: CModule.CONVENE,
        type: 'events_attended',
        title: `${events.length} event${events.length > 1 ? 's' : ''} this week`,
        subtitle: 'You showed up for the diaspora.',
        metric: `${events.length} attended`,
        actionUrl: '/dna/convene',
      });
    }

    return highlights;
  },

  async getCollaborateHighlights(userId: string, since: string): Promise<DigestHighlight[]> {
    const highlights: DigestHighlight[] = [];

    const { count: completedTasks } = await supabase
      .from('space_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', userId)
      .eq('status', 'done')
      .gte('updated_at', since);

    if (completedTasks && completedTasks > 0) {
      highlights.push({
        cModule: CModule.COLLABORATE,
        type: 'tasks_completed',
        title: `${completedTasks} task${completedTasks > 1 ? 's' : ''} completed`,
        subtitle: 'Great progress on your Spaces.',
        metric: `${completedTasks} done`,
        actionUrl: '/dna/collaborate',
      });
    }

    return highlights;
  },

  async getContributeHighlights(userId: string, since: string): Promise<DigestHighlight[]> {
    const highlights: DigestHighlight[] = [];

    const { count: matches } = await db
      .from('notification_records')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('type', 'opportunity_match')
      .gte('created_at', since);

    if (matches && matches > 0) {
      highlights.push({
        cModule: CModule.CONTRIBUTE,
        type: 'opportunity_matches',
        title: `${matches} opportunity match${matches > 1 ? 'es' : ''}`,
        subtitle: 'Skills in demand from the diaspora.',
        metric: `${matches} matches`,
        actionUrl: '/dna/contribute',
      });
    }

    return highlights;
  },

  async getConveyHighlights(userId: string, since: string): Promise<DigestHighlight[]> {
    const highlights: DigestHighlight[] = [];

    const { data: posts } = await supabase
      .from('posts')
      .select('view_count')
      .eq('author_id', userId)
      .gte('created_at', since);

    const totalEngagement = (posts || []).reduce(
      (sum: number, p: { view_count: number | null }) => sum + (p.view_count || 0),
      0
    );

    if (totalEngagement > 0) {
      highlights.push({
        cModule: CModule.CONVEY,
        type: 'content_engagement',
        title: `${totalEngagement} view${totalEngagement > 1 ? 's' : ''} on your content`,
        subtitle: 'Your voice resonated this week.',
        metric: `${totalEngagement} total`,
        actionUrl: '/dna/convey',
      });
    }

    return highlights;
  },

  // ============================================
  // GENERATE DIA INSIGHTS
  // ============================================

  generateInsights(
    stats: DigestStats,
    highlights: WeeklyDigest['highlights']
  ): string[] {
    const insights: string[] = [];

    // Network growth
    if (stats.newConnections > 0) {
      insights.push(
        `Your network grew by ${stats.newConnections} connection${stats.newConnections > 1 ? 's' : ''} this week.`
      );
    }

    // Engagement
    if (stats.totalInteractions > 10) {
      insights.push(
        `You had ${stats.totalInteractions} interactions this week \u2014 ` +
        `that\u2019s ${stats.totalInteractions > 20 ? 'above' : 'around'} average for your network.`
      );
    }

    // Missed opportunities
    if (stats.opportunityMatches > 0) {
      insights.push(
        `${stats.opportunityMatches} opportunity match${stats.opportunityMatches > 1 ? 'es are' : ' is'} ` +
        'waiting for you in Contribute.'
      );
    }

    // Five C's balance
    const activeCs: string[] = [];
    if (highlights.connect.length > 0) activeCs.push('CONNECT');
    if (highlights.convene.length > 0) activeCs.push('CONVENE');
    if (highlights.collaborate.length > 0) activeCs.push('COLLABORATE');
    if (highlights.contribute.length > 0) activeCs.push('CONTRIBUTE');
    if (highlights.convey.length > 0) activeCs.push('CONVEY');

    if (activeCs.length < 3) {
      const allCs = ['CONNECT', 'CONVENE', 'COLLABORATE', 'CONTRIBUTE', 'CONVEY'];
      const inactiveCs = allCs.filter(c => !activeCs.includes(c));
      insights.push(
        `You were active in ${activeCs.length} of the Five C\u2019s this week. ` +
        `Explore ${inactiveCs[0]} to unlock more of DNA\u2019s potential.`
      );
    } else if (activeCs.length === 5) {
      insights.push(
        'You engaged all Five C\u2019s this week \u2014 full spectrum diaspora participation!'
      );
    }

    return insights;
  },

  // ============================================
  // GENERATE ACTIONS
  // ============================================

  generateActions(stats: DigestStats): DigestAction[] {
    const actions: DigestAction[] = [];

    if (stats.newConnections === 0) {
      actions.push({
        label: 'Grow your network',
        description: 'Browse people who share your skills and interests.',
        url: '/dna/connect/discover',
        cModule: CModule.CONNECT,
      });
    }

    if (stats.eventsAttended === 0) {
      actions.push({
        label: 'Discover events',
        description: 'Find gatherings in the diaspora near you.',
        url: '/dna/convene/discover',
        cModule: CModule.CONVENE,
      });
    }

    if (stats.tasksCompleted === 0) {
      actions.push({
        label: 'Check your tasks',
        description: 'Stay on top of your Space commitments.',
        url: '/dna/collaborate',
        cModule: CModule.COLLABORATE,
      });
    }

    if (stats.opportunityMatches > 0) {
      actions.push({
        label: 'Review matches',
        description: `${stats.opportunityMatches} opportunity match${stats.opportunityMatches > 1 ? 'es' : ''} waiting.`,
        url: '/dna/contribute',
        cModule: CModule.CONTRIBUTE,
      });
    }

    if (stats.storyEngagement === 0) {
      actions.push({
        label: 'Share your voice',
        description: 'Write a post or story to engage your network.',
        url: '/dna/feed',
        cModule: CModule.CONVEY,
      });
    }

    return actions.slice(0, 3); // Max 3 actions
  },
};

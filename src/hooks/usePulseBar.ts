/**
 * usePulseBar - Real-time Pulse Bar Data Hook
 *
 * Fetches and maintains real-time pulse data across all Five C's.
 * Uses React Query for caching and Supabase realtime for live updates.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_TIMES } from '@/lib/queryClient';
import type {
  UserPulseData,
  PulseItem,
  ConnectPulse,
  ConvenePulse,
  CollaboratePulse,
  ContributePulse,
  ConveyPulse,
} from '@/types/pulse';

const PULSE_QUERY_KEY = 'pulse-bar';

/**
 * Helper to format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Fetch Connect pulse data (pending connections + suggestions)
 */
async function fetchConnectPulse(userId: string): Promise<ConnectPulse> {
  // Fetch pending connection requests where user is recipient (two-step pattern)
  const { data: pendingRequests } = await supabase
    .from('connections')
    .select('id, requester_id, created_at')
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch requester profiles separately
  const requesterIds = (pendingRequests || []).map((r) => r.requester_id);
  let requesterProfiles: Record<string, any> = {};
  
  if (requesterIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, headline, avatar_url')
      .in('id', requesterIds);
    
    requesterProfiles = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);
  }

  // Fetch connection recommendations
  const { data: recommendations } = await supabase
    .from('adin_recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('rec_type', 'connection')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(10);

  const pending = pendingRequests?.length || 0;
  const suggestions = recommendations?.length || 0;

  const topItems: PulseItem[] = (pendingRequests || []).slice(0, 3).map((req: { id: string; requester_id: string; created_at: string }) => {
    const profile = requesterProfiles[req.requester_id];
    return {
      id: req.id,
      title: profile?.display_name || profile?.full_name || 'Someone',
      subtitle: profile?.headline || 'wants to connect',
      avatar_url: profile?.avatar_url,
      action_url: `/connect/requests`,
      timestamp: req.created_at,
    };
  });

  let status: ConnectPulse['status'] = 'dormant';
  let microText = 'Grow your network';

  if (pending > 0) {
    status = 'active';
    microText = `${pending} pending`;
  } else if (suggestions > 0) {
    status = 'active';
    microText = `${suggestions} suggestions`;
  }

  return {
    count: pending + suggestions,
    status,
    micro_text: microText,
    top_items: topItems,
    pending_requests: pending,
    suggestions_count: suggestions,
  };
}

/**
 * Fetch Convene pulse data (upcoming events + invites)
 */
async function fetchConvenePulse(userId: string): Promise<ConvenePulse> {
  const now = new Date().toISOString();

  // Fetch upcoming events where user is attending
  const { data: upcomingEvents } = await supabase
    .from('event_attendees')
    .select(`
      id,
      status,
      events!inner (
        id,
        slug,
        title,
        start_time,
        cover_image_url
      )
    `)
    .eq('user_id', userId)
    .in('status', ['going', 'maybe'])
    .gte('events.start_time', now)
    .order('events(start_time)', { ascending: true })
    .limit(5);

  const upcoming = upcomingEvents?.length || 0;
  const nextEvent = upcomingEvents?.[0]?.events;

  const topItems: PulseItem[] = (upcomingEvents || []).slice(0, 3).map((att: { events: { id: string; slug?: string; title: string; start_time: string; cover_image_url?: string } }) => ({
    id: att.events.id,
    title: att.events.title,
    subtitle: formatRelativeTime(att.events.start_time),
    avatar_url: att.events.cover_image_url,
    action_url: `/dna/convene/events/${att.events.slug || att.events.id}`,
    timestamp: att.events.start_time,
  }));

  let status: ConvenePulse['status'] = 'dormant';
  let microText = 'Discover events';

  if (nextEvent) {
    status = 'active';
    microText = `Next: ${formatRelativeTime(nextEvent.start_time)}`;
  } else if (upcoming > 0) {
    status = 'active';
    microText = `${upcoming} upcoming`;
  }

  return {
    count: upcoming,
    status,
    micro_text: microText,
    top_items: topItems,
    upcoming_count: upcoming,
    pending_invites: 0, // No explicit invites table found
    next_event: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          starts_at: nextEvent.start_time,
        }
      : undefined,
  };
}

/**
 * Fetch Collaborate pulse data (active spaces)
 */
async function fetchCollaboratePulse(userId: string): Promise<CollaboratePulse> {
  // Fetch active spaces where user is a member
  const { data: memberSpaces } = await supabase
    .from('space_members')
    .select(`
      space_id,
      role,
      spaces!inner (
        id,
        name,
        status,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('spaces.status', 'active')
    .order('spaces(updated_at)', { ascending: false })
    .limit(10);

  const activeSpaces = memberSpaces?.length || 0;

  // Check for spaces that haven't been updated in 14+ days (potentially stalled)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const stalledSpaces = (memberSpaces || []).filter(
    (m: { spaces?: { updated_at?: string; id: string; name: string } }) => m.spaces?.updated_at && m.spaces.updated_at < twoWeeksAgo
  );
  const stalledCount = stalledSpaces.length;
  const attentionSpace = stalledSpaces[0]?.spaces;

  const topItems: PulseItem[] = (memberSpaces || []).slice(0, 3).map((m: { space_id: string; role: string; spaces: { id: string; name: string; status: string; updated_at: string } }) => {
    const isStalled = m.spaces?.updated_at && m.spaces.updated_at < twoWeeksAgo;
    return {
      id: m.spaces.id,
      title: m.spaces.name,
      subtitle: isStalled ? 'Needs attention' : 'Active',
      action_url: `/dna/collaborate/spaces/${m.spaces.id}`,
    };
  });

  let status: CollaboratePulse['status'] = 'dormant';
  let microText = 'Start collaborating';

  if (stalledCount > 0) {
    status = 'attention';
    microText = `"${attentionSpace?.name}" needs you`;
  } else if (activeSpaces > 0) {
    status = 'active';
    microText = `${activeSpaces} active spaces`;
  }

  return {
    count: activeSpaces,
    status,
    micro_text: microText,
    top_items: topItems,
    active_spaces: activeSpaces,
    stalled_count: stalledCount,
    attention_space: attentionSpace
      ? {
          id: attentionSpace.id,
          name: attentionSpace.name,
          status: 'stalling',
        }
      : undefined,
  };
}

/**
 * Fetch Contribute pulse data (matches + listings)
 */
async function fetchContributePulse(userId: string): Promise<ContributePulse> {
  // Fetch pending offers on user's contribution needs
  const { data: pendingOffers } = await supabase
    .from('contribution_offers')
    .select(`
      id,
      status,
      created_at,
      contribution_needs!inner (
        id,
        title,
        created_by
      )
    `)
    .eq('contribution_needs.created_by', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch user's open listings
  const { data: openListings } = await supabase
    .from('contribution_needs')
    .select('id, title')
    .eq('created_by', userId)
    .eq('status', 'open')
    .limit(10);

  const matchCount = pendingOffers?.length || 0;
  const openCount = openListings?.length || 0;

  const topItems: PulseItem[] = (pendingOffers || []).slice(0, 3).map((offer: { id: string; created_at: string; contribution_needs: { id: string; title: string } }) => ({
    id: offer.id,
    title: offer.contribution_needs.title,
    subtitle: 'New offer received',
    action_url: `/contribute/needs/${offer.contribution_needs.id}`,
    timestamp: offer.created_at,
  }));

  let status: ContributePulse['status'] = 'dormant';
  let microText = 'Browse opportunities';

  if (matchCount > 0) {
    status = 'active';
    microText = `${matchCount} matches`;
  } else if (openCount > 0) {
    status = 'active';
    microText = `${openCount} open listings`;
  }

  return {
    count: matchCount,
    status,
    micro_text: microText,
    top_items: topItems,
    match_count: matchCount,
    open_listings: openCount,
  };
}

/**
 * Fetch Convey pulse data (engagement + trending)
 */
async function fetchConveyPulse(userId: string): Promise<ConveyPulse> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch user's recent stories - Convey is the storytelling module, not the
  // generic feed. Only count actual stories (post_type='story' AND a non-null
  // story_type). Plain posts must never surface here.
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, content, created_at, post_type, story_type')
    .eq('author_id', userId)
    .gte('created_at', oneWeekAgo)
    .eq('is_deleted', false)
    .eq('post_type', 'story')
    .not('story_type', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch engagement counts separately for each post
  const postIds = (recentPosts || []).map((p) => p.id);
  let likeCounts: Record<string, number> = {};
  let commentCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    // Get likes count per post
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);
    
    (likes || []).forEach((l: { post_id: string }) => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
    });

    // Get comments count per post
    const { data: comments } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds);

    (comments || []).forEach((c: { post_id: string }) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });
  }

  // Calculate engagement
  let totalEngagement24h = 0;
  let topPost: { id: string; content: string; created_at: string; post_type: string; engagement: number } | null = null;
  let topEngagement = 0;

  (recentPosts || []).forEach((post) => {
    const likes = likeCounts[post.id] || 0;
    const comments = commentCounts[post.id] || 0;
    const engagement = likes + comments;

    if (new Date(post.created_at) >= new Date(oneDayAgo)) {
      totalEngagement24h += engagement;
    }

    if (engagement > topEngagement) {
      topEngagement = engagement;
      topPost = { ...post, engagement };
    }
  });

  const isTrending = topEngagement > 20;

  const topItems: PulseItem[] = (recentPosts || [])
    .slice(0, 3)
    .map((post) => {
      const likes = likeCounts[post.id] || 0;
      const comments = commentCounts[post.id] || 0;
      const engagement = likes + comments;
      return {
        id: post.id,
        title: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''),
        subtitle: `${engagement} engagements`,
        action_url: `/dna/convey/posts/${post.id}`,
        timestamp: post.created_at,
      };
    });

  let status: ConveyPulse['status'] = 'dormant';
  let microText = 'Share your story';

  if (isTrending) {
    status = 'active';
    microText = 'Trending!';
  } else if (totalEngagement24h > 0) {
    status = 'active';
    microText = `${totalEngagement24h} engagements`;
  }

  return {
    count: totalEngagement24h,
    status,
    micro_text: microText,
    top_items: topItems,
    total_engagement_24h: totalEngagement24h,
    is_trending: isTrending,
    top_performing_post: topPost
      ? {
          id: topPost.id,
          title: topPost.content?.substring(0, 50) || '',
          engagement_count: topEngagement,
        }
      : undefined,
  };
}

/**
 * Main hook to fetch all pulse data
 */
export function usePulseBar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PULSE_QUERY_KEY, user?.id],
    queryFn: async (): Promise<UserPulseData> => {
      if (!user?.id) throw new Error('No user');

      // Fetch all pulse data in parallel
      const [connect, convene, collaborate, contribute, convey] = await Promise.all([
        fetchConnectPulse(user.id),
        fetchConvenePulse(user.id),
        fetchCollaboratePulse(user.id),
        fetchContributePulse(user.id),
        fetchConveyPulse(user.id),
      ]);

      return {
        connect,
        convene,
        collaborate,
        contribute,
        convey,
        last_updated: new Date().toISOString(),
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes — pulse is non-critical ambient data
    // No refetchInterval: realtime subscriptions below cover the current user's
    // own writes; polling stacked on top of realtime just wastes bandwidth and
    // fires 10 Supabase reads every cycle.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Set up realtime subscriptions for instant updates.
  //
  // IMPORTANT: every channel MUST include a `filter` scoped to this user.
  // Unfiltered subscriptions on hot tables (post_likes, post_comments,
  // contribution_offers) fire for EVERY row change platform-wide, which
  // invalidates the pulse query dozens of times per minute and refires all
  // 10 fetches — that's why tapping a Pulse item felt like "forever."
  useEffect(() => {
    if (!user?.id) return;

    const instanceId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Debounced invalidator so a burst of realtime events collapses into a
    // single refetch instead of firing 10 Supabase reads per event.
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleInvalidate = () => {
      if (invalidateTimer) return;
      invalidateTimer = setTimeout(() => {
        invalidateTimer = null;
        queryClient.invalidateQueries({ queryKey: [PULSE_QUERY_KEY, user.id] });
      }, 400);
    };

    // Connection requests: only rows where this user is the recipient.
    channels.push(
      supabase
        .channel(`pulse-connect-${user.id}-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `recipient_id=eq.${user.id}`,
          },
          scheduleInvalidate
        )
        .subscribe()
    );

    // Event attendees: only this user's RSVPs.
    channels.push(
      supabase
        .channel(`pulse-convene-${user.id}-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_attendees',
            filter: `user_id=eq.${user.id}`,
          },
          scheduleInvalidate
        )
        .subscribe()
    );

    // Space memberships: only this user's memberships.
    channels.push(
      supabase
        .channel(`pulse-collaborate-${user.id}-${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'space_members',
            filter: `user_id=eq.${user.id}`,
          },
          scheduleInvalidate
        )
        .subscribe()
    );

    // Contribute pulse intentionally has NO realtime channel. The fetch
    // reads offers RECEIVED on this user's needs (contribution_needs.created_by),
    // and realtime `postgres_changes` filters can't traverse an FK. Rather
    // than subscribe to every offer platform-wide (the original bug), we
    // let the 5-minute stale window + on-mount refetch cover it.

    // Convey engagement (post_likes / post_comments) intentionally has NO
    // realtime channel here. Realtime `postgres_changes` filters can't be
    // scoped by "posts authored by this user" without an IN-clause on a
    // dynamic list, and unfiltered subscriptions on these two tables were
    // the primary source of the Pulse Bar thrash. The Convey hub still
    // shows live engagement via its own scoped subscriptions; the Pulse
    // Bar's "Trending!" micro-text refreshes on the 5-min stale boundary.

    return () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user?.id, queryClient]);

  return {
    pulseData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

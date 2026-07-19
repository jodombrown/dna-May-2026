// src/pages/dna/convey/ConveyDiscovery.tsx
// Discovery mode for Convey hub - full stories experience with PRD hub pattern

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Plus, BookOpen, PenLine, BarChart3, Users } from 'lucide-react';
import { Mpatapo } from '@/components/icons/adinkra';
// MobileBottomNav removed - PulseDock handles mobile nav globally

// New Hub Components
import {
  HubHero,
  HubStatsBar,
  HubQuickActions,
  HubDIAPanel,
  HubActivityFeed,
  HubSubNav,
  type HubStat,
  type QuickAction,
  type DIARecommendation,
  type ActivityItem,
  type SubNavTab,
} from '@/components/hubs/shared';

// Existing feed components
import { ConveyFeedCard } from '@/components/convey/ConveyFeedCard';
import { useConveyFeed } from '@/hooks/useConveyFeed';
import { Loader2 } from 'lucide-react';

// DIA Card System (Sprint 4A)
import { DIAHubSection } from '@/components/dia/DIAHubSection';
import { ConveyDIADiscoveryCard } from '@/components/convey/ConveyDIADiscoveryCard';

export function ConveyDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['convey-hub-stats', user?.id],
    queryFn: async (): Promise<{
      published: number;
      myStories: number;
      totalReach: number;
      followers: number;
    }> => {
      // Published stories count - only real stories (post_type='story' AND non-null story_type)
      const { count: publishedCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('is_deleted', false)
        .eq('post_type', 'story')
        .not('story_type', 'is', null);

      let myStoriesCount = 0;

      if (user?.id) {
        // My stories - only this user's actual stories
        const { count: myCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('author_id', user.id)
          .eq('is_deleted', false)
          .eq('post_type', 'story')
          .not('story_type', 'is', null);
        myStoriesCount = myCount || 0;
      }

      return {
        published: publishedCount || 0,
        myStories: myStoriesCount,
        totalReach: 0,
        followers: 0,
      };
    },
    staleTime: 60000,
  });

  // Fetch recent stories for activity feed
  const { data: recentStories, isLoading: activityLoading } = useQuery({
    queryKey: ['convey-recent-stories'],
    queryFn: async () => {
      // Activity feed shows real stories only - excludes plain posts
      const { data } = await supabase
        .from('posts')
        .select('id, content, post_type, created_at, story_type')
        .eq('is_deleted', false)
        .eq('post_type', 'story')
        .not('story_type', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    },
    staleTime: 60000,
  });

  // Feed for main content
  const { data: feedItems, isLoading: feedLoading } = useConveyFeed({});

  // Hub Stats
  const hubStats: HubStat[] = [
    {
      label: 'Published Stories',
      value: stats?.published || 0,
      icon: BookOpen,
      onClick: () => navigate('/dna/feed'),
    },
    {
      label: 'My Stories',
      value: stats?.myStories || 0,
      icon: PenLine,
      // BD139: this card displays a live count of the member's stories and used
      // to navigate to /dna/me, which redirects to the feed. A displayed count
      // is a promise of reachability.
      onClick: () => navigate('/dna/convey/my-stories'),
    },
    {
      label: 'Total Reach',
      value: stats?.totalReach || 0,
      icon: BarChart3,
    },
    {
      label: 'Followers',
      value: stats?.followers || 0,
      icon: Users,
    },
  ];

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      label: 'Write a Story',
      description: 'Share your experiences',
      icon: Plus,
      onClick: () => navigate('/dna/feed?compose=story'),
      variant: 'primary',
    },
    {
      label: 'Browse Stories',
      description: 'Read from the community',
      icon: BookOpen,
      onClick: () => navigate('/dna/feed'),
    },
    /*
      BD139: 'My Drafts' also pointed at /dna/me (-> feed). It is REMOVED rather
      than repointed at /dna/convey/my-stories, which shows published stories.
      Sending a member looking for drafts to a list of published work would be a
      new false promise, not a fix.

      Drafts exist as a type (ConveyItemStatus) but useConveyFeed hardcodes every
      item to 'published' and the posts query never selects a status, so whether
      draft stories exist in the data is unverified. That is a DR2 question:
      build the drafts destination, or drop the concept.
    */
    {
      label: 'View Analytics',
      description: 'Track engagement',
      icon: BarChart3,
      onClick: () => navigate('/dna/analytics'),
    },
  ];

  // DIA Recommendations
  const diaRecommendations: DIARecommendation[] = [
    {
      id: 'trending-topics',
      title: 'Trending topics to write about',
      description: 'What the community is discussing right now',
      reason: 'Based on current engagement patterns',
      icon: Mpatapo,
      onClick: () => navigate('/dna/feed'),
    },
    {
      id: 'following-stories',
      title: 'Stories from people you follow',
      description: 'Latest content from your network',
      reason: 'Based on who you follow',
      icon: Users,
      onClick: () => navigate('/dna/feed?filter=following'),
    },
    {
      id: 'performing-well',
      title: 'Content performing well this week',
      description: 'High-engagement stories and updates',
      reason: 'Based on likes, comments, and shares',
      icon: BarChart3,
      onClick: () => navigate('/dna/feed?sort=trending'),
    },
  ];

  // Activity Feed items
  const activityItems: ActivityItem[] = (recentStories || []).map(story => ({
    id: story.id,
    type: 'story',
    title: story.content?.slice(0, 60) + (story.content?.length > 60 ? '...' : '') || 'Story',
    description: story.post_type || 'Story',
    timestamp: story.created_at,
    icon: BookOpen,
    onClick: () => navigate(`/dna/feed/${story.id}`),
  }));

  // Sub Navigation Tabs
  const subNavTabs: SubNavTab[] = [
    { label: 'All Stories', path: '/dna/feed' },
    { label: 'Following', path: '/dna/feed?filter=following' },
    { label: 'My Stories', path: '/dna/convey/my-stories' },
  ];

  return (
    <div className="w-full min-h-dvh bg-background pb-36 md:pb-0">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-6">
        {/* Hero Section */}
        <HubHero
          hub="convey"
          icon={Megaphone}
          title="CONVEY"
          tagline="Amplify the Diaspora Voice"
          primaryAction={{
            label: 'Write a Story',
            icon: Plus,
            onClick: () => navigate('/dna/feed?compose=story'),
          }}
          secondaryAction={{
            label: 'Browse Stories',
            icon: BookOpen,
            onClick: () => navigate('/dna/feed'),
          }}
        />

        {/* Stats Bar */}
        <HubStatsBar stats={hubStats} loading={statsLoading} />

        {/* Sub Navigation */}
        <HubSubNav tabs={subNavTabs} basePath="/dna/convey" />

        {/* DIA Discovery Card — between sub-nav and content */}
        <ConveyDIADiscoveryCard
          publishedCount={stats?.published || 0}
          myStoriesCount={stats?.myStories || 0}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <HubQuickActions actions={quickActions} />

            {/* Stories Feed */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Latest Stories</h2>
              {feedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : feedItems && feedItems.data.length > 0 ? (
                <div className="space-y-4">
                  {feedItems.data.slice(0, 5).map((item) => (
                    <ConveyFeedCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground">No stories yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* DIA Intelligence Cards */}
            <DIAHubSection surface="convey_hub" limit={2} />

            {/* DIA Panel */}
            <HubDIAPanel
              hub="convey"
              recommendations={diaRecommendations}
              onAskDIA={() => navigate('/dna/dia?context=convey')}
            />

            {/* Recent Activity */}
            <HubActivityFeed
              title="Latest Activity"
              items={activityItems}
              loading={activityLoading}
              onViewAll={() => navigate('/dna/feed')}
              emptyMessage="No stories yet"
            />
          </div>
        </div>
      </div>
      {/* PulseDock handles mobile nav globally */}
    </div>
  );
}

export default ConveyDiscovery;

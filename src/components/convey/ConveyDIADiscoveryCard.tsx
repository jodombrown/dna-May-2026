/**
 * DNA | DIA Discovery Card for CONVEY
 *
 * Inline discovery card shown between sub-nav and the main content area.
 * Priority-ordered: first matching condition wins. One card at a time.
 * Uses existing DIA dismiss system (7-day cooldown via localStorage).
 *
 * Priority order:
 * 1. no-stories      — user hasn't published any stories yet
 * 2. story-engagement — user's recent story got views/reactions
 * 3. trending         — trending topics in the network
 * 4. network-active   — connections recently published stories
 * 5. welcome          — account created < 7 days ago
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isDismissed, dismissDIACard } from '@/services/diaCardService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, PenLine, TrendingUp, BookOpen, Users, Heart } from 'lucide-react';
import { Mpatapo } from '@/components/icons/adinkra';

// ── Types ──────────────────────────────────────────

interface ConveyDIADiscoveryCardProps {
  publishedCount: number;
  myStoriesCount: number;
  className?: string;
}

type DiscoveryCardType =
  | 'no-stories'
  | 'story-engagement'
  | 'trending'
  | 'network-active'
  | 'welcome';

interface DiscoveryCardContent {
  cardTypeId: DiscoveryCardType;
  headline: string;
  body: string;
  ctaLabel: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  action: () => void;
}

const ACCENT = '#2A7A8C';

interface ConveyProfile {
  sectors: string[] | null;
  created_at: string;
}

// ── Component ──────────────────────────────────────

export function ConveyDIADiscoveryCard({
  publishedCount,
  myStoriesCount,
  className,
}: ConveyDIADiscoveryCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissVersion, setDismissVersion] = useState(0);

  // Profile query
  const { data: profile } = useQuery({
    queryKey: ['dia-convey-discovery-profile', user?.id],
    queryFn: async (): Promise<ConveyProfile | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('sectors, created_at')
        .eq('id', user.id)
        .single();
      if (error || !data) return null;
      return {
        sectors: data.sectors as string[] | null,
        created_at: data.created_at as string,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Recent story engagement (reactions on user's latest story)
  const { data: recentEngagement = 0 } = useQuery({
    queryKey: ['dia-convey-engagement', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id || myStoriesCount === 0) return 0;

      // Get user's most recent post
      const { data: latestPost } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestPost) return 0;

      // Count reactions on that post
      const { count } = await supabase
        .from('post_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', latestPost.id);

      return count || 0;
    },
    enabled: !!user?.id && myStoriesCount > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Dismiss handler
  const getDismissKey = useCallback(
    (cardTypeId: DiscoveryCardType): string =>
      `convey-discovery-${cardTypeId}-${user?.id || ''}`,
    [user?.id]
  );

  const handleDismiss = useCallback(
    (cardTypeId: DiscoveryCardType) => {
      dismissDIACard(getDismissKey(cardTypeId));
      setDismissVersion((v) => v + 1);
    },
    [getDismissKey]
  );

  // Card selection (priority order)
  const cardContent = useMemo((): DiscoveryCardContent | null => {
    if (!profile || !user?.id) return null;
    void dismissVersion;

    // 1. No stories published
    const noStoriesId: DiscoveryCardType = 'no-stories';
    if (myStoriesCount === 0 && !isDismissed(getDismissKey(noStoriesId))) {
      return {
        cardTypeId: noStoriesId,
        headline: 'Share your first story',
        body: 'Your voice matters — tell your diaspora story, share insights, or amplify what matters to you.',
        ctaLabel: 'Write a Story',
        icon: PenLine,
        action: () => navigate('/dna/feed?compose=story'),
      };
    }

    // 2. Story engagement
    const engagementId: DiscoveryCardType = 'story-engagement';
    if (recentEngagement > 0 && !isDismissed(getDismissKey(engagementId))) {
      return {
        cardTypeId: engagementId,
        headline: `Your latest story got ${recentEngagement} ${recentEngagement === 1 ? 'reaction' : 'reactions'}`,
        body: 'Keep the momentum going — your audience is listening.',
        ctaLabel: 'Write Another',
        icon: TrendingUp,
        action: () => navigate('/dna/feed?compose=story'),
      };
    }

    // 3. Trending — lots of published content
    const trendingId: DiscoveryCardType = 'trending';
    const userSectors = profile.sectors || [];
    if (userSectors.length > 0 && publishedCount > 5 && !isDismissed(getDismissKey(trendingId))) {
      return {
        cardTypeId: trendingId,
        headline: `Stories about ${userSectors[0]} trending in your network`,
        body: 'See what the community is saying about topics you care about.',
        ctaLabel: 'Read Stories',
        icon: BookOpen,
        action: () => navigate('/dna/feed'),
      };
    }

    // 4. Network active
    const networkId: DiscoveryCardType = 'network-active';
    if (publishedCount >= 3 && !isDismissed(getDismissKey(networkId))) {
      return {
        cardTypeId: networkId,
        headline: `${publishedCount} stories published across the network`,
        body: 'The diaspora voice is growing — read, react, and contribute.',
        ctaLabel: 'Browse Stories',
        icon: Users,
        action: () => navigate('/dna/feed'),
      };
    }

    // 5. Welcome
    const welcomeId: DiscoveryCardType = 'welcome';
    const createdAt = new Date(profile.created_at);
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7 && !isDismissed(getDismissKey(welcomeId))) {
      return {
        cardTypeId: welcomeId,
        headline: 'Welcome to CONVEY',
        body: 'Amplify the diaspora voice — share stories, insights, and updates with your community.',
        ctaLabel: 'Get Started',
        icon: Heart,
        action: () => navigate('/dna/feed?compose=story'),
      };
    }

    return null;
  }, [
    profile, user?.id, myStoriesCount, recentEngagement, publishedCount,
    getDismissKey, dismissVersion, navigate,
  ]);

  if (!cardContent) return null;

  const CardIcon = cardContent.icon;

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-4"
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: ACCENT,
          backgroundColor: `${ACCENT}08`,
        }}
      >
        <button
          onClick={() => handleDismiss(cardContent.cardTypeId)}
          className="absolute top-1 right-1 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          aria-label="Dismiss"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 pr-12">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{ backgroundColor: `${ACCENT}20` }}
          >
            <Mpatapo className="w-3 h-3" style={{ color: ACCENT }} />
          </div>
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: ACCENT }}
          >
            DIA &bull; CONVEY
          </span>
        </div>

        <div className="flex items-start gap-2 mb-1.5">
          <CardIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
          <h4 className="font-semibold text-sm text-foreground leading-tight">
            {cardContent.headline}
          </h4>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed ml-6">
          {cardContent.body}
        </p>

        <div className="flex items-center mt-3 ml-6">
          <Button
            size="sm"
            className="text-xs rounded-full px-4 text-white"
            style={{ backgroundColor: ACCENT, minHeight: 44 }}
            onClick={cardContent.action}
          >
            {cardContent.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConveyDIADiscoveryCard;

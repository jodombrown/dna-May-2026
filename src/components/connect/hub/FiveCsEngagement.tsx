import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FiveCsEngagementProps {
  userId: string;
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
}

interface CEngagement {
  convene: {
    active: boolean;
    count: number;
    items: { id: string; title: string; date?: string }[];
  };
  collaborate: {
    active: boolean;
    count: number;
    items: { id: string; name: string }[];
  };
  contribute: {
    active: boolean;
    count: number;
    items: { id: string; title: string; type: 'need' | 'offer' }[];
  };
  convey: {
    active: boolean;
    count: number;
    recentStoryId?: string;
  };
}

/**
 * FiveCsEngagement - Badge display showing user's activity across Five C's
 */
export function FiveCsEngagement({
  userId,
  compact = false,
  showLabels = false,
  className,
}: FiveCsEngagementProps) {
  const navigate = useNavigate();

  const { data: engagement, isLoading } = useQuery({
    queryKey: ['five-cs-engagement', userId],
    queryFn: async (): Promise<CEngagement> => {
      // Fetch CONVENE (event registrations)
      const { data: eventRegs } = await supabase
        .from('event_attendees')
        .select('event_id, events(id, title, start_time, date_confirmed)')
        .eq('user_id', userId)
        .eq('status', 'going')
        .limit(5);

      // Fetch COLLABORATE (space memberships)
      const { data: spaceMemberships } = await supabase
        .from('space_members')
        .select('space_id, spaces(id, name)')
        .eq('user_id', userId)
        .limit(5);

      // Fetch CONTRIBUTE (contribution needs created by user)
      const { data: contributions } = await supabase
        .from('contribution_needs')
        .select('id, title, type')
        .eq('created_by', userId)
        .eq('status', 'open')
        .limit(5);

      // Fetch CONVEY (posts with post_type = 'story' in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: stories, count: storyCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('author_id', userId)
        .eq('post_type', 'story')
        .eq('is_deleted', false)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1);

      return {
        convene: {
          active: (eventRegs?.length ?? 0) > 0,
          count: eventRegs?.length ?? 0,
          items:
            eventRegs?.map((r: { event_id: string; events: { id: string; title: string; start_time: string | null; date_confirmed: boolean | null } | null }) => ({
              id: r.events?.id || r.event_id,
              title: r.events?.title || 'Event',
              // An unannounced placeholder date must never print.
              date: r.events?.date_confirmed === false ? null : r.events?.start_time,
            })) ?? [],
        },
        collaborate: {
          active: (spaceMemberships?.length ?? 0) > 0,
          count: spaceMemberships?.length ?? 0,
          items:
            spaceMemberships?.map((s: { space_id: string; spaces: { id: string; name: string } | null }) => ({
              id: s.spaces?.id || s.space_id,
              name: s.spaces?.name || 'Space',
            })) ?? [],
        },
        contribute: {
          active: (contributions?.length ?? 0) > 0,
          count: contributions?.length ?? 0,
          items:
            contributions?.map((i: { id: string; title: string; type: string }) => ({
              id: i.id,
              title: i.title,
              type: i.type === 'funding' ? 'need' : 'offer',
            })) ?? [],
        },
        convey: {
          active: (storyCount ?? 0) > 0,
          count: storyCount ?? 0,
          recentStoryId: stories?.[0]?.id,
        },
      };
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  if (isLoading || !engagement) {
    return null;
  }

  const badges = [
    {
      id: 'convene',
      icon: '🎫',
      label: 'CONVENE',
      active: engagement.convene.active,
      count: engagement.convene.count,
      color: 'bg-dna-sunset/10 text-dna-sunset border-dna-sunset/30',
      tooltip: engagement.convene.active
        ? `${engagement.convene.count} upcoming event${engagement.convene.count !== 1 ? 's' : ''}`
        : 'No upcoming events',
    },
    {
      id: 'collaborate',
      icon: '🤝',
      label: 'COLLABORATE',
      active: engagement.collaborate.active,
      count: engagement.collaborate.count,
      color: 'bg-dna-mint/10 text-dna-forest border-dna-mint/30',
      tooltip: engagement.collaborate.active
        ? `Active in ${engagement.collaborate.count} space${engagement.collaborate.count !== 1 ? 's' : ''}`
        : 'Not in any spaces',
    },
    {
      id: 'contribute',
      icon: '💡',
      label: 'CONTRIBUTE',
      active: engagement.contribute.active,
      count: engagement.contribute.count,
      color: 'bg-dna-ochre/10 text-dna-ochre border-dna-ochre/30',
      tooltip: engagement.contribute.active
        ? `${engagement.contribute.count} active opportunit${engagement.contribute.count !== 1 ? 'ies' : 'y'}`
        : 'No active opportunities',
    },
    {
      id: 'convey',
      icon: '📝',
      label: 'CONVEY',
      active: engagement.convey.active,
      count: engagement.convey.count,
      color: 'bg-dna-purple/10 text-dna-purple border-dna-purple/30',
      tooltip: engagement.convey.active
        ? `${engagement.convey.count} stor${engagement.convey.count !== 1 ? 'ies' : 'y'} this month`
        : 'No recent stories',
    },
  ];

  // Only show active badges
  const activeBadges = badges.filter((b) => b.active);

  if (activeBadges.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap gap-1', className)}>
        {activeBadges.map((badge) => (
          <Popover key={badge.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium border transition-colors hover:opacity-80',
                      badge.color,
                      compact && 'px-1 py-0'
                    )}
                  >
                    <span>{badge.icon}</span>
                    {showLabels && <span>{badge.label}</span>}
                    {!compact && badge.count > 1 && (
                      <span className="text-[10px] opacity-70">{badge.count}</span>
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {badge.tooltip}
              </TooltipContent>
            </Tooltip>

            <PopoverContent className="w-64 p-2" align="start">
              <BadgePopoverContent
                badge={badge}
                engagement={engagement}
                navigate={navigate}
                userId={userId}
              />
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </TooltipProvider>
  );
}

interface BadgePopoverContentProps {
  badge: { id: string; icon: string; label: string };
  engagement: CEngagement;
  navigate: (path: string) => void;
  userId: string;
}

function BadgePopoverContent({
  badge,
  engagement,
  navigate,
  userId,
}: BadgePopoverContentProps) {
  if (badge.id === 'convene') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Upcoming Events</p>
        {engagement.convene.items.slice(0, 3).map((event) => (
          <button
            key={event.id}
            onClick={() => navigate(`/dna/convene/events/${event.id}`)}
            className="w-full text-left p-2 rounded-md hover:bg-muted text-sm"
          >
            {event.title}
            {event.date && (
              <span className="block text-xs text-muted-foreground mt-0.5">
                {new Date(event.date).toLocaleDateString()}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (badge.id === 'collaborate') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Active Spaces</p>
        {engagement.collaborate.items.slice(0, 3).map((space) => (
          <button
            key={space.id}
            onClick={() => navigate(`/dna/collaborate/spaces/${space.id}`)}
            className="w-full text-left p-2 rounded-md hover:bg-muted text-sm"
          >
            {space.name}
          </button>
        ))}
      </div>
    );
  }

  if (badge.id === 'contribute') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Active Opportunities</p>
        {engagement.contribute.items.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/dna/contribute/${item.type}s/${item.id}`)}
            className="w-full text-left p-2 rounded-md hover:bg-muted text-sm"
          >
            <Badge
              variant="outline"
              className={cn(
                'mr-2 text-[10px]',
                item.type === 'need' ? 'border-rose-200 text-rose-600' : 'border-emerald-200 text-emerald-600'
              )}
            >
              {item.type}
            </Badge>
            {item.title}
          </button>
        ))}
      </div>
    );
  }

  if (badge.id === 'convey') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Recent Stories</p>
        <button
          onClick={() => navigate(`/dna/${userId}?tab=stories`)}
          className="w-full text-left p-2 rounded-md hover:bg-muted text-sm"
        >
          View {engagement.convey.count} stor{engagement.convey.count !== 1 ? 'ies' : 'y'}
        </button>
      </div>
    );
  }

  return null;
}

export default FiveCsEngagement;
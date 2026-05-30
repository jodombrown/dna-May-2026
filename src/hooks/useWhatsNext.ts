import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLastViewState } from './useLastViewState';

export interface NextActionCard {
  id: string;
  title: string;
  description: string;
  pillar: 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';
  route: string;
  priority: number;
  icon: string;
}

export function useWhatsNext() {
  const { user } = useAuth();
  const { lastState } = useLastViewState();

  return useQuery({
    queryKey: ['whats-next', user?.id, lastState?.last_view_state],
    queryFn: async () => {
      if (!user) return [];

      const recommendations: NextActionCard[] = [];

      // 1. Check for event attendees not yet connected
      const { data: recentEvents } = await supabase
        .from('event_attendees')
        .select('event_id, events(title, id)')
        .eq('user_id', user.id)
        .eq('status', 'going')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentEvents && recentEvents.length > 0) {
        recommendations.push({
          id: 'connect_event_attendees',
          title: 'Connect with Event Attendees',
          description: `Meet people from ${(recentEvents[0] as any).events?.title || 'recent events'}`,
          pillar: 'connect',
          route: '/dna/connect/discover',
          priority: 8,
          icon: 'users',
        });
      }

      // 2. Check for upcoming events matching interests
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('id, title')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1);

      if (upcomingEvents && upcomingEvents.length > 0) {
        recommendations.push({
          id: 'attend_event',
          title: 'Upcoming Event This Week',
          description: upcomingEvents[0].title,
          pillar: 'convene',
          route: `/dna/convene/events/${upcomingEvents[0].id}`,
          priority: 7,
          icon: 'calendar',
        });
      }

      // 3. Check for spaces user can join based on their role/interests
      const { data: profile } = await supabase
        .from('profiles')
        .select('intents')
        .eq('id', user.id)
        .single();

      if (profile?.intents && profile.intents.length > 0) {
        const { data: relevantSpaces } = await supabase
          .from('spaces')
          .select('id, name')
          .eq('visibility', 'public')
          .eq('status', 'active')
          .limit(1);

        if (relevantSpaces && relevantSpaces.length > 0) {
          recommendations.push({
            id: 'join_space',
            title: 'Spaces Matching Your Interests',
            description: `Explore ${relevantSpaces[0].name} and similar projects`,
            pillar: 'collaborate',
            route: '/dna/collaborate',
            priority: 6,
            icon: 'folder-kanban',
          });
        }
      }

      // 4. Check for spaces user is member of with open needs
      // Two-step fetch pattern to avoid PostgREST FK resolution issues
      const { data: memberSpaces } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberSpaces && memberSpaces.length > 0) {
        const spaceIds = memberSpaces.map((m: { space_id: string }) => m.space_id).filter(Boolean);
        
        const { data: openNeeds } = await supabase
          .from('contribution_needs')
          .select('id, title, space_id')
          .in('space_id', spaceIds)
          .eq('status', 'open')
          .limit(1);

        if (openNeeds && openNeeds.length > 0) {
          recommendations.push({
            id: 'contribute_to_need',
            title: 'Open Needs in Your Spaces',
            description: openNeeds[0].title,
            pillar: 'contribute',
            route: `/dna/contribute/needs/${openNeeds[0].id}`,
            priority: 9,
            icon: 'hand-heart',
          });
        }
      }

      // 5. Encourage sharing a story if user has been active
      const { data: recentActivity } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // If no recent posts, suggest sharing
      if (!recentActivity || recentActivity.length === 0) {
        recommendations.push({
          id: 'share_story',
          title: 'Share Your Journey',
          description: 'Tell your story to inspire the network',
          pillar: 'convey',
          route: '/dna/feed',
          priority: 5,
          icon: 'file-text',
        });
      }

      // 6. Based on last view state, suggest returning
      if (lastState && lastState.last_view_state !== 'DASHBOARD_HOME') {
        const viewStateMap: Record<string, { pillar: NextActionCard['pillar']; route: string; title: string }> = {
          CONNECT_MODE: { pillar: 'connect', route: '/dna/connect', title: 'Continue Building Your Network' },
          CONVENE_MODE: { pillar: 'convene', route: '/dna/convene', title: 'Explore More Events' },
          COLLABORATE_MODE: { pillar: 'collaborate', route: '/dna/collaborate', title: 'Work on Your Projects' },
          CONTRIBUTE_MODE: { pillar: 'contribute', route: '/dna/contribute', title: 'Find Ways to Help' },
          CONVEY_MODE: { pillar: 'convey', route: '/dna/convey', title: 'Share More Stories' },
        };

        const lastView = viewStateMap[lastState.last_view_state];
        if (lastView) {
          recommendations.push({
            id: 'resume_last_view',
            title: lastView.title,
            description: 'Pick up where you left off',
            pillar: lastView.pillar,
            route: lastView.route,
            priority: 10,
            icon: 'arrow-right',
          });
        }
      }

      // Sort by priority (highest first) and return top 5
      return recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * FeedLeftPanel — "My DNA" unified left sidebar
 * Compact profile strip + Five C's stats + collapsible widget sections
 * Replaces the LinkedIn-style stacked card layout
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bookmark, ChevronRight, Users, Calendar, Layers, HandHeart, BookOpen, MapPin } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FeedUpcomingEvents } from '@/components/feed/FeedUpcomingEvents';
import { FeedActiveSpaces } from '@/components/feed/FeedActiveSpaces';
import { FeedSponsorCard } from '@/components/feed/FeedSponsorCard';

export const FeedLeftPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  // Five C's stats
  const { data: stats } = useQuery({
    queryKey: ['feed-five-c-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [connections, events, spaces, posts] = await Promise.all([
        supabase.from('connections').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq('status', 'accepted'),
        supabase.from('event_attendees').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('space_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);

      return {
        connections: connections.count || 0,
        events: events.count || 0,
        spaces: spaces.count || 0,
        stories: posts.count || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!profile) return null;

  const displayName = profile.display_name || profile.username || 'Member';
  const initials = displayName.charAt(0).toUpperCase();
  const username = profile.username || '';
  const currentCity = (profile as Record<string, unknown>).current_city as string | undefined;

  const fiveCStats = [
    { icon: Users, count: stats?.connections || 0, label: 'Connections', color: 'text-dna-emerald' },
    { icon: Calendar, count: stats?.events || 0, label: 'Events', color: 'text-dna-gold' },
    { icon: Layers, count: stats?.spaces || 0, label: 'Spaces', color: 'text-dna-forest' },
    { icon: BookOpen, count: stats?.stories || 0, label: 'Posts', color: 'text-dna-convey' },
  ];

  return (
    <div className="space-y-1">
      {/* Compact Profile Strip */}
      <div className="bg-card rounded-dna-xl p-3.5 shadow-dna-1">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/dna/${username}`)}
        >
          <Avatar className="h-11 w-11 ring-2 ring-[hsl(var(--dna-emerald)/0.2)] group-hover:ring-[hsl(var(--dna-emerald)/0.4)] transition-all">
            <AvatarImage src={profile.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {displayName}
            </p>
            {profile.headline ? (
              <p className="text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>
            ) : currentCity ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {currentCity}
              </p>
            ) : null}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {/* Five C's Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-border/50">
            {fiveCStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-sm font-semibold text-foreground">{stat.count}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Saved Items */}
        <button
          className="w-full flex items-center gap-2 mt-3 pt-2.5 border-t border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors group/saved"
          onClick={() => navigate('/dna/feed?tab=bookmarks')}
        >
          <Bookmark className="h-3.5 w-3.5 text-dna-gold" />
          <span>Saved Items</span>
          <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover/saved:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Collapsible Widget Sections */}
      <CollapsibleSection title="Upcoming For You" defaultOpen>
        <FeedUpcomingEvents />
      </CollapsibleSection>

      <CollapsibleSection title="Sponsored" defaultOpen>
        <FeedSponsorCard />
      </CollapsibleSection>

      <CollapsibleSection title="Active Spaces" defaultOpen>
        <FeedActiveSpaces />
      </CollapsibleSection>
    </div>
  );
};

/** Collapsible wrapper for sidebar sections */
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <span>{title}</span>
        <ChevronRight className="h-3 w-3 transition-transform duration-200 [[data-state=open]_&]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

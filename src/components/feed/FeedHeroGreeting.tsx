/**
 * FeedHeroGreeting — Warm, heritage-infused greeting banner
 * Replaces the plain "Good morning" text with an editorial hero zone
 * Features: Lora typography, Kente pattern, quick-action chips, platform pulse
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { PenSquare, Calendar, BookOpen, Activity } from 'lucide-react';
import { CulturalPattern } from '@/components/shared/CulturalPattern';

interface FeedHeroGreetingProps {
  onComposerOpen: (mode: string) => void;
}

export const FeedHeroGreeting: React.FC<FeedHeroGreetingProps> = ({ onComposerOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const { data: pulse } = useQuery({
    queryKey: ['feed-platform-pulse'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [eventsRes, connectionsRes, postsRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()).eq('is_published', true),
        supabase.from('connections').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).eq('status', 'accepted'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo),
      ]);

      return {
        upcomingEvents: eventsRes.count || 0,
        newConnections: connectionsRes.count || 0,
        newPosts: postsRes.count || 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.display_name?.split(' ')[0] || profile?.username || '';

  const quickActions = [
    { label: 'Start a Post', icon: PenSquare, mode: 'post' },
    { label: 'Create Event', icon: Calendar, mode: 'event' },
    { label: 'Share a Story', icon: BookOpen, mode: 'story' },
  ];

  const pulseItems: { label: string; to: string }[] = [];
  if (pulse?.upcomingEvents) pulseItems.push({ label: `${pulse.upcomingEvents} upcoming events`, to: '/dna/convene' });
  if (pulse?.newConnections) pulseItems.push({ label: `${pulse.newConnections} new connections this week`, to: '/dna/connect/network' });
  if (pulse?.newPosts) pulseItems.push({ label: `${pulse.newPosts} posts today`, to: '/dna/feed' });

  return (
    <div className="relative overflow-hidden rounded-dna-xl bg-gradient-to-br from-[hsl(var(--dna-emerald)/0.08)] via-[hsl(var(--dna-cream))] to-[hsl(var(--dna-gold)/0.06)] px-6 py-5">
      {/* Heritage pattern overlay */}
      <CulturalPattern pattern="kente" opacity={0.04} />

      <div className="relative z-10">
        {/* Greeting */}
        <h2 className="font-heritage text-2xl font-semibold text-foreground tracking-tight">
          {getGreeting()}, {firstName} 👋
        </h2>

        {/* Platform pulse */}
        {pulseItems.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <Activity className="h-3.5 w-3.5 text-dna-gold" />
            {pulseItems.map((item, i) => (
              <React.Fragment key={item.to}>
                {i > 0 && <span className="text-muted-foreground/60">·</span>}
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  aria-label={`Open ${item.label}`}
                  className="hover:text-foreground hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </p>
        )}

        {/* Quick action chips */}
        <div className="flex items-center gap-2 mt-4">
          {quickActions.map((action) => (
            <button
              key={action.mode}
              onClick={() => onComposerOpen(action.mode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border/60 text-foreground hover:border-primary/40 hover:shadow-dna-1 transition-all duration-200"
            >
              <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

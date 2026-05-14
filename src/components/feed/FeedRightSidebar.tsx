/**
 * FeedRightSidebar - Right column for feed page
 * Contains real trending hashtags, suggested connections, happening now, and DIA promo
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, ExternalLink, TrendingUp, Hash } from 'lucide-react';
import { FeedHappeningNow } from '@/components/feed/FeedHappeningNow';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { Skeleton } from '@/components/ui/skeleton';
import { Mpatapo } from '@/components/icons/adinkra';

export const FeedRightSidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch suggested people, excluding existing connections
  const { data: suggestedPeople } = useQuery({
    queryKey: ['feed-suggested-people', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .in('status', ['accepted', 'pending']);

      const connectedIds = new Set<string>();
      connectedIds.add(user.id);
      if (connections) {
        for (const c of connections) {
          connectedIds.add(c.requester_id);
          connectedIds.add(c.recipient_id);
        }
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, headline')
        .not('id', 'in', `(${[...connectedIds].join(',')})`)
        .limit(4);

      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-4">
      {/* Happening Now - live/imminent events */}
      <FeedHappeningNow />

      {/* Suggested People */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            People to Connect
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {suggestedPeople && suggestedPeople.length > 0 ? (
            <div className="space-y-3">
              {suggestedPeople.map((person) => (
                <div key={person.id} className="flex items-start gap-2.5">
                  <Avatar
                    className="h-9 w-9 cursor-pointer shrink-0"
                    onClick={() => navigate(`/dna/${person.username || person.id}`)}
                  >
                    <AvatarImage src={person.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {(person.display_name || person.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate cursor-pointer hover:text-primary hover:underline"
                      onClick={() => navigate(`/dna/${person.username || person.id}`)}
                    >
                      {person.display_name || person.username}
                    </p>
                    {person.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {person.headline}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate('/dna/connect')}
              >
                View More
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No suggestions yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trending in DNA - Real data with proper card title */}
      <TrendingInDNA />

      {/* DIA Promo Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Mpatapo className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Ask DIA</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get AI-powered insights about Africa and the diaspora
              </p>
              <Button
                size="sm"
                variant="link"
                className="h-auto p-0 mt-1.5 text-xs"
                onClick={() => navigate('/dna/dia')}
              >
                Try it now
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground px-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="/about" className="hover:underline">About</a>
          <span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
          <span>·</span>
          <a href="/help" className="hover:underline">Help</a>
        </div>
        <p className="mt-2">DNA © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

/**
 * TrendingInDNA - Combined trending hashtags with proper card title
 * Uses real data from get_trending_hashtags RPC
 */
const TrendingInDNA: React.FC = () => {
  const navigate = useNavigate();
  const { data: trending, isLoading } = useTrendingHashtags(5);

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[hsl(var(--dna-copper,25,70%,45%))]" />
          Trending in DNA
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {isLoading ? (
          <div className="space-y-3 px-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : trending && trending.length > 0 ? (
          <div className="space-y-0.5">
            {trending.map((item, index) => {
              const tagName = item.tag || '';
              const recentCount = item.recent_usage_count || 0;
              const followerCount = item.follower_count || 0;

              return (
                <button
                  key={tagName}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors group text-left"
                  onClick={() => navigate(`/dna/hashtag/${tagName}`)}
                >
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[hsl(var(--dna-copper,25,70%,45%)/0.1)] text-[hsl(var(--dna-copper,25,70%,45%))] font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {tagName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recentCount} posts today{followerCount > 0 ? ` · ${followerCount} followers` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Trending topics coming soon — start posting to kick things off! 🚀
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * FeedActiveSpaces - Left sidebar widget showing user's active collaboration spaces
 * Cross-C moment: COLLABORATE surfaces on every feed visit
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, ChevronRight, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveSpace {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  member_count: number;
}

export const FeedActiveSpaces: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['feed-active-spaces', user?.id],
    queryFn: async (): Promise<ActiveSpace[]> => {
      if (!user?.id) return [];

      // Get spaces the user is a member of
      const { data: memberships } = await supabase
        .from('collaboration_memberships')
        .select('space_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3);

      if (!memberships || memberships.length === 0) return [];

      const spaceIds = memberships.map((m) => m.space_id);

      const { data: spaceData } = await supabase
        .from('spaces')
        .select('id, name, status, updated_at')
        .in('id', spaceIds)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (!spaceData) return [];

      return spaceData.map((s) => ({
        id: s.id,
        title: s.name,
        status: s.status,
        updated_at: s.updated_at,
        member_count: 0,
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !spaces || spaces.length === 0) return null;

  const getRecencyLabel = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return 'Active today';
    if (diffHours < 48) return 'Active yesterday';
    return 'Recently active';
  };

  return (
    <Card className="overflow-hidden">
      {/* Forest Green accent stripe — COLLABORATE module */}
      <div className="h-1 bg-[hsl(var(--dna-forest))]" />
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Active Spaces
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-2">
          {spaces.map((space) => (
            <button
              key={space.id}
              className="w-full text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-md p-2 -mx-0.5 transition-colors group"
              onClick={() => navigate(`/dna/collaborate/spaces/${space.id}`)}
            >
              <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {space.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Activity className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  {getRecencyLabel(space.updated_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs h-7"
          onClick={() => navigate('/dna/collaborate')}
        >
          All Spaces
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

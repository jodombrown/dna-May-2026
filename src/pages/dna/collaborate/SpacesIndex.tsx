import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SpacesShell } from '@/components/collaborate/SpacesShell';
import { SpaceListCard, type SpaceListItem } from '@/components/collaborate/SpaceListCard';
import { useJoinSpace } from '@/hooks/collaborate/useJoinSpace';
import type { SpaceVisibility } from '@/types/collaborate';

interface SpaceRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  space_type: string;
  status: string;
  visibility: string;
  space_members: { count: number }[] | null;
}

export default function SpacesIndex() {
  const { user } = useAuth();
  const joinSpace = useJoinSpace();

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces', 'index'],
    queryFn: async (): Promise<SpaceListItem[]> => {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, slug, name, tagline, space_type, status, visibility, space_members(count)')
        .order('last_activity_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as SpaceRow[]).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        tagline: s.tagline,
        space_type: s.space_type,
        status: s.status,
        visibility: s.visibility,
        memberCount: s.space_members?.[0]?.count ?? 0,
      }));
    },
  });

  // Which spaces the current user already belongs to (and whether the
  // membership is still pending approval).
  const { data: memberships } = useQuery({
    queryKey: ['my-spaces', 'membership-map', user?.id],
    queryFn: async () => {
      if (!user) return {} as Record<string, string>;
      const { data, error } = await supabase
        .from('space_members')
        .select('space_id, status')
        .eq('user_id', user.id);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.space_id] = row.status ?? 'active';
      return map;
    },
    enabled: !!user,
  });

  const membershipMap = useMemo(() => memberships ?? {}, [memberships]);

  return (
    <SpacesShell bubblePlaceholder="Search Spaces…">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Spaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a collaboration to join, or start your own.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/dna/collaborate/spaces/new">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create Space
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No spaces yet. Be the first to start one.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dna/collaborate/spaces/new">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Create Space
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {spaces.map((space) => {
            const status = membershipMap[space.id];
            return (
              <SpaceListCard
                key={space.id}
                space={space}
                isMember={!!status}
                isPending={status === 'invited'}
                isJoining={joinSpace.isPending && joinSpace.variables?.spaceId === space.id}
                onJoin={(s) =>
                  joinSpace.mutate({
                    spaceId: s.id,
                    visibility: s.visibility as SpaceVisibility,
                  })
                }
              />
            );
          })}
        </div>
      )}
    </SpacesShell>
  );
}

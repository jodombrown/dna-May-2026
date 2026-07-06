// COLLABORATE hub landing. Composes the existing Spaces surfaces into one
// entry point: the user's active spaces, a discover shelf of community/public
// spaces to join, and a Create Space CTA. Query keys are shared with MySpaces
// and SpacesIndex so the cache is reused rather than duplicated.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Plus } from 'lucide-react';
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

const SPACE_COLUMNS =
  'id, slug, name, tagline, space_type, status, visibility, space_members(count)';

function mapSpace(s: SpaceRow): SpaceListItem {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    space_type: s.space_type,
    status: s.status,
    visibility: s.visibility,
    memberCount: s.space_members?.[0]?.count ?? 0,
  };
}

const PREVIEW_LIMIT = 3;

export default function CollaborateHub() {
  const { user } = useAuth();
  const joinSpace = useJoinSpace();
  const [searchQuery, setSearchQuery] = useState('');

  // Spaces the caller is an active member of (shares MySpaces' cache).
  const { data: mySpaces = [], isLoading: myLoading } = useQuery({
    queryKey: ['my-spaces', 'active', user?.id],
    queryFn: async (): Promise<SpaceListItem[]> => {
      if (!user) return [];
      const { data: memberRows, error: memberErr } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (memberErr) throw memberErr;
      const ids = (memberRows ?? []).map((r) => r.space_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('spaces')
        .select(SPACE_COLUMNS)
        .in('id', ids)
        .order('last_activity_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as SpaceRow[]).map(mapSpace);
    },
    enabled: !!user,
  });

  // All spaces, for the discover shelf (shares SpacesIndex' cache).
  const { data: allSpaces = [], isLoading: discoverLoading } = useQuery({
    queryKey: ['spaces', 'index'],
    queryFn: async (): Promise<SpaceListItem[]> => {
      const { data, error } = await supabase
        .from('spaces')
        .select(SPACE_COLUMNS)
        .order('last_activity_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as SpaceRow[]).map(mapSpace);
    },
  });

  // Which spaces the caller already belongs to (and whether still pending).
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

  // Client-side search filter shared by both My Spaces and Discover shelves.
  const matchesQuery = (s: SpaceListItem) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.tagline?.toLowerCase().includes(q) ?? false)
    );
  };

  const filteredMySpaces = useMemo(
    () => mySpaces.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mySpaces, searchQuery],
  );

  // Community/public spaces the caller hasn't joined yet.
  const discover = useMemo(
    () =>
      allSpaces
        .filter(
          (s) =>
            !membershipMap[s.id] &&
            (s.visibility === 'public' || s.visibility === 'community') &&
            matchesQuery(s),
        )
        .slice(0, PREVIEW_LIMIT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSpaces, membershipMap, searchQuery],
  );

  return (
    <SpacesShell
      bubblePlaceholder="Search Spaces…"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Collaborate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spaces are where the diaspora builds together. Join one, or start your own.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/dna/collaborate/spaces/new">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Create Space
          </Link>
        </Button>
      </div>

      {/* My spaces */}
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">My Spaces</h2>
          <Link
            to="/dna/collaborate/my-spaces"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {myLoading ? (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredMySpaces.length === 0 ? (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mySpaces.length === 0
                ? "You haven't joined any spaces yet. Discover one below, or start your own."
                : 'No spaces match your search.'}
            </p>
          </Card>
        ) : (
          <div className="mt-3 space-y-3">
            {filteredMySpaces.slice(0, PREVIEW_LIMIT).map((space) => (
              <SpaceListCard key={space.id} space={space} isMember />
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Discover Spaces</h2>
          <Link
            to="/dna/collaborate/spaces"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Browse all
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {discoverLoading ? (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : discover.length === 0 ? (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No open spaces to join right now. Be the first to start one.
            </p>
          </Card>
        ) : (
          <div className="mt-3 space-y-3">
            {discover.map((space) => (
              <SpaceListCard
                key={space.id}
                space={space}
                isMember={!!membershipMap[space.id]}
                isPending={membershipMap[space.id] === 'invited'}
                isJoining={joinSpace.isPending && joinSpace.variables?.spaceId === space.id}
                onJoin={(s) =>
                  joinSpace.mutate({
                    spaceId: s.id,
                    visibility: s.visibility as SpaceVisibility,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>
    </SpacesShell>
  );
}

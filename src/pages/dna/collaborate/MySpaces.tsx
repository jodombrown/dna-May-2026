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

export default function MySpaces() {
  const { user } = useAuth();

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['my-spaces', 'active', user?.id],
    queryFn: async (): Promise<SpaceListItem[]> => {
      if (!user) return [];
      // Spaces where the caller is an active member.
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
        .select('id, slug, name, tagline, space_type, status, visibility, space_members(count)')
        .in('id', ids)
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
    enabled: !!user,
  });

  return (
    <SpacesShell bubblePlaceholder="Search your Spaces…">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Spaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The collaborations you're an active part of.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/dna/collaborate/spaces">Browse all</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You haven't joined any spaces yet.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/dna/collaborate/spaces">Browse spaces</Link>
            </Button>
            <Button asChild>
              <Link to="/dna/collaborate/spaces/new">
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Create Space
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {spaces.map((space) => (
            <SpaceListCard key={space.id} space={space} isMember />
          ))}
        </div>
      )}
    </SpacesShell>
  );
}

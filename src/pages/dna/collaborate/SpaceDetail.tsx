import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SpacesShell } from '@/components/collaborate/SpacesShell';
import { useJoinSpace } from '@/hooks/collaborate/useJoinSpace';
import { isUUID } from '@/utils/slugify';
import type { SpaceVisibility } from '@/types/collaborate';

interface SpaceRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status: string;
  visibility: string;
  space_type: string;
  created_by: string;
}

interface RosterMember {
  user_id: string;
  role: string;
  status: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const SPACE_TYPE_LABEL: Record<string, string> = {
  project: 'Project',
  working_group: 'Working group',
  initiative: 'Initiative',
  program: 'Program',
};

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  core_contributor: 'Core contributor',
  contributor: 'Contributor',
};

const ROLE_ORDER: Record<string, number> = { lead: 0, core_contributor: 1, contributor: 2 };

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function memberName(m: RosterMember): string {
  return m.full_name || m.display_name || m.username || 'Member';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export default function SpaceDetail() {
  const { slug: param = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const joinSpace = useJoinSpace();

  // Resolve-both: the :slug param may actually be a UUID (many legacy call
  // sites pass a space id). Look up by whichever it is.
  const paramIsUUID = isUUID(param);

  const { data: space, isLoading, isError } = useQuery({
    queryKey: ['space', param],
    queryFn: async (): Promise<SpaceRecord | null> => {
      const column = paramIsUUID ? 'id' : 'slug';
      const { data, error } = await supabase
        .from('spaces')
        .select('id, slug, name, tagline, description, status, visibility, space_type, created_by')
        .eq(column, param)
        .maybeSingle();
      if (error) throw error;
      return data as SpaceRecord | null;
    },
    enabled: param.length > 0,
  });

  // If we resolved by id, rewrite the URL to the canonical /:slug form.
  useEffect(() => {
    if (space && paramIsUUID && space.slug) {
      navigate(`/dna/collaborate/spaces/${space.slug}`, { replace: true });
    }
  }, [space, paramIsUUID, navigate]);

  const { data: members = [] } = useQuery({
    queryKey: ['space-members', space?.id],
    queryFn: async (): Promise<RosterMember[]> => {
      if (!space) return [];
      const { data: memberRows, error } = await supabase
        .from('space_members')
        .select('user_id, role, status')
        .eq('space_id', space.id);
      if (error) throw error;
      if (!memberRows || memberRows.length === 0) return [];

      const ids = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return memberRows.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          status: r.status ?? 'active',
          full_name: p?.full_name ?? null,
          display_name: p?.display_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });
    },
    enabled: !!space,
  });

  const activeMembers = useMemo(
    () =>
      members
        .filter((m) => m.status === 'active')
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
    [members],
  );

  const myMembership = useMemo(
    () => (user ? members.find((m) => m.user_id === user.id) : undefined),
    [members, user],
  );

  const joinable =
    !!space &&
    !myMembership &&
    (space.visibility === 'public' || space.visibility === 'community');

  if (isLoading) {
    return (
      <SpacesShell maxWidthClassName="max-w-3xl">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <Skeleton className="mt-6 h-40 w-full rounded-lg" />
      </SpacesShell>
    );
  }

  if (isError || !space) {
    return (
      <SpacesShell maxWidthClassName="max-w-3xl">
        <Card className="p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Space not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This space may have been removed, or you may not have access to it.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/dna/collaborate/spaces">Back to Spaces</Link>
          </Button>
        </Card>
      </SpacesShell>
    );
  }

  const isLead = myMembership?.role === 'lead';

  return (
    <SpacesShell maxWidthClassName="max-w-3xl">
      <Link
        to="/dna/collaborate/spaces"
        className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Back to Spaces
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{space.name}</h1>
          {space.tagline && (
            <p className="mt-1 text-sm text-muted-foreground">{space.tagline}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="collaborate">
              {SPACE_TYPE_LABEL[space.space_type] ?? titleCase(space.space_type)}
            </Badge>
            <Badge variant="secondary">{titleCase(space.status)}</Badge>
            <Badge variant="outline">{titleCase(space.visibility)}</Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {joinable && (
            <Button
              type="button"
              variant="outline"
              disabled={joinSpace.isPending}
              onClick={() =>
                joinSpace.mutate({
                  spaceId: space.id,
                  visibility: space.visibility as SpaceVisibility,
                })
              }
            >
              {space.visibility === 'community' ? 'Request to join' : 'Join'}
            </Button>
          )}
          {myMembership?.status === 'invited' && (
            <Badge variant="secondary">Request pending</Badge>
          )}
          {isLead && (
            <Button asChild variant="ghost" size="icon" aria-label="Space settings">
              <Link to={`/dna/collaborate/spaces/${space.slug}/settings`}>
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {space.description && (
        <Card className="mt-6 p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {space.description}
          </p>
        </Card>
      )}

      {/* Members */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">
          Members ({activeMembers.length})
        </h2>
        <Card className="mt-2 divide-y divide-border">
          {activeMembers.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No members to show yet.
            </p>
          ) : (
            activeMembers.map((m) => {
              const name = memberName(m);
              return (
                <div key={m.user_id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={name} />}
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    {m.username && (
                      <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                    )}
                  </div>
                  <Badge variant={m.role === 'lead' ? 'collaborate' : 'outline'}>
                    {ROLE_LABEL[m.role] ?? titleCase(m.role)}
                  </Badge>
                </div>
              );
            })
          )}
        </Card>
      </section>

      {/* Board / tasks placeholder — next cycle. */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Board</h2>
        <Card className="mt-2 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            The task board is coming soon. Check back shortly.
          </p>
        </Card>
      </section>
    </SpacesShell>
  );
}

import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Check, KanbanSquare, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SpacesShell } from '@/components/collaborate/SpacesShell';
import { SpaceFilesSection } from '@/components/collaborate/files/SpaceFilesSection';
import { useJoinSpace } from '@/hooks/collaborate/useJoinSpace';
import { useRosterModeration } from '@/hooks/collaborate/useRosterModeration';
import { useSpace } from '@/hooks/collaborate/useSpace';
import { memberInitials, memberName, useSpaceRoster } from '@/hooks/collaborate/useSpaceRoster';
import type { SpaceVisibility } from '@/types/collaborate';

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

export default function SpaceDetail() {
  const { slug: param = '' } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const joinSpace = useJoinSpace();

  const { space, isLoading, isError } = useSpace(param);
  const { data: members = [] } = useSpaceRoster(space?.id);
  const { approve, decline } = useRosterModeration(space?.id);

  const activeMembers = useMemo(
    () =>
      members
        .filter((m) => m.status === 'active')
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
    [members],
  );

  const pendingMembers = useMemo(
    () =>
      members
        .filter((m) => m.status === 'invited')
        .sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? '')),
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
      <SpacesShell maxWidthClassName="max-w-3xl" tabs={null}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <Skeleton className="mt-6 h-40 w-full rounded-lg" />
      </SpacesShell>
    );
  }

  if (isError || !space) {
    return (
      <SpacesShell maxWidthClassName="max-w-3xl" tabs={null}>
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
    <SpacesShell maxWidthClassName="max-w-3xl" tabs={null}>
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

      {/* Requests — leads only */}
      {isLead && pendingMembers.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            Requests ({pendingMembers.length})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            People asking to join this space. Approve to add them, or decline to dismiss.
          </p>
          <Card className="mt-2 divide-y divide-border">
            {pendingMembers.map((m) => {
              const name = memberName(m);
              const pending = approve.isPending || decline.isPending;
              return (
                <div key={m.user_id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={name} />}
                    <AvatarFallback>{memberInitials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.username ? `@${m.username} · ` : ''}
                      Requested {m.joined_at ? format(new Date(m.joined_at), 'MMM d, yyyy') : 'recently'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => approve.mutate(m.user_id)}
                    >
                      <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={pending}
                      onClick={() => decline.mutate(m.user_id)}
                      aria-label={`Decline ${name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
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
                    <AvatarFallback>{memberInitials(name)}</AvatarFallback>
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

      {/* Board */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Board</h2>
        <Card className="mt-2 flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <KanbanSquare className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Plan and track the space&rsquo;s work on the task board.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to={`/dna/collaborate/spaces/${space.slug}/board`}>Open board</Link>
          </Button>
        </Card>
      </section>

      {/* Files */}
      <SpaceFilesSection
        spaceId={space.id}
        spaceName={space.name}
        isMember={myMembership?.status === 'active'}
        roster={activeMembers}
      />
    </SpacesShell>
  );
}

import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SpaceStatus, SpaceVisibility } from '@/types/collaborate';

export interface SpaceListItem {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  space_type: string;
  status: SpaceStatus | string;
  visibility: SpaceVisibility | string;
  memberCount: number;
}

const SPACE_TYPE_LABEL: Record<string, string> = {
  project: 'Project',
  working_group: 'Working group',
  initiative: 'Initiative',
  program: 'Program',
};

const VISIBILITY_LABEL: Record<string, string> = {
  public: 'Public',
  community: 'Community',
  private: 'Private',
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface SpaceListCardProps {
  space: SpaceListItem;
  /** Whether the current user is already a member (any status). */
  isMember?: boolean;
  /** Whether a join request is pending (invited, awaiting approval). */
  isPending?: boolean;
  onJoin?: (space: SpaceListItem) => void;
  isJoining?: boolean;
}

export function SpaceListCard({
  space,
  isMember,
  isPending,
  onJoin,
  isJoining,
}: SpaceListCardProps) {
  const joinable = !isMember && (space.visibility === 'public' || space.visibility === 'community');

  return (
    <Card className="p-4 sm:p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            to={`/dna/collaborate/spaces/${space.slug}`}
            className="text-base font-semibold text-foreground hover:underline sm:text-lg"
          >
            {space.name}
          </Link>
          {space.tagline && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{space.tagline}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="collaborate">
              {SPACE_TYPE_LABEL[space.space_type] ?? titleCase(space.space_type)}
            </Badge>
            <Badge variant="secondary">{titleCase(space.status)}</Badge>
            <Badge variant="outline">
              {VISIBILITY_LABEL[space.visibility] ?? titleCase(space.visibility)}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {isPending ? (
          <Badge variant="secondary" className="shrink-0">
            Request pending
          </Badge>
        ) : joinable && onJoin ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={isJoining}
            onClick={() => onJoin(space)}
          >
            {space.visibility === 'community' ? 'Request to join' : 'Join'}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

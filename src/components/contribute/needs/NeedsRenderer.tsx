import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useUserNeeds } from '@/hooks/contribute/useNeeds';
import { NeedCard } from './NeedCard';

interface NeedsRendererProps {
  /** Profile owner whose Needs to render. */
  targetUserId: string;
  /** Current viewer id - controls Edit affordance + draft visibility. */
  viewerUserId: string | null;
}

export function NeedsRenderer({ targetUserId, viewerUserId }: NeedsRendererProps) {
  const navigate = useNavigate();
  const isOwner = viewerUserId === targetUserId;
  const { data: needs = [], isLoading } = useUserNeeds(targetUserId);

  if (isLoading) return null;

  // Visitor with no visible Needs - render nothing on the profile.
  if (!isOwner && needs.length === 0) return null;

  // Owner with no Needs - prompt to declare.
  if (isOwner && needs.length === 0) {
    return (
      <section className="bg-card border rounded-lg p-5">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
          What you are seeking
        </h2>
        <p className="text-sm text-foreground/90 mb-4">
          Declare a Need so the diaspora can recognise what you are building.
        </p>
        <Button onClick={() => navigate('/dna/contribute/my-needs')}>
          Declare a Need
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="sr-only">Needs</h2>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-9"
            onClick={() => navigate('/dna/contribute/my-needs')}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Edit Needs
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {needs.map((n) => (
          <NeedCard key={n.id} need={n} variant="renderer" />
        ))}
      </div>
    </section>
  );
}

export default NeedsRenderer;

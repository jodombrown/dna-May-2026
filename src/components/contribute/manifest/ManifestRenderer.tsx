import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useUserManifest } from '@/hooks/contribute/useManifest';
import { CurrencyStanceCard } from './CurrencyStanceCard';
import { CapitalComingSoonCard } from './CapitalComingSoonCard';

interface ManifestRendererProps {
  /** Profile owner whose manifest to render. */
  targetUserId: string;
  /** Current viewer id - controls Edit affordance + draft state visibility. */
  viewerUserId: string | null;
}

export function ManifestRenderer({ targetUserId, viewerUserId }: ManifestRendererProps) {
  const navigate = useNavigate();
  const isOwner = viewerUserId === targetUserId;
  const { data, isLoading } = useUserManifest(targetUserId);

  if (isLoading) return null;

  // Visitor + no published manifest = render nothing (don't show empty state to visitors)
  if (!isOwner && (!data || !data.manifest.isPublished)) return null;

  // Owner with no manifest yet, or unpublished
  if (isOwner && (!data || !data.manifest.isPublished)) {
    return (
      <section className="bg-card border rounded-lg p-5">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
          Your Manifest
        </h2>
        <p className="text-sm text-foreground/90 mb-4">
          Your Manifest isn't published yet. Declare how you show up for the diaspora.
        </p>
        <Button onClick={() => navigate('/dna/contribute/manifest')}>
          {data?.manifest.headline ? 'Continue editing' : 'Start your Manifest'}
        </Button>
      </section>
    );
  }

  if (!data) return null;
  const { manifest, stances } = data;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="sr-only">Manifest</h2>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-9"
            onClick={() => navigate('/dna/contribute/manifest')}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Edit Manifest
          </Button>
        )}
      </div>

      {manifest.headline && (
        <blockquote
          className="relative pl-5 py-2 text-xl md:text-2xl leading-snug font-serif text-foreground/90"
          style={{ borderLeft: '4px solid #2D6A4F' }}
        >
          <span aria-hidden="true" className="absolute -left-1 -top-2 text-3xl text-muted-foreground/30">"</span>
          {manifest.headline}
        </blockquote>
      )}

      <div className="space-y-3">
        {stances.map((s) => (
          <CurrencyStanceCard key={s.id} stance={s} variant="renderer" />
        ))}
        <CapitalComingSoonCard surface="renderer" />
      </div>
    </section>
  );
}

export default ManifestRenderer;

import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import type { RoomReadiness } from '@/types/contribute';
import { useEffect } from 'react';

type EmptyKind = 'no_manifest' | 'unpublished_manifest' | 'no_stances' | 'curating';

interface RoomEmptyStatesProps {
  kind: EmptyKind;
  readiness?: RoomReadiness;
  onOpenManifestEditor: () => void;
  onOpenStanceEditor: () => void;
  curatingRetry?: () => void;
}

/**
 * The four empty/onboarding states for the Room. Each state carries forward
 * the "name tag in the room" metaphor: these aren't error screens, they're
 * part of the experience.
 */
export function RoomEmptyStates({
  kind,
  onOpenManifestEditor,
  onOpenStanceEditor,
}: RoomEmptyStatesProps) {
  const navigate = useNavigate();

  useEffect(() => {
    trackContributeEvent({ type: 'room_empty_state_shown', state: kind });
  }, [kind]);

  if (kind === 'no_manifest') {
    return (
      <Shell title="Today's room">
        <p className="text-sm text-foreground/85">
          The room recognizes you through your Manifest. Start there.
        </p>
        <Button onClick={onOpenManifestEditor} className="h-11" style={{ background: '#4A8D77', color: 'white' }}>
          Open Manifest editor
        </Button>
      </Shell>
    );
  }

  if (kind === 'unpublished_manifest') {
    return (
      <Shell title="Today's room">
        <p className="text-sm text-foreground/85">
          Your Manifest isn't visible to the diaspora yet. Publish it so the room can recognize you.
        </p>
        <Button onClick={() => navigate('/dna/contribute/manifest')} className="h-11" style={{ background: '#4A8D77', color: 'white' }}>
          Open Manifest editor
        </Button>
      </Shell>
    );
  }

  if (kind === 'no_stances') {
    return (
      <Shell title="Today's room">
        <p className="text-sm text-foreground/85">
          Add at least one stance so the room knows how you show up.
        </p>
        <Button onClick={onOpenStanceEditor} className="h-11" style={{ background: '#4A8D77', color: 'white' }}>
          Add a stance
        </Button>
      </Shell>
    );
  }

  // curating
  return (
    <Shell title="Today's room">
      <p className="text-sm text-foreground/85">DIA is curating today's room...</p>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-foreground/40" />
      </div>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-lg border border-border/70 bg-background p-5">
      <header className="mb-3">
        <h2 className="font-serif text-xl text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Curated for you. Refreshed daily.</p>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

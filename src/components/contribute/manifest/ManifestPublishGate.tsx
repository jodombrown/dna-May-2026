import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/useMobile';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { formatDistanceToNow } from 'date-fns';
import type { ContributionManifest, CurrencyStance } from '@/types/contribute';

interface ManifestPublishGateProps {
  manifest: ContributionManifest;
  activeStances: CurrencyStance[];
  onPublish: () => Promise<void> | void;
  onUnpublish: () => Promise<void> | void;
  busy?: boolean;
}

export function ManifestPublishGate({
  manifest,
  activeStances,
  onPublish,
  onUnpublish,
  busy,
}: ManifestPublishGateProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { isMobile } = useMobile();

  const blockers = useMemo(() => {
    const out: string[] = [];
    if (!manifest.headline || manifest.headline.trim().length === 0) {
      out.push('a headline');
    }
    if (activeStances.length === 0) {
      out.push('at least one stance');
    }
    return out;
  }, [manifest.headline, activeStances.length]);

  const canPublish = blockers.length === 0;

  if (manifest.isPublished) {
    return (
      <>
        <div className="sticky bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            <span
              className="inline-flex items-center gap-1.5 text-foreground font-medium"
              style={{ color: '#2D6A4F' }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: '#2D6A4F' }}
                aria-hidden="true"
              />
              Published
            </span>
            {manifest.lastReviewedAt && (
              <span className="ml-2">
                Last reviewed{' '}
                {formatDistanceToNow(new Date(manifest.lastReviewedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
          >
            Unpublish
          </Button>
        </div>

        <ConfirmUnpublish
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          isMobile={isMobile}
          busy={busy}
          onConfirm={async () => {
            await onUnpublish();
            setConfirmOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="sticky bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 py-3 space-y-2">
      {!canPublish && (
        <p className="text-xs text-muted-foreground">
          You'll need {blockers.join(' and ')} before you can publish.
        </p>
      )}
      <Button
        type="button"
        className="w-full h-11"
        disabled={!canPublish || busy}
        onClick={() => onPublish()}
        style={{ background: canPublish ? '#4A8D77' : undefined, color: canPublish ? 'white' : undefined }}
      >
        {busy ? 'Publishing...' : 'Publish Manifest'}
      </Button>
    </div>
  );
}

interface ConfirmUnpublishProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
}

function ConfirmUnpublish({ open, onOpenChange, isMobile, busy, onConfirm }: ConfirmUnpublishProps) {
  const Body = (
    <div className="px-4 pb-6 space-y-3 text-sm text-foreground/90">
      <p>
        Unpublishing hides your Manifest from discovery but preserves your stances.
        You can republish anytime.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div data-vaul-drawer-handle="" className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <DrawerHeader>
            <DrawerTitle>Unpublish your Manifest?</DrawerTitle>
          </DrawerHeader>
          {Body}
          <div className="px-4 pb-6 flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)} disabled={busy}>
              Keep published
            </Button>
            <Button className="flex-1 h-11" onClick={() => onConfirm()} disabled={busy}>
              {busy ? 'Working...' : 'Unpublish'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Unpublish your Manifest?</DialogTitle>
        </DialogHeader>
        {Body}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep published
          </Button>
          <Button onClick={() => onConfirm()} disabled={busy}>
            {busy ? 'Working...' : 'Unpublish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

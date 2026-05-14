import { useNavigate } from 'react-router-dom';
import { useMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CURRENCY_VISUALS } from '@/components/contribute/manifest/currencyConfig';
import { RoomReasoningLine } from './RoomReasoningLine';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import { profileRoute } from '@/lib/profileRoute';
import type { RoomCuration, RoomSubjectProfile } from '@/types/contribute';

interface CurationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curation: RoomCuration | null;
  subject: RoomSubjectProfile | null;
  onDismiss: (curationId: string) => void;
}

/**
 * Detail view for a curation. Mobile vaul Drawer, desktop Dialog. Tapping
 * "View full profile" is the only intentional route navigation - the user is
 * explicitly choosing to leave the hub.
 */
export function CurationDrawer({ open, onOpenChange, curation, subject, onDismiss }: CurationDrawerProps) {
  const { isMobile } = useMobile();
  const navigate = useNavigate();
  if (!curation) return null;

  const visual = CURRENCY_VISUALS[curation.currency];
  const displayName = subject?.displayName ?? 'A diaspora member';
  const isNeedKind = curation.kind === 'their_need_my_stance';
  const title = curation.subjectStanceTitle ?? curation.subjectNeedTitle ?? '';
  const context = curation.subjectNeedContext;

  const handlePrimary = () => {
    if (isNeedKind) {
      trackContributeEvent({
        type: 'curation_offer_help_clicked',
        curation_id: curation.curationId,
        currency: curation.currency,
        reasoning_source: curation.reasoningSource,
      });
    } else {
      trackContributeEvent({
        type: 'curation_reach_out_clicked',
        curation_id: curation.curationId,
        kind: curation.kind,
        currency: curation.currency,
        reasoning_source: curation.reasoningSource,
      });
    }
    onOpenChange(false);
    const stanceParam = curation.viewerStanceId ? `&stance=${curation.viewerStanceId}` : '';
    navigate(
      `/dna/messages?to=${curation.subjectUserId}&context=curation:${curation.curationId}${stanceParam}`,
    );
  };

  const handleDismiss = () => {
    onDismiss(curation.curationId);
    onOpenChange(false);
  };

  const handleViewProfile = () => {
    onOpenChange(false);
    const route = profileRoute({ username: subject?.username ?? null });
    if (route) navigate(route);
  };

  const Body = (
    <div className="space-y-4 px-4 pb-6">
      <header className="flex items-start gap-3">
        {subject?.avatarUrl ? (
          <img
            src={subject.avatarUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-medium text-foreground/70"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{displayName}</p>
          {(subject?.city || subject?.location) && (
            <p className="text-xs text-muted-foreground">
              {[subject.city, subject.location].filter(Boolean).join(' / ')}
            </p>
          )}
          {subject?.headline && (
            <p className="mt-1 text-sm text-foreground/85">{subject.headline}</p>
          )}
        </div>
      </header>

      {title && (
        <div className="flex items-stretch gap-3 rounded-md border border-border/60 bg-background p-3">
          <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ background: visual.barHex }} />
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: visual.labelHex }}
            >
              {visual.label}
              {isNeedKind ? ' / seeking' : ''}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-foreground">{title}</p>
            {context && <p className="mt-1 text-xs text-muted-foreground">{context}</p>}
          </div>
        </div>
      )}

      <RoomReasoningLine reasoning={curation.reasoning} />

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handlePrimary}
          className="h-11 flex-1"
          style={{ background: '#4A8D77', color: 'white' }}
        >
          {isNeedKind ? 'Offer to help' : 'Reach out'}
        </Button>
        <Button type="button" variant="outline" onClick={handleDismiss} className="h-11">
          Dismiss
        </Button>
      </div>

      {subject?.username && (
        <button
          type="button"
          onClick={handleViewProfile}
          className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          View full profile
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div data-vaul-drawer-handle="" className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <DrawerHeader>
            <DrawerTitle className="text-left font-serif text-lg">In today's room</DrawerTitle>
          </DrawerHeader>
          {Body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">In today's room</DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}

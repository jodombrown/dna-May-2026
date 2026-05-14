import { Button } from '@/components/ui/button';
import { useMessage } from '@/contexts/MessageContext';
import { CURRENCY_VISUALS } from '@/components/contribute/manifest/currencyConfig';
import { RoomReasoningLine } from './RoomReasoningLine';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import type { RoomCuration, RoomSubjectProfile } from '@/types/contribute';

interface MatchedNeedCardProps {
  curation: RoomCuration;
  subject: RoomSubjectProfile | null;
  onOpenDrawer: () => void;
  onDismiss: () => void;
}

/**
 * "Active Needs that fit you" card. Renders the subject's open Need plus the
 * viewer's matching stance (encoded in the DIA reasoning line).
 */
export function MatchedNeedCard({ curation, subject, onOpenDrawer, onDismiss }: MatchedNeedCardProps) {
  const { openMessageOverlay } = useMessage();
  const visual = CURRENCY_VISUALS[curation.currency];
  const displayName = subject?.displayName ?? 'A diaspora member';

  const handleOfferHelp = () => {
    trackContributeEvent({
      type: 'curation_offer_help_clicked',
      curation_id: curation.curationId,
      currency: curation.currency,
      reasoning_source: curation.reasoningSource,
    });
    openMessageOverlay({
      recipientId: curation.subjectUserId,
      originType: 'profile',
      originId: curation.curationId,
      originMetadata: {
        title: curation.subjectNeedTitle ?? 'Open Need',
        preview: curation.subjectNeedTitle
          ? `Re: ${curation.subjectNeedTitle}`
          : undefined,
      },
    });
  };

  return (
    <article
      role="article"
      aria-label={`${displayName} is seeking ${visual.label}`}
      className="overflow-hidden rounded-lg border border-border/70 bg-background"
    >
      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            trackContributeEvent({
              type: 'matched_need_card_opened',
              curation_id: curation.curationId,
              currency: curation.currency,
              score: curation.score,
              reasoning_source: curation.reasoningSource,
            });
            onOpenDrawer();
          }}
          className="block w-full text-left"
        >
          <p className="text-sm text-foreground/80">
            <span className="font-medium text-foreground">{displayName}</span> is seeking
          </p>

          <div className="mt-3 flex items-stretch gap-3">
            <span
              aria-hidden
              className="w-1 shrink-0 rounded-full"
              style={{ background: visual.barHex }}
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ color: visual.labelHex }}
              >
                {visual.label} / seeking
              </p>
              {curation.subjectNeedTitle && (
                <p className="mt-0.5 text-sm leading-snug text-foreground">
                  {curation.subjectNeedTitle}
                </p>
              )}
              {curation.subjectNeedContext && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {curation.subjectNeedContext}
                </p>
              )}
            </div>
          </div>
        </button>

        <RoomReasoningLine reasoning={curation.reasoning} className="mt-3" />

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            onClick={handleOfferHelp}
            className="h-11 flex-1"
            style={{ background: '#4A8D77', color: 'white' }}
          >
            Offer to help
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            className="h-11"
            aria-label={`Dismiss this need from today's room`}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </article>
  );
}

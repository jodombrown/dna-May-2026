import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CURRENCY_VISUALS } from '@/components/contribute/manifest/currencyConfig';
import { RoomReasoningLine } from './RoomReasoningLine';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import type { RoomCuration, RoomSubjectProfile } from '@/types/contribute';
import { cn } from '@/lib/utils';

interface RecognitionCardProps {
  curation: RoomCuration;
  subject: RoomSubjectProfile | null;
  onOpenDrawer: () => void;
  onDismiss: () => void;
}

/**
 * "People to recognize today" card. The most strategically important card in
 * the module - this is the "name tag in the room" experience.
 *
 * Variants:
 *  - mutual: Forest top stripe accent, sorts to top of zone
 *  - tag_affinity: 90% body opacity (avatar/name remain full strength)
 *  - default (their_stance_my_need): standard treatment
 */
export function RecognitionCard({ curation, subject, onOpenDrawer, onDismiss }: RecognitionCardProps) {
  const navigate = useNavigate();
  const visual = CURRENCY_VISUALS[curation.currency];
  const isMutual = curation.kind === 'mutual';
  const isTagAffinity = curation.kind === 'tag_affinity';

  const displayName = subject?.displayName ?? 'A diaspora member';
  const initial = displayName.charAt(0).toUpperCase();
  const cityLine = [subject?.city, subject?.location].filter(Boolean).join(' / ');
  const identityLine = subject?.headline ?? cityLine ?? null;

  const handleReachOut = () => {
    trackContributeEvent({
      type: 'curation_reach_out_clicked',
      curation_id: curation.curationId,
      kind: curation.kind,
      currency: curation.currency,
      reasoning_source: curation.reasoningSource,
    });
    navigate(
      `/dna/messages?to=${curation.subjectUserId}&context=curation:${curation.curationId}`,
    );
  };

  const ariaLabel = isMutual
    ? `Mutual match with ${displayName}`
    : `Recognize ${displayName} in today's room`;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-lg border border-border/70 bg-background',
        isMutual && 'ring-1 ring-[#2D6A4F]/30',
      )}
    >
      {isMutual && (
        <div aria-hidden className="h-[3px] w-full" style={{ background: '#2D6A4F' }} />
      )}
      <div className={cn('p-4', isTagAffinity && 'opacity-90')}>
        <button
          type="button"
          onClick={() => {
            trackContributeEvent({
              type: 'recognition_card_opened',
              curation_id: curation.curationId,
              kind: curation.kind,
              currency: curation.currency,
              score: curation.score,
              reasoning_source: curation.reasoningSource,
            });
            onOpenDrawer();
          }}
          className="block w-full text-left"
        >
          <header className="flex items-start gap-3">
            {subject?.avatarUrl ? (
              <img
                src={subject.avatarUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground/70"
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{displayName}</p>
              {identityLine && (
                <p className="truncate text-xs text-muted-foreground">{identityLine}</p>
              )}
            </div>
          </header>

          {curation.subjectStanceTitle && (
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
                  {visual.label}
                </p>
                <p className="mt-0.5 text-sm leading-snug text-foreground">
                  {curation.subjectStanceTitle}
                </p>
              </div>
            </div>
          )}
        </button>

        <RoomReasoningLine reasoning={curation.reasoning} className="mt-3" />

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            onClick={handleReachOut}
            className="h-11 flex-1"
            style={{ background: '#4A8D77', color: 'white' }}
          >
            Reach out
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            className="h-11"
            aria-label={`Dismiss ${displayName} from today's room`}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </article>
  );
}

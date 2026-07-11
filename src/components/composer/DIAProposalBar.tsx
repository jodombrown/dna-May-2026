/**
 * DIA Proposal Bar (BD085)
 *
 * Replaces the old DIAIntentBar, which only *nagged* you to switch modes after
 * you had already typed. That is backwards: it interrupted without helping.
 *
 * This proposes the verb AND the fields, in one move the member accepts or
 * dismisses. Accept and the composer switches verb and pre-fills the card.
 * Dismiss and DIA stays quiet for the rest of the compose.
 *
 * DIA PROPOSES. THE AUTHOR OWNS THE FINAL VALUE. Every proposed field lands in
 * an editable input marked as DIA's, and the mark clears the moment the member
 * touches it.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { DIAExtraction } from '@/services/diaFieldExtraction';
import { modeConfig } from '@/config/composerModes';
import { cn } from '@/lib/utils';

interface DIAProposalBarProps {
  proposal: DIAExtraction | null;
  /** Accept the verb + all proposed fields. */
  onAccept: (proposal: DIAExtraction) => void;
  /** Not this — DIA stays quiet for the rest of this compose. */
  onDismiss: () => void;
  /** Hidden once the member has already chosen this verb themselves. */
  hidden?: boolean;
}

/** A short, human preview of what DIA would fill in. */
const previewOf = (p: DIAExtraction): string | null => {
  const f = p.fields;
  if (p.mode === 'need') {
    const parts = [f.giveWhat, f.giveTo, f.intendedImpact].filter(Boolean);
    return parts.length ? parts.join(' → ') : null;
  }
  if (p.mode === 'event') {
    const parts = [f.title, f.location].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }
  if (p.mode === 'connect' && f.intent) return `Looking for a ${f.intent}`;
  return null;
};

export const DIAProposalBar: React.FC<DIAProposalBarProps> = ({
  proposal,
  onAccept,
  onDismiss,
  hidden,
}) => {
  if (!proposal || hidden) return null;

  const cfg = modeConfig(proposal.mode);
  const preview = previewOf(proposal);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-muted/40 p-3',
        'animate-in fade-in slide-in-from-bottom-1 duration-200'
      )}
      role="status"
    >
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white',
          `bg-${cfg.bevelToken}`
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="text-muted-foreground">{proposal.reason}. Post this as </span>
          <span className="font-semibold">{cfg.label}</span>
          <span className="text-muted-foreground"> ({cfg.cName})?</span>
        </p>

        {preview && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            DIA filled in: <span className="font-medium text-foreground">{preview}</span>
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onAccept(proposal)}
          >
            Yes, use this
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground"
            onClick={onDismiss}
          >
            No thanks
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

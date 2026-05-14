/**
 * DNA | DIA Discovery Card for CONTRIBUTE
 *
 * STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
 *
 * Single rebuilding card replacing the previous priority-ordered discovery
 * variants (no-activity / skills-match / low-content / network-active /
 * welcome). Card type id: DIA_CONTRIBUTE_REBUILDING.
 *
 * Honors the Sprint 4A 7-day localStorage dismiss pattern.
 */

import { useState } from 'react';
import { isDismissed, dismissDIACard } from '@/services/diaCardService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Brain, X } from 'lucide-react';
import { Adinkrahene } from '@/components/icons/adinkra';

interface ContributeDIADiscoveryCardProps {
  openNeedsCount?: number;
  className?: string;
}

const ACCENT = '#B87333';
const DISMISS_KEY = 'DIA_CONTRIBUTE_REBUILDING';

export function ContributeDIADiscoveryCard({
  className,
}: ContributeDIADiscoveryCardProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed(DISMISS_KEY));

  if (dismissed) return null;

  const handleDismiss = () => {
    dismissDIACard(DISMISS_KEY);
    setDismissed(true);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-4"
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: ACCENT,
          backgroundColor: `${ACCENT}08`,
        }}
        role="status"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          aria-label="Dismiss"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 pr-12">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{ backgroundColor: `${ACCENT}20` }}
          >
            <Adinkrahene className="w-3 h-3" style={{ color: ACCENT }} />
          </div>
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: ACCENT }}
          >
            DIA &bull; CONTRIBUTE
          </span>
        </div>

        <div className="flex items-start gap-2 mb-1.5">
          <Brain className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
          <h4 className="font-semibold text-sm text-foreground leading-tight">
            DIA is preparing your CONTRIBUTE intelligence
          </h4>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed ml-6">
          Opportunities are being reimagined. Your DIA insights will return with the new module.
        </p>

        <div className="flex items-center mt-3 ml-6">
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-full px-4"
            style={{ borderColor: ACCENT, color: ACCENT, minHeight: 44 }}
            onClick={handleDismiss}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ContributeDIADiscoveryCard;

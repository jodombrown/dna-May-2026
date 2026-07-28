/**
 * DNA | CONVENE — DIA Organizer Insight Card
 * Contextual intelligence for event organizers on the hosting tab.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateOrganizerInsight, type OrganizerInsight } from '@/utils/convene/generateOrganizerInsight';
import type { OrganizerStats } from '@/hooks/convene/useOrganizerStats';

const STORAGE_KEY = 'dia_organizer_insight_dismissed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(): boolean {
  try {
    const ts = localStorage.getItem(STORAGE_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

interface DiaOrganizerInsightProps {
  stats: OrganizerStats;
  lastEventTitle?: string;
  lastEventAttendees?: number;
  daysSinceLastEvent?: number;
  topCategory?: string;
  className?: string;
}

export function DiaOrganizerInsight({
  stats,
  lastEventTitle,
  lastEventAttendees,
  daysSinceLastEvent,
  topCategory,
  className,
}: DiaOrganizerInsightProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => isDismissed());

  const insight = generateOrganizerInsight({
    ...stats,
    lastEventTitle,
    lastEventAttendees,
    daysSinceLastEvent,
    topCategory,
  });

  if (dismissed || !insight) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch { /* noop */ }
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4',
        'bg-gradient-to-r from-dna-dia/80 to-dna-success/80',
        'dark:from-dna-dia/30 dark:to-dna-success/30',
        'border-dna-dia/60 dark:border-dna-dia/40',
        className,
      )}
    >
      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-dna-dia/10 dark:bg-dna-dia/50 flex items-center justify-center">
            <Brain className="h-4 w-4 text-dna-dia" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-dna-dia">
              DIA
            </span>
          </div>
          <p className="text-sm text-foreground mb-3">{insight.message}</p>
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-dna-dia hover:bg-dna-dia text-white"
            onClick={() => navigate(insight.ctaPath)}
          >
            {insight.ctaLabel}
            <ArrowRight className="h-3 w-3 ml-1.5" />
          </Button>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss insight"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

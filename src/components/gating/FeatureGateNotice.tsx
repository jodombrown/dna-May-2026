/**
 * FeatureGateNotice — inline callout shown when a user tries to reach
 * a gated feature. Explains the "why", shows the current completion
 * percentage vs. the required threshold, and deep-links into edit.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import type { FeatureKey } from '@/config/profileGates';

interface Props {
  feature: FeatureKey;
  compact?: boolean;
}

export const FeatureGateNotice: React.FC<Props> = ({ feature, compact }) => {
  const gate = useFeatureGate(feature);
  if (gate.loading || gate.allowed) return null;

  return (
    <Card className={`border border-border ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{gate.label} is locked</p>
          <p className="text-xs text-muted-foreground mt-0.5">{gate.reason}</p>

          <div className="mt-3 mb-2 flex items-center gap-2">
            <Progress value={gate.percent} className="h-1.5 flex-1" />
            <span className="text-[11px] text-muted-foreground shrink-0">
              {gate.percent}% / {gate.minPercent}%
            </span>
          </div>

          {gate.missing.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc pl-4 mb-3 space-y-0.5">
              {gate.missing.map((m) => (
                <li key={m.field}>{m.label}</li>
              ))}
            </ul>
          )}

          <Button asChild size="sm" variant="outline">
            <Link to="/dna/profile/edit">
              Complete profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FeatureGateNotice;

/**
 * DNA | CONVENE — Event Status Badge
 * Renders contextual badges (Happening Now, Near Capacity, Free, etc.)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventStatus } from '@/utils/convene/getEventStatus';

interface ConveneEventBadgeProps {
  status: EventStatus;
  className?: string;
}

const VARIANT_STYLES: Record<EventStatus['variant'], string> = {
  happening:
    'bg-dna-success/15 text-dna-success border-dna-success/30 animate-pulse',
  urgent:
    'bg-dna-warning/15 text-dna-warning border-dna-warning/30',
  info:
    'bg-muted text-muted-foreground border-border',
  neutral:
    'bg-muted/60 text-muted-foreground/70 border-border/60',
  destructive:
    'bg-destructive/15 text-destructive border-destructive/30',
};

export function ConveneEventBadge({ status, className }: ConveneEventBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap',
        VARIANT_STYLES[status.variant],
        className,
      )}
    >
      {status.variant === 'happening' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-dna-success mr-1" />
      )}
      {status.label}
    </Badge>
  );
}

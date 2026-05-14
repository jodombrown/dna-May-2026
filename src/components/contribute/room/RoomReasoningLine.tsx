import { cn } from '@/lib/utils';

interface RoomReasoningLineProps {
  reasoning: string;
  className?: string;
}

/**
 * Renders DIA's reasoning string with a quiet, host-voice attribution.
 *
 * Visual treatment is intentionally restrained: a slim card-within-a-card on a
 * warm neutral, with a compact "DIA" label on the left edge. Not a flashy AI
 * badge - this is the host's voice, not editorial copy.
 */
export function RoomReasoningLine({ reasoning, className }: RoomReasoningLineProps) {
  return (
    <div
      role="note"
      aria-label="DIA reasoning"
      className={cn(
        'flex items-stretch gap-3 rounded-md border border-border/60 bg-muted/40 p-3',
        className,
      )}
    >
      <div
        aria-hidden
        className="flex w-6 shrink-0 items-center justify-center rounded-sm bg-background text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
      >
        DIA
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">{reasoning}</p>
    </div>
  );
}

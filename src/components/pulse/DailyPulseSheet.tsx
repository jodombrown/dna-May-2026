import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ListChecks, HandHeart } from 'lucide-react';
import { MateMasie, Nkonsonkonson, FuntunfunefuDenkyemfunefu, Adinkrahene } from '@/components/icons/adinkra';
import { useDailyPulseBrief } from '@/hooks/messaging/useDailyPulseBrief';
import { format } from 'date-fns';

interface DailyPulseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeNavigate?: () => void;
}

/**
 * Phase 18 - Cross-module Daily Pulse.
 * One sheet that surfaces upcoming events, tasks needing attention, and
 * open contribution needs in spaces the user belongs to. Topped with a
 * DIA-generated narrative.
 */
export const DailyPulseSheet: React.FC<DailyPulseSheetProps> = ({
  open,
  onOpenChange,
  onBeforeNavigate,
}) => {
  const navigate = useNavigate();
  const { pulse, brief, isLoading, isError } = useDailyPulseBrief(open);

  const go = (href: string) => {
    onOpenChange(false);
    onBeforeNavigate?.();
    setTimeout(() => navigate(href), 80);
  };

  const totals = pulse?.totals;
  const empty =
    !!pulse &&
    pulse.events.length === 0 &&
    pulse.tasks.length === 0 &&
    pulse.needs.length === 0;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <div className="flex items-start gap-2">
          <MateMasie className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <ResponsiveModalTitle>Your Daily Pulse</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {empty
                ? 'A quiet day across your modules.'
                : totals
                ? `${totals.eventsToday + pulse!.events.length - totals.eventsToday} events, ${pulse!.tasks.length} tasks, ${pulse!.needs.length} open needs`
                : 'Reading across Connect, Convene, Collaborate and Contribute...'}
            </ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 max-h-[68vh] overflow-y-auto space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Building your pulse...
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-destructive py-6 text-center">
            Could not load your daily pulse right now.
          </p>
        )}

        {!isLoading && !isError && empty && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nothing urgent today. Good time to start something new.
          </p>
        )}

        {!isLoading && !isError && pulse && !empty && (
          <>
            {brief && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <MateMasie className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] uppercase tracking-wide text-primary font-medium">
                    DIA brief
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">
                  {brief.headline}
                </p>
                {brief.narrative && (
                  <p className="text-xs text-muted-foreground leading-snug mt-1">
                    {brief.narrative}
                  </p>
                )}
              </div>
            )}

            {pulse.events.length > 0 && (
              <section>
                <header className="flex items-center gap-1.5 mb-1.5">
                  <Nkonsonkonson className="h-3.5 w-3.5 text-foreground/70" />
                  <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Coming up
                  </h3>
                </header>
                <ul className="space-y-1.5">
                  {pulse.events.map((e) => {
                    const hl = brief?.highlights.find(
                      (h) => h.module === 'convene' && h.refId === e.id,
                    );
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => go(e.href)}
                          className="w-full text-left rounded-md border border-border bg-card px-3 py-2 hover:bg-muted/40 transition-colors flex items-start gap-2"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {e.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(e.startsAt), 'EEE p')}
                            </p>
                            {hl?.suggestion && (
                              <p className="text-[11px] text-primary mt-0.5">
                                {hl.suggestion}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {pulse.tasks.length > 0 && (
              <section>
                <header className="flex items-center gap-1.5 mb-1.5">
                  <FuntunfunefuDenkyemfunefu className="h-3.5 w-3.5 text-foreground/70" />
                  <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Needs your attention
                  </h3>
                </header>
                <ul className="space-y-1.5">
                  {pulse.tasks.map((t) => {
                    const hl = brief?.highlights.find(
                      (h) => h.module === 'collaborate' && h.refId === t.id,
                    );
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => go(t.href)}
                          className="w-full text-left rounded-md border border-border bg-card px-3 py-2 hover:bg-muted/40 transition-colors flex items-start gap-2"
                        >
                          <ListChecks className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {t.spaceTitle}
                              {t.isOverdue && ' - overdue'}
                              {t.isStalled && !t.isOverdue && ' - stalled'}
                              {t.dueDate && !t.isOverdue && !t.isStalled
                                ? ` - due ${format(new Date(t.dueDate), 'MMM d')}`
                                : ''}
                            </p>
                            {hl?.suggestion && (
                              <p className="text-[11px] text-primary mt-0.5">
                                {hl.suggestion}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {pulse.needs.length > 0 && (
              <section>
                <header className="flex items-center gap-1.5 mb-1.5">
                  <Adinkrahene className="h-3.5 w-3.5 text-foreground/70" />
                  <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Open in your spaces
                  </h3>
                </header>
                <ul className="space-y-1.5">
                  {pulse.needs.map((n) => {
                    const hl = brief?.highlights.find(
                      (h) => h.module === 'contribute' && h.refId === n.id,
                    );
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => go(n.href)}
                          className="w-full text-left rounded-md border border-border bg-card px-3 py-2 hover:bg-muted/40 transition-colors flex items-start gap-2"
                        >
                          <HandHeart className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {n.spaceTitle} - {n.type}
                              {n.priority === 'high' ? ' - high priority' : ''}
                            </p>
                            {hl?.suggestion && (
                              <p className="text-[11px] text-primary mt-0.5">
                                {hl.suggestion}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => go('/dna/feed')}>
          Open feed
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </ResponsiveModal>
  );
};

export default DailyPulseSheet;

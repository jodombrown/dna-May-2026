/**
 * FirstRunActionTour — Inline action tour rendered near the top of
 * the feed for users who finished the signup wizard but still have
 * high-impact actions ahead of them. Non-modal, dismissable, and
 * resumable via `useFirstRunTour` (persisted to
 * `user_onboarding_selections`).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFirstRunTour } from '@/hooks/useFirstRunTour';
import { useOnboardingState } from '@/hooks/useOnboardingState';

export const FirstRunActionTour: React.FC = () => {
  const { stage } = useOnboardingState();
  const {
    shouldShow,
    stepStates,
    nextStep,
    completedCount,
    totalCount,
    skipTour,
    markStepDone,
  } = useFirstRunTour();

  // Only show the action tour after the wizard is done and before the
  // profile is essentially complete. First-run users get the wizard,
  // complete users get out of the way.
  if (!shouldShow) return null;
  if (stage === 'first_run' || stage === 'complete' || stage === 'loading' || stage === 'signed_out') {
    return null;
  }

  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className="p-4 border border-border">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold">Your first five moves</p>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} done. Finish the tour to get the most out of DNA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => skipTour()}
          aria-label="Dismiss tour"
          className="p-1 text-muted-foreground hover:text-foreground rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Progress value={percent} className="h-1.5 mb-3" />

      <ol className="space-y-1.5 mb-3">
        {stepStates.map(({ step, done }) => {
          const isNext = !done && nextStep?.id === step.id;
          return (
            <li
              key={step.id}
              className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs ${
                isNext ? 'bg-muted/60' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? 'bg-dna-emerald text-white'
                      : 'border border-border text-muted-foreground'
                  }`}
                  aria-hidden
                >
                  {done ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                <span
                  className={`truncate ${
                    done ? 'text-muted-foreground line-through' : 'text-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {!done && (
                <Link
                  to={step.href}
                  onClick={() => {
                    // Optimistically mark as done for steps that aren't
                    // auto-detected via profile fields (connections/events).
                    if (!step.satisfiesField) markStepDone(step.id);
                  }}
                  className="text-[11px] text-dna-emerald hover:underline shrink-0"
                >
                  {step.ctaLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <Button asChild size="sm" className="w-full">
          <Link
            to={nextStep.href}
            onClick={() => {
              if (!nextStep.satisfiesField) markStepDone(nextStep.id);
            }}
          >
            {nextStep.ctaLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </Card>
  );
};

export default FirstRunActionTour;

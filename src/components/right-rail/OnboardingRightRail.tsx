/**
 * OnboardingRightRail — Adaptive right-rail surface driven by
 * `useOnboardingState`. Renders one of four panels depending on where
 * the user is in their journey: first_run, getting_started, active, or
 * complete. Returns null while loading or for signed-out visitors so
 * the rest of the rail composes cleanly.
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useProfileCompleteAck } from '@/hooks/useProfileCompleteAck';
import type { ProfileFieldCheck } from '@/lib/profileCompletion';


// Map profileCompletion field ids to the editor tab that hosts them.
const FIELD_TO_EDIT_HASH: Record<string, string> = {
  avatar_url: '#identity',
  full_name: '#identity',
  headline: '#identity',
  banner_url: '#identity',
  profession: '#professional',
  bio: '#professional',
  linkedin_url: '#professional',
  industries: '#professional',
  skills: '#discovery',
  focus_areas: '#discovery',
  interests: '#discovery',
  primary_origin_country: '#heritage',
  current_country: '#heritage',
  languages: '#heritage',
};

function editHref(field?: string) {
  const hash = field ? FIELD_TO_EDIT_HASH[field] ?? '' : '';
  return `/dna/profile/edit${hash}`;
}

export const OnboardingRightRail: React.FC = () => {
  const { stage, percent, missing, nextField } = useOnboardingState();
  const { acked, ack } = useProfileCompleteAck(percent);

  if (stage === 'loading' || stage === 'signed_out') return null;

  if (stage === 'first_run') {
    return (
      <Card className="p-4 border border-border bg-gradient-to-br from-dna-emerald/5 to-dna-copper/5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkle className="h-4 w-4 text-dna-copper" aria-hidden />
          <p className="text-sm font-semibold">Welcome to DNA</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Let's set up your profile so the diaspora can find you.
          Takes about 3 minutes.
        </p>
        <Button asChild size="sm" className="w-full">
          <Link to="/onboarding">
            Start setup <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </Card>
    );
  }

  if (stage === 'complete') {
    // Quick-win: at 100% the panel disappears entirely. Persist the ack
    // so the celebration state is recorded; the row is auto-cleared by
    // useProfileCompleteAck if completion later drops below 100%.
    return <CompleteAutoAck acked={acked} ack={ack} />;
  }


  // getting_started or active — show progress + prioritised checklist
  const heading = stage === 'getting_started' ? 'Complete your profile' : 'A few more touches';
  const helper =
    stage === 'getting_started'
      ? 'A stronger profile unlocks better matches and posting.'
      : 'Add these to reach 100% and stand out in Discover.';

  const nextItems = missing.slice(0, 4);

  return (
    <Card className="p-4 border border-border">
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-sm font-semibold">{heading}</p>
        <span className="text-xs font-medium text-dna-copper">{percent}%</span>
      </div>
      <Progress value={percent} className="h-1.5 mb-3" />
      <p className="text-xs text-muted-foreground mb-3">{helper}</p>

      <ul className="space-y-1.5 mb-3">
        {nextItems.map((item) => (
          <MissingRow key={item.field} item={item} />
        ))}
      </ul>

      <Button asChild size="sm" className="w-full">
        <Link to={editHref(nextField?.field)}>
          {nextField ? `Add ${nextField.label.toLowerCase()}` : 'Edit profile'}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </Card>
  );
};

const MissingRow: React.FC<{ item: ProfileFieldCheck }> = ({ item }) => (
  <li>
    <Link
      to={editHref(item.field)}
      className="flex items-center justify-between text-xs text-foreground/80 hover:text-foreground rounded px-1.5 py-1 -mx-1.5 hover:bg-muted transition-colors"
    >
      <span className="truncate">{item.label}</span>
      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">+{item.points}</span>
    </Link>
  </li>
);

const CompleteAutoAck: React.FC<{ acked: boolean; ack: () => void }> = ({ acked, ack }) => {
  useEffect(() => {
    if (!acked) ack();
  }, [acked, ack]);
  return null;
};

export default OnboardingRightRail;

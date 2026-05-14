/**
 * ProfileCompletionGuide - Sprint 12B
 *
 * Persistent but collapsible guide showing profile completion progress.
 * Desktop: Floating card in bottom-right corner, collapsible to a pill.
 * Mobile: Accessible from profile page, with indicator dot.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, X, Camera, FileText, MapPin, User, Wrench, Layers, Users, Calendar, Eye, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfileCompletion, type ProfileStep } from '@/hooks/useProfileCompletion';
import { useMobile } from '@/hooks/useMobile';
import { Sankofa } from '@/components/icons/adinkra';

const STEP_ICONS: Record<string, typeof Camera> = {
  photo: Camera,
  headline: FileText,
  location: MapPin,
  bio: User,
  skills: Wrench,
  sectors: Layers,
  first_connection: Users,
  first_event: Calendar,
  first_space: Sankofa,
  first_opportunity: Eye,
  first_post: Megaphone,
};

const STEP_ROUTES: Record<string, string> = {
  photo: '/dna/profile/edit',
  headline: '/dna/profile/edit',
  location: '/dna/profile/edit',
  bio: '/dna/profile/edit',
  skills: '/dna/profile/edit',
  sectors: '/dna/profile/edit',
  first_connection: '/dna/connect/discover',
  first_event: '/dna/convene',
  first_space: '/dna/collaborate',
  first_opportunity: '/dna/contribute',
  first_post: '/dna/feed',
};

const PRIORITY_LABELS: Record<string, string> = {
  required: 'Required',
  recommended: 'Recommended',
  optional: 'Exploration',
};

export function ProfileCompletionGuide() {
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const {
    steps,
    completedCount,
    totalSteps,
    completionPercentage,
    requiredComplete,
    allComplete,
    guideDismissed,
    guideMinimized,
    dismissGuide,
    toggleMinimized,
  } = useProfileCompletion();

  const [localMinimized, setLocalMinimized] = useState(guideMinimized);

  // Don't show if dismissed or all complete
  if (guideDismissed || allComplete) return null;

  // On mobile, don't show the floating guide (it's accessible from profile page instead)
  if (isMobile) return null;

  const isMinimized = localMinimized || guideMinimized;

  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setLocalMinimized(newState);
    toggleMinimized(newState);
  };

  const handleStepClick = (step: ProfileStep) => {
    const route = STEP_ROUTES[step.id];
    if (route) navigate(route);
  };

  const handleDismiss = () => {
    dismissGuide();
  };

  // Minimized pill view
  if (isMinimized) {
    return (
      <button
        onClick={handleToggleMinimize}
        className={cn(
          'fixed bottom-6 right-6 z-30',
          'flex items-center gap-2 px-4 py-2',
          'bg-white border border-neutral-200 rounded-full shadow-lg',
          'hover:shadow-xl transition-all duration-200',
          'text-sm font-medium'
        )}
      >
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{
            background: `conic-gradient(#2F5233 ${completionPercentage * 3.6}deg, #e5e7eb ${completionPercentage * 3.6}deg)`,
          }}
        >
          <span className="h-4 w-4 rounded-full bg-white flex items-center justify-center text-[10px] text-neutral-700">
            {completionPercentage}
          </span>
        </div>
        Profile: {completionPercentage}%
        <ChevronUp className="h-3 w-3 text-neutral-400" />
      </button>
    );
  }

  // Group steps by priority
  const requiredSteps = steps.filter((s) => s.priority === 'required');
  const recommendedSteps = steps.filter((s) => s.priority === 'recommended');
  const optionalSteps = steps.filter((s) => s.priority === 'optional');

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-30',
        'w-80 max-h-[70vh]',
        'bg-white border border-neutral-200 rounded-xl shadow-xl',
        'flex flex-col',
        'animate-slide-up'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            Your DNA Profile
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleMinimize}
              className="p-1 rounded hover:bg-neutral-100 transition-colors"
              aria-label="Minimize"
            >
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-neutral-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={completionPercentage} className="flex-1 h-2" />
          <span className="text-xs font-medium text-dna-emerald">
            {completionPercentage}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {completedCount} of {totalSteps} steps complete
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Required steps */}
        {requiredSteps.some((s) => !s.isComplete) && (
          <StepGroup
            label="Required"
            steps={requiredSteps}
            onStepClick={handleStepClick}
          />
        )}

        {/* Celebration if required complete */}
        {requiredComplete && !allComplete && (
          <div className="px-3 py-2 bg-dna-emerald/10 rounded-lg text-center">
            <p className="text-xs font-medium text-dna-emerald">
              Required steps done! Keep going for better recommendations.
            </p>
          </div>
        )}

        {/* Recommended steps */}
        {recommendedSteps.some((s) => !s.isComplete) && (
          <StepGroup
            label="Recommended"
            steps={recommendedSteps}
            onStepClick={handleStepClick}
          />
        )}

        {/* Optional / exploration steps */}
        {optionalSteps.some((s) => !s.isComplete) && (
          <StepGroup
            label="Explore DNA"
            steps={optionalSteps}
            onStepClick={handleStepClick}
          />
        )}
      </div>
    </div>
  );
}

interface StepGroupProps {
  label: string;
  steps: ProfileStep[];
  onStepClick: (step: ProfileStep) => void;
}

function StepGroup({ label, steps, onStepClick }: StepGroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        {label}
      </p>
      <div className="space-y-1">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.id] || Check;
          return (
            <button
              key={step.id}
              onClick={() => !step.isComplete && onStepClick(step)}
              disabled={step.isComplete}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                step.isComplete
                  ? 'bg-neutral-50 opacity-60 cursor-default'
                  : 'hover:bg-neutral-50 cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
                  step.isComplete
                    ? 'bg-dna-emerald text-white'
                    : 'bg-neutral-100 text-neutral-400'
                )}
              >
                {step.isComplete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    step.isComplete && 'line-through text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

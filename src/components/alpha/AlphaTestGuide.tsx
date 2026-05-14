import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// ─── Test Scenario Data ─────────────────────────────────────────────────────

interface TestScenario {
  id: string;
  title: string;
  module: string;
  steps: string[];
  successCriteria: string;
  estimatedTime: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'connect-1',
    title: 'Build Your Network',
    module: 'CONNECT',
    steps: [
      'Complete your profile (add skills, interests, location)',
      'Browse the discovery feed',
      'Find someone who shares your interests',
      'Send them a connection request',
      'Check if DIA suggests anyone ("People You Should Know" card)',
    ],
    successCriteria: 'You made at least 1 connection and saw a DIA suggestion.',
    estimatedTime: '5 minutes',
  },
  {
    id: 'convene-1',
    title: 'Host an Event',
    module: 'CONVENE',
    steps: [
      'Open the composer (+ button)',
      'Select "Host an Event" mode',
      'Fill in event details (title, date, description)',
      'Publish the event',
      'Check: Did the success screen appear with DIA suggestion?',
      'Check: Does the event appear in the Convene Hub?',
      'Check: Was a discussion thread auto-created for the event?',
    ],
    successCriteria: 'Event is live, visible in hub, thread exists.',
    estimatedTime: '5 minutes',
  },
  {
    id: 'convene-2',
    title: 'Attend an Event',
    module: 'CONVENE',
    steps: [
      'Find an upcoming event in the Convene Hub',
      'RSVP to the event',
      'Check: Were you added to the event discussion thread?',
      'Post a message in the event thread',
      'Check: Did the event host receive a notification?',
    ],
    successCriteria: 'RSVP works, thread access works, notification delivered.',
    estimatedTime: '3 minutes',
  },
  {
    id: 'collaborate-1',
    title: 'Start a Space',
    module: 'COLLABORATE',
    steps: [
      'Open the composer',
      'Select "Start a Space" mode',
      'Create a space with a name and description',
      'Check: Does it appear in the Collaborate Hub?',
      'Check: Was a General channel auto-created?',
      'Add a task to the space',
    ],
    successCriteria: 'Space is live, channel exists, task created.',
    estimatedTime: '5 minutes',
  },
  {
    id: 'contribute-1',
    title: 'Post an Opportunity',
    module: 'CONTRIBUTE',
    steps: [
      'Open the composer',
      'Select "Post an Opportunity" mode',
      'Post a need or offer',
      'Check: Does it appear in the Contribute Hub?',
      'Check: Does DIA show you any matching opportunities?',
    ],
    successCriteria: 'Opportunity live in hub, DIA match card visible.',
    estimatedTime: '3 minutes',
  },
  {
    id: 'convey-1',
    title: 'Tell a Story',
    module: 'CONVEY',
    steps: [
      'Open the composer',
      'Select "Tell a Story" mode',
      'Write a story (at least 200 words)',
      'Publish',
      'Check: Success screen with card preview?',
      'Check: Story appears in feed with teal bevel?',
    ],
    successCriteria: 'Story published, visible in feed.',
    estimatedTime: '5 minutes',
  },
  {
    id: 'dia-1',
    title: 'Experience DIA Intelligence',
    module: 'DIA',
    steps: [
      'Scroll through the feed \u2014 look for DIA insight cards',
      'Visit the Connect Hub \u2014 see DIA suggestions in sidebar',
      'Open the composer in Post mode and type "Join us this Saturday for a mixer" \u2014 does DIA suggest switching to Event mode?',
      'Check your notifications \u2014 any DIA notifications?',
      'Dismiss a DIA card \u2014 does it stay dismissed on refresh?',
    ],
    successCriteria: 'DIA visible in feed, hubs, composer, and notifications.',
    estimatedTime: '5 minutes',
  },
  {
    id: 'messaging-1',
    title: 'Cross-C Conversation',
    module: 'MESSAGING',
    steps: [
      'Open a conversation with a connection',
      'Reply to a specific message (long-press or hover \u2192 Reply)',
      'Check: Does the reply show the quoted message?',
      'Share an event into the conversation (from event detail page)',
      'Check: Does a rich event card appear in the chat?',
    ],
    successCriteria: 'Reply-to works, entity card renders in chat.',
    estimatedTime: '3 minutes',
  },
  {
    id: 'overall-1',
    title: "The Five C's Journey",
    module: 'OVERALL',
    steps: [
      'CONNECT: Find and connect with 2 people',
      'CONVENE: RSVP to an event and post in its thread',
      'COLLABORATE: Join a space and complete a task',
      'CONTRIBUTE: Post an opportunity (need or offer)',
      'CONVEY: Share a post or story about your experience',
      'Notice how DIA guides you between these actions',
    ],
    successCriteria:
      "You touched all Five C's and felt the connections between them.",
    estimatedTime: '15-20 minutes',
  },
];

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dna_alpha_test_progress';

function loadProgress(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage may be unavailable
  }
}

// ─── Module Colors ──────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  CONNECT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONVENE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  COLLABORATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  CONTRIBUTE: 'bg-copper-100 text-copper-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONVEY: 'bg-copper-100 text-copper-800 dark:bg-copper-900/40 dark:text-copper-300',
  DIA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  MESSAGING: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  OVERALL: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface AlphaTestGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export function AlphaTestGuide({ isOpen, onClose, onOpenFeedback }: AlphaTestGuideProps) {
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, boolean>>(loadProgress);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    saveProgress(completedScenarios);
  }, [completedScenarios]);

  const allComplete = Object.values(completedScenarios).filter(Boolean).length >= TEST_SCENARIOS.length;

  const handleRestart = useCallback(() => {
    const reset: Record<string, boolean> = {};
    TEST_SCENARIOS.forEach((s) => { reset[s.id] = false; });
    setCompletedScenarios(reset);
  }, []);

  const toggleScenario = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const toggleCompletion = useCallback((id: string) => {
    setCompletedScenarios((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  }, []);

  if (!isOpen || !FEATURE_FLAGS.enableTestGuide) {
    return null;
  }

  const completedCount = Object.values(completedScenarios).filter(Boolean).length;
  const totalCount = TEST_SCENARIOS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed z-[61]',
          'inset-y-0 right-0 w-full sm:w-[480px]',
          'bg-white dark:bg-neutral-900',
          'shadow-2xl border-l border-neutral-200 dark:border-neutral-700',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Alpha Test Guide</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close test guide"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {completedCount} of {totalCount} scenarios completed
              </span>
              <span className="font-medium text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completion Banner */}
        {allComplete && (
          <div className="mx-4 mt-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              🎉 All {totalCount} scenarios completed!
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Thank you for testing. You can restart anytime.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              className="mt-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            >
              Restart Test
            </Button>
          </div>
        )}

        {/* Scenario List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {TEST_SCENARIOS.map((scenario) => {
            const isCompleted = completedScenarios[scenario.id] ?? false;
            const isExpanded = expandedId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={cn(
                  'rounded-xl border transition-colors',
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                    : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50'
                )}
              >
                {/* Scenario Header */}
                <button
                  onClick={() => toggleScenario(scenario.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
                          MODULE_COLORS[scenario.module] ?? MODULE_COLORS.OVERALL
                        )}
                      >
                        {scenario.module}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {scenario.estimatedTime}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {scenario.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletion(scenario.id);
                    }}
                    className="flex-shrink-0 p-0.5"
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                    )}
                  </button>
                </button>

                {/* Expanded Steps */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 ml-7 mr-10 space-y-3">
                    <div className="space-y-2">
                      {scenario.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-xs font-mono text-muted-foreground mt-0.5 w-4 text-right flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="text-sm text-foreground">{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2 text-xs">
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        Success:{' '}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {scenario.successCriteria}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenFeedback();
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                        'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                        'dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
                        'transition-colors'
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Give Feedback on This Scenario
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

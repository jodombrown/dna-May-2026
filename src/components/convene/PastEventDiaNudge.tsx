/**
 * PastEventDiaNudge — DIA-styled prompts for post-event circulation
 * 
 * 1. CONVENE → CONVEY: "Share your experience" story prompt
 * 2. CONVENE → CONNECT: "Connect with attendees" networking prompt
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, X, PenLine, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PastEventDiaNudgeProps {
  eventId: string;
  eventTitle: string;
  attendeeCount?: number;
  variant: 'share_story' | 'connect_attendees';
  className?: string;
}

const STORAGE_PREFIX = 'dia_past_event_dismissed_';

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissed(eventId: string, variant: string): boolean {
  try {
    const ts = localStorage.getItem(`${STORAGE_PREFIX}${variant}_${eventId}`);
    if (!ts) return false;
    return Date.now() - Number(ts) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function setDismissed(eventId: string, variant: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${variant}_${eventId}`, String(Date.now()));
  } catch {
    // localStorage unavailable
  }
}

export function PastEventDiaNudge({
  eventId,
  eventTitle,
  attendeeCount,
  variant,
  className,
}: PastEventDiaNudgeProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissedState] = useState(() => isDismissed(eventId, variant));

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(eventId, variant);
    setDismissedState(true);
  };

  const handleAction = () => {
    if (variant === 'share_story') {
      // Navigate to compose with story mode context
      navigate('/dna/convey/compose?mode=story&context=' + encodeURIComponent(eventTitle));
    } else {
      // Navigate to event detail attendees section
      navigate(`/dna/convene/events/${eventId}?tab=attendees`);
    }
  };

  const isStory = variant === 'share_story';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4',
        'bg-gradient-to-r from-dna-dia/80 to-dna-success/80',
        'dark:from-dna-dia/30 dark:to-dna-success/30',
        'border-dna-dia/60 dark:border-dna-dia/40',
        className
      )}
    >
      {/* Subtle pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url('/patterns/kente-pattern.svg')`,
          backgroundSize: '120px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative flex items-start gap-3">
        {/* DIA icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-dna-dia/10 dark:bg-dna-dia/50 flex items-center justify-center">
            <Brain className="h-4 w-4 text-dna-dia dark:text-dna-dia" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">
            {isStory
              ? `You attended "${eventTitle}" — share your experience with the diaspora`
              : `You attended "${eventTitle}"${attendeeCount ? ` with ${attendeeCount} others` : ''} — expand your network`}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {isStory
              ? 'Write a story about what you learned or experienced'
              : 'Connect with fellow attendees to keep the conversation going'}
          </p>
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-dna-dia hover:bg-dna-dia text-white"
            onClick={handleAction}
          >
            {isStory ? (
              <>
                <PenLine className="h-3 w-3 mr-1.5" />
                Write a Story
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1.5" />
                View Attendees
              </>
            )}
          </Button>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * DNA | CONVENE — Sticky RSVP Bar
 * Fixed bottom bar on mobile showing price, availability, and CTA.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StickyRSVPBarProps {
  eventId: string;
  isPastEvent: boolean;
  isCancelled: boolean;
  isOrganizer: boolean;
  /** Signed-out visitor — softens the empty-room copy to a sign-in prompt. */
  isAnonymous: boolean;
  currentRsvp: string | null;
  maxAttendees: number | null;
  attendeeCount: number;
  isSubmitting: boolean;
  onRsvp: (status: 'going' | 'maybe' | 'not_going') => void;
}

/**
 * Tiered headcount copy for the non-organizer / public view. A room that
 * reads "0 / 50" looks empty, so small numbers become an invitation instead
 * of a count. Organizers never see this — they get the true count/capacity.
 */
export function tieredAttendeeText({
  goingCount,
  maxAttendees,
  isAnonymous,
}: {
  goingCount: number;
  maxAttendees: number | null;
  isAnonymous: boolean;
}): string {
  const spotsLeft = maxAttendees ? Math.max(maxAttendees - goingCount, 0) : null;
  const isNearCapacity = maxAttendees ? goingCount >= maxAttendees * 0.9 : false;

  let text: string;
  if (goingCount === 0) {
    text = isAnonymous ? 'Register to reserve your spot' : 'Be the first to RSVP';
  } else if (goingCount < 10) {
    text = 'A few people are going — join them';
  } else {
    text = `${goingCount} going`;
  }

  if (isNearCapacity && spotsLeft !== null && spotsLeft > 0) {
    text += ` · ${spotsLeft} spots left`;
  }
  return text;
}

export function StickyRSVPBar({
  eventId,
  isPastEvent,
  isCancelled,
  isOrganizer,
  isAnonymous,
  currentRsvp,
  maxAttendees,
  attendeeCount,
  isSubmitting,
  onRsvp,
}: StickyRSVPBarProps) {
  const navigate = useNavigate();

  const isNearCapacity = maxAttendees ? attendeeCount >= maxAttendees * 0.9 : false;
  const isFull = maxAttendees ? attendeeCount >= maxAttendees : false;

  const getAvailabilityText = () => {
    if (isCancelled) return 'Cancelled';
    if (isPastEvent) return 'Event Ended';
    // Organizers always see the true numbers.
    if (isOrganizer) {
      return maxAttendees ? `${attendeeCount} / ${maxAttendees} registered` : `${attendeeCount} registered`;
    }
    if (isFull) return 'Waitlist';
    return tieredAttendeeText({ goingCount: attendeeCount, maxAttendees, isAnonymous });
  };

  const renderCTA = () => {
    if (isPastEvent) {
      return (
        <Button disabled className="shrink-0">
          Event Ended
        </Button>
      );
    }

    if (isCancelled) {
      return (
        <Button disabled variant="destructive" className="shrink-0">
          Cancelled
        </Button>
      );
    }

    if (isOrganizer) {
      return (
        <Button
          className="shrink-0"
          onClick={() => navigate(`/dna/convene/events/${eventId}/manage`)}
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Manage
        </Button>
      );
    }

    if (currentRsvp === 'going') {
      return (
        <Button
          variant="outline"
          className="shrink-0 border-[hsl(var(--module-convene))] text-[hsl(var(--module-convene))]"
          onClick={() => onRsvp('not_going')}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Registered
        </Button>
      );
    }

    if (isFull) {
      return (
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => onRsvp('going')}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Clock className="h-4 w-4 mr-1.5" />}
          Join Waitlist
        </Button>
      );
    }

    return (
      <Button
        className="shrink-0"
        onClick={() => onRsvp('going')}
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
        Register
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
    >
      <div
        className="bg-background/95 backdrop-blur-md border-t border-border px-4 pt-3 flex items-center justify-between gap-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold">Free</p>
          <p className={cn(
            'text-xs',
            isNearCapacity || isFull ? 'text-amber-600 font-medium' : 'text-muted-foreground'
          )}>
            {getAvailabilityText()}
          </p>
        </div>
        {renderCTA()}
      </div>
    </motion.div>
  );
}

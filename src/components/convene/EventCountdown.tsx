/**
 * DNA | CONVENE — Event Countdown Timer
 * Shows time remaining until event starts, "Happening Now" for live events,
 * or nothing for past events.
 */

import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, isPast, isFuture } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventCountdownProps {
  startTime: string | null;
  endTime?: string | null;
  className?: string;
}

export function EventCountdown({ startTime, endTime, className }: EventCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // No announced start — nothing to count down to.
  if (!startTime) return null;
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return null;
  const end = endTime ? new Date(endTime) : null;

  // Past event
  if (isPast(start) && (!end || isPast(end))) {
    return null; // Don't show anything for past events
  }

  // Currently happening
  if (isPast(start) && end && isFuture(end)) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <span className="font-semibold text-destructive">Happening Now</span>
      </div>
    );
  }

  // Future event — compute countdown
  const days = differenceInDays(start, now);
  const hours = differenceInHours(start, now) % 24;
  const minutes = differenceInMinutes(start, now) % 60;

  let countdownText: string;
  if (days > 0) {
    countdownText = `Starts in ${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    countdownText = `Starts in ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min`;
  } else if (minutes > 0) {
    countdownText = 'Starting soon!';
  } else {
    countdownText = 'Starting now!';
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-[hsl(var(--module-convene))]', className)}>
      <Clock className="h-4 w-4" />
      <span className="font-medium">{countdownText}</span>
    </div>
  );
}

/**
 * DNA | CONVENE — My Events Stats Header
 * Three metric cards with count-up animation for the hosting tab.
 */

import { useEffect, useRef, useState } from 'react';
import { Calendar, Users, Clock } from 'lucide-react';
import type { OrganizerStats } from '@/hooks/convene/useOrganizerStats';

interface MyEventsStatsHeaderProps {
  stats: OrganizerStats;
  isLoading?: boolean;
}

function AnimatedCount({ target, duration = 500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return <span>{count}</span>;
}

const METRICS = [
  { key: 'eventsHosted' as const, label: 'Events Hosted', icon: Calendar },
  { key: 'totalAttendees' as const, label: 'Total Attendees', icon: Users },
  { key: 'upcoming' as const, label: 'Upcoming', icon: Clock },
];

export function MyEventsStatsHeader({ stats, isLoading }: MyEventsStatsHeaderProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {METRICS.map((m) => (
          <div
            key={m.key}
            className="rounded-xl bg-module-convene/5 border border-module-convene/10 p-4 animate-pulse"
          >
            <div className="h-8 w-12 bg-muted rounded mb-1" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {METRICS.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.key}
            className="rounded-xl bg-module-convene/5 border border-module-convene/10 p-4 text-center"
          >
            <Icon className="h-4 w-4 text-dna-convene mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              <AnimatedCount target={stats[m.key]} />
            </p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        );
      })}
    </div>
  );
}

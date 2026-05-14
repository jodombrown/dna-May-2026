// src/components/hubs/shared/HubStatsBar.tsx
// Horizontal stats bar with clickable metrics for Five C hub pages

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface HubStat {
  label: string;
  value: number;
  icon?: LucideIcon;
  onClick?: () => void;
  suffix?: string;
}

interface HubStatsBarProps {
  stats: HubStat[];
  loading?: boolean;
  className?: string;
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + (value - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function HubStatsBar({ stats, loading = false, className }: HubStatsBarProps) {
  return (
    <div
      className={cn(
        'grid gap-3',
        stats.length === 4 ? 'grid-cols-2 md:grid-cols-4' : `grid-cols-2 md:grid-cols-${stats.length}`,
        className
      )}
    >
      {stats.map((stat, index) => {
        const interactive = !!stat.onClick;
        const Tag: 'button' | 'div' = interactive ? 'button' : 'div';
        const ariaLabel = `${stat.value.toLocaleString()}${stat.suffix ?? ''} ${stat.label}`;
        return (
          <Tag
            key={index}
            {...(interactive
              ? {
                  onClick: stat.onClick,
                  type: 'button' as const,
                  'aria-label': ariaLabel,
                }
              : { 'aria-label': ariaLabel, role: 'group' as const })}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg min-h-[44px]',
              'bg-card border border-border',
              'transition-all duration-200',
              interactive &&
                'hover:border-primary hover:bg-primary/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !interactive && 'cursor-default'
            )}
          >
            {stat.icon && (
              <stat.icon className="w-5 h-5 text-muted-foreground mb-2" />
            )}
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix && <span className="text-lg">{stat.suffix}</span>}
                </>
              )}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1 text-center">
              {stat.label}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}

export default HubStatsBar;

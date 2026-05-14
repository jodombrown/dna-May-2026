// src/components/hubs/shared/HubHero.tsx
// Reusable hero section for Five C hub pages

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type HubType = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

interface HubHeroProps {
  hub: HubType;
  icon: LucideIcon;
  title: string;
  tagline: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

// Cultural pattern backgrounds at 5-8% opacity
const hubPatterns: Record<HubType, string> = {
  connect: 'bg-[url("/patterns/kente-pattern.svg")]',
  convene: 'bg-[url("/patterns/mudcloth-pattern.svg")]',
  collaborate: 'bg-[url("/patterns/ndebele-pattern.svg")]',
  contribute: 'bg-[url("/patterns/kente-pattern.svg")]',
  convey: 'bg-[url("/patterns/mudcloth-pattern.svg")]',
};

export function HubHero({
  hub,
  icon: Icon,
  title,
  tagline,
  primaryAction,
  secondaryAction,
  className,
}: HubHeroProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        'py-8 sm:py-12 px-6 sm:px-10',
        className
      )}
    >
      {/* Cultural pattern overlay - subtle 5-8% opacity */}
      <div
        className={cn(
          'absolute inset-0 opacity-[0.06] pointer-events-none',
          hubPatterns[hub]
        )}
        style={{ backgroundSize: '200px 200px' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
          <Icon className="w-8 h-8 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h1>

        {/* Tagline */}
        <p className="text-lg text-muted-foreground max-w-xl">
          {tagline}
        </p>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {primaryAction && (
              <Button size="lg" onClick={primaryAction.onClick}>
                {primaryAction.icon && (
                  <primaryAction.icon className="w-4 h-4 mr-2" />
                )}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button size="lg" variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.icon && (
                  <secondaryAction.icon className="w-4 h-4 mr-2" />
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HubHero;

/**
 * PulseDockItem - Primary Navigation Item for Mobile Dock
 *
 * Displays a single navigation item with status indicator,
 * activity dots, and special styling for the center Feed button.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { PulseSection, PulseStatus } from '@/types/pulse';
import type { MoreButtonState } from '@/hooks/usePulseNavigation';

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

interface PulseDockItemProps {
  item: {
    key: string;
    label: string;
    icon: IconComponent;
    href: string | null;
    isCenter?: boolean;
    isTrigger?: boolean;
  };
  pulseData: PulseSection | MoreButtonState | null | undefined;
  isActive: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<PulseStatus, string> = {
  active: 'bg-dna-emerald',
  attention: 'bg-dna-copper',
  dormant: 'bg-gray-300',
  urgent: 'bg-dna-copper animate-pulse',
};

export function PulseDockItem({ item, pulseData, isActive, onClick }: PulseDockItemProps) {
  const Icon = item.icon;
  const status = (pulseData?.status || 'dormant') as PulseStatus;
  const count =
    pulseData && 'count' in pulseData
      ? pulseData.count
      : pulseData && 'totalCount' in pulseData
        ? pulseData.totalCount
        : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center',
        'min-w-[56px] h-full px-1',
        'transition-all duration-75',
        'active:scale-[0.82] active:opacity-60',
        isActive ? 'text-dna-emerald' : 'text-gray-600',
        item.isCenter && 'relative'
      )}
    >
      {/* Center item (Feed) gets special treatment */}
      {item.isCenter ? (
        <div
          className={cn(
            'flex items-center justify-center',
            'w-12 h-12 -mt-4',
            'rounded-full',
            'bg-dna-emerald text-white',
            'shadow-lg',
            isActive && 'ring-2 ring-dna-emerald/30'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      ) : (
        <>
          {/* Status indicator */}
          <div className="relative">
            <Icon
              className={cn('w-5 h-5', isActive && 'text-dna-emerald')}
              strokeWidth={isActive ? 2.5 : 2}
            />

            {/* Pulse dot */}
            {status !== 'dormant' && (
              <span
                className={cn(
                  'absolute -top-1 -right-1',
                  'w-2 h-2 rounded-full',
                  'border border-white',
                  STATUS_COLORS[status]
                )}
              />
            )}
          </div>

          {/* Label */}
          <span
            className={cn(
              'text-[10px] font-medium mt-0.5',
              isActive ? 'text-dna-emerald font-semibold' : 'text-gray-500'
            )}
          >
            {item.label}
          </span>

          {/* Active indicator bar */}
          {isActive && (
            <span className="w-4 h-[2px] rounded-full bg-dna-emerald mt-0.5" />
          )}

          {/* Activity dots */}
          {count > 0 && !isActive && (
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <span key={i} className={cn('w-1 h-1 rounded-full', STATUS_COLORS[status])} />
              ))}
            </div>
          )}
        </>
      )}
    </button>
  );
}

export default PulseDockItem;

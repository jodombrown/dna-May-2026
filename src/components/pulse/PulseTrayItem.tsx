/**
 * PulseTrayItem - Item Component for the Expanded Tray
 *
 * Supports two variants:
 * - pulse: Full card with status indicator and micro-text (for Five C's items)
 * - utility: Compact circular icon with badge (for settings, profile, etc.)
 */

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PulseSection, PulseStatus } from '@/types/pulse';

interface PulseTrayItemProps {
  item: {
    key: string;
    label: string;
    icon: LucideIcon;
    href: string;
  };
  pulseData: Partial<PulseSection> | null;
  onClick: () => void;
  variant: 'pulse' | 'utility';
}

const STATUS_BG: Record<PulseStatus, string> = {
  active: 'bg-dna-emerald/10',
  attention: 'bg-dna-copper/10',
  dormant: 'bg-neutral-50',
  urgent: 'bg-dna-copper/10',
};

const STATUS_INDICATOR: Record<PulseStatus, string> = {
  active: 'bg-dna-emerald',
  attention: 'bg-dna-copper',
  dormant: 'bg-neutral-300',
  urgent: 'bg-dna-copper animate-pulse',
};

export function PulseTrayItem({ item, pulseData, onClick, variant }: PulseTrayItemProps) {
  const Icon = item.icon;
  const status = (pulseData?.status || 'dormant') as PulseStatus;
  const microText = pulseData?.micro_text;
  const count = pulseData?.count || 0;

  if (variant === 'utility') {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-75">
        <div
          className={cn(
            'relative flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-neutral-100 text-neutral-600',
            'hover:bg-neutral-200 transition-colors',
            'active:bg-neutral-300 active:shadow-inner'
          )}
        >
          <Icon className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-dna-copper text-white text-xs font-bold rounded-full">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500">{item.label}</span>
      </button>
    );
  }

  // Pulse variant
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-3 rounded-xl',
        'transition-all duration-75',
        STATUS_BG[status],
        'hover:opacity-80',
        'active:scale-90 active:shadow-inner active:opacity-60'
      )}
    >
      {/* Icon with status indicator */}
      <div className="relative mb-2">
        <Icon className={cn('w-6 h-6', status === 'dormant' ? 'text-neutral-400' : 'text-neutral-700')} />
        {status !== 'dormant' && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'w-2.5 h-2.5 rounded-full',
              'border-2 border-white',
              STATUS_INDICATOR[status]
            )}
          />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-xs font-medium',
          status === 'dormant' ? 'text-neutral-400' : 'text-neutral-700'
        )}
      >
        {item.label}
      </span>

      {/* Micro-text */}
      {microText && (
        <span className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-full">{microText}</span>
      )}
    </button>
  );
}

export default PulseTrayItem;

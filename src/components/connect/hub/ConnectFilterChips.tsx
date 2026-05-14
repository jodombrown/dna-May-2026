/**
 * DNA | CONNECT — Filter Chips
 * Horizontally scrollable pill-shaped category filters.
 * Uses Emerald accent (CONNECT's module color, not Copper).
 */

import React from 'react';
import { Briefcase, Users, Clock, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConnectFilterId = 'all' | 'sectors' | 'active' | 'new' | 'nearby';

const FILTERS = [
  { id: 'all' as const, name: 'All', icon: null },
  { id: 'sectors' as const, name: 'My Sectors', icon: Briefcase },
  { id: 'active' as const, name: 'Active', icon: Activity },
  { id: 'new' as const, name: 'New Members', icon: Clock },
  { id: 'nearby' as const, name: 'Near Me', icon: MapPin },
] as const;

interface ConnectFilterChipsProps {
  activeFilter: ConnectFilterId;
  onSelect: (filterId: ConnectFilterId) => void;
}

export function ConnectFilterChips({
  activeFilter,
  onSelect,
}: ConnectFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        const Icon = filter.icon;

        return (
          <button
            key={filter.id}
            onClick={() => onSelect(filter.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-dna-emerald text-white border-dna-emerald shadow-sm'
                : 'bg-background text-foreground border-border hover:border-dna-emerald/40 hover:bg-dna-emerald/5',
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {filter.name}
          </button>
        );
      })}
    </div>
  );
}

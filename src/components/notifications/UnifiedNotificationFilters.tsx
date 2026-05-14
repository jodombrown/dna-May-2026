/**
 * DNA | UnifiedNotificationFilters — Sprint 4C
 *
 * Filter tabs for the unified notification panel:
 * All | Activity | DIA
 *
 * Shows badge counts per filter. DIA tab uses the gold accent color.
 */

import { cn } from '@/lib/utils';
import { Bell, Activity } from 'lucide-react';
import type { UnifiedNotificationFilter } from '@/services/unifiedNotificationService';
import { MateMasie } from '@/components/icons/adinkra';

interface FilterOption {
  value: UnifiedNotificationFilter;
  label: string;
  icon: React.ReactNode;
  color: string | null;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All', icon: <Bell className="h-3.5 w-3.5" />, color: null },
  { value: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" />, color: '#4A8D77' },
  { value: 'dia', label: 'DIA', icon: <MateMasie className="h-3.5 w-3.5" />, color: '#C4942A' },
];

interface UnifiedNotificationFiltersProps {
  activeFilter: UnifiedNotificationFilter;
  onFilterChange: (filter: UnifiedNotificationFilter) => void;
  counts?: {
    all: number;
    activity: number;
    dia: number;
  };
}

export function UnifiedNotificationFilters({
  activeFilter,
  onFilterChange,
  counts,
}: UnifiedNotificationFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide border-b">
      {FILTERS.map((filterOpt) => {
        const isActive = activeFilter === filterOpt.value;
        const count = counts?.[filterOpt.value] || 0;

        return (
          <button
            key={filterOpt.value}
            onClick={() => onFilterChange(filterOpt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              'border',
              isActive
                ? 'text-white border-transparent'
                : 'text-muted-foreground border-border hover:bg-accent hover:text-foreground'
            )}
            style={
              isActive
                ? { backgroundColor: filterOpt.color || 'hsl(var(--primary))' }
                : undefined
            }
          >
            {filterOpt.icon}
            <span>{filterOpt.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

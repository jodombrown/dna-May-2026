/**
 * DNA | UnifiedNotificationFilters
 *
 * Filter lanes for the unified notification panel:
 * All | Unread | DIA
 *
 * All/Unread is the read-state control; DIA stays available as a lane, not a
 * competing tab set. The Unread lane shows the canonical RPC unread count.
 */

import { cn } from '@/lib/utils';
import { Bell, Circle } from 'lucide-react';
import type { UnifiedNotificationFilter } from '@/services/unifiedNotificationService';
import { MateMasie } from '@/components/icons/adinkra';

interface FilterOption {
  value: UnifiedNotificationFilter;
  label: string;
  icon: React.ReactNode;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All', icon: <Bell className="h-3.5 w-3.5" /> },
  { value: 'unread', label: 'Unread', icon: <Circle className="h-3.5 w-3.5" /> },
  { value: 'dia', label: 'DIA', icon: <MateMasie className="h-3.5 w-3.5" /> },
];

interface UnifiedNotificationFiltersProps {
  activeFilter: UnifiedNotificationFilter;
  onFilterChange: (filter: UnifiedNotificationFilter) => void;
  /** Canonical (RPC-backed) unread count shown on the Unread lane. */
  unreadCount?: number;
}

export function UnifiedNotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}: UnifiedNotificationFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide border-b">
      {FILTERS.map((filterOpt) => {
        const isActive = activeFilter === filterOpt.value;
        const count = filterOpt.value === 'unread' ? unreadCount : 0;

        return (
          <button
            key={filterOpt.value}
            onClick={() => onFilterChange(filterOpt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-meta font-medium whitespace-nowrap transition-colors border',
              isActive
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'text-muted-foreground border-border hover:bg-accent hover:text-foreground'
            )}
          >
            {filterOpt.icon}
            <span>{filterOpt.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'ml-0.5 px-1.5 py-0.5 rounded-full text-micro font-semibold leading-none',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
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

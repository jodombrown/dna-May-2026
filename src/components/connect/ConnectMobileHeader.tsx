import React from 'react';
import { Users, Network, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { MESSAGING_ENABLED } from '@/config/featureFlags';

export type ConnectTab = 'discover' | 'network' | 'messages';

interface ConnectMobileHeaderProps {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersClick: () => void;
  activeFilterCount?: number;
}

// BD063 hide-and-freeze: the Messages tab is dropped while DM/group messaging
// is OUT at v0.0 (see MESSAGING_ENABLED).
const TAB_CONFIG = [
  { value: 'discover' as const, icon: Users, label: 'Members' },
  { value: 'network' as const, icon: Network, label: 'Network' },
  ...(MESSAGING_ENABLED
    ? [{ value: 'messages' as const, icon: MessageCircle, label: 'Messages' }]
    : []),
];

export function ConnectMobileHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onFiltersClick,
  activeFilterCount = 0,
}: ConnectMobileHeaderProps) {
  return (
    <div className="md:hidden">
      <DnaMobileHeader
        bubble={{
          kind: 'search',
          placeholder: 'Search members...',
          value: searchQuery,
          onChange: onSearchChange,
          onFiltersClick,
          activeFilterCount,
        }}
      />
      <ConnectMobileTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}

interface ConnectMobileTabsProps {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
}

export function ConnectMobileTabs({ activeTab, onTabChange }: ConnectMobileTabsProps) {
  return (
    <div className="px-3 py-1.5 bg-background border-b border-border">
      <div
        className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg"
        role="tablist"
        aria-label="Connect tabs"
      >
        {TAB_CONFIG.map(({ value, icon: Icon, label }) => {
          const isActive = activeTab === value;
          const ariaLabel = `${label} tab`;

          return (
            <button
              key={value}
              onClick={() => onTabChange(value)}
              role="tab"
              aria-selected={isActive}
              aria-label={ariaLabel}
              title={label}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-md transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-background shadow-sm flex-1 px-3"
                  : "px-3 text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} aria-hidden="true" />
              {isActive && (
                <span className="text-xs font-medium truncate">{label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ConnectMobileTopBar({
  searchQuery,
  onSearchChange,
  onFiltersClick,
  activeFilterCount = 0,
}: Omit<ConnectMobileHeaderProps, 'activeTab' | 'onTabChange'>) {
  return (
    <div className="md:hidden">
      <DnaMobileHeader
        bubble={{
          kind: 'search',
          placeholder: 'Search members...',
          value: searchQuery,
          onChange: onSearchChange,
          onFiltersClick,
          activeFilterCount,
        }}
      />
    </div>
  );
}


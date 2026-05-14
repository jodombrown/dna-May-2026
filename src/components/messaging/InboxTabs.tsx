import React from 'react';
import { Inbox, UserPlus, ShieldAlert, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InboxTab } from '@/types/messaging';

interface InboxTabsProps {
  activeTab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  primaryCount?: number;
  requestsCount?: number;
  spamCount?: number;
  archivedCount?: number;
}

/**
 * On-brand segmented tab bar for the Messages inbox.
 * Mirrors the Connect "Network" pattern: hairline-bordered grid, emerald active
 * state, warm-cream inactive surface, icon + label per segment.
 */
const InboxTabs: React.FC<InboxTabsProps> = ({
  activeTab,
  onTabChange,
  primaryCount,
  requestsCount,
  spamCount,
  archivedCount,
}) => {
  const tabs: { id: InboxTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'primary', label: 'Primary', shortLabel: 'Primary', icon: Inbox, count: primaryCount },
    { id: 'requests', label: 'Requests', shortLabel: 'Requests', icon: UserPlus, count: requestsCount },
    { id: 'spam', label: 'Spam', shortLabel: 'Spam', icon: ShieldAlert, count: spamCount },
    { id: 'archived', label: 'Archived', shortLabel: 'Archived', icon: Archive, count: archivedCount },
  ];

  return (
    <div
      className="grid grid-cols-4 gap-1 px-3 py-2 border-b border-border/60 bg-background"
      role="tablist"
      aria-label="Inbox sections"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            aria-label={`${tab.label}${tab.count ? `, ${tab.count} items` : ''}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors min-h-[40px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{tab.shortLabel}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-semibold',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default InboxTabs;

/**
 * Mobile Feed Tabs with Active Label Display
 * 
 * Shows icon + text for the active tab, icons-only for inactive tabs.
 * This provides clear context for what's selected while staying compact.
 */

import React from 'react';
import { Newspaper, UserPlus, PenSquare, Bookmark, Compass } from 'lucide-react';
import { FeedTab } from '@/types/feed';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MobileFeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

/**
 * Feed tab icons. Each must be unique within this surface and is
 * reserved per docs/ICON_USAGE_GUIDE.md - enforced by
 * scripts/check-icon-duplicates.ts.
 */
const TAB_CONFIG: { value: FeedTab; icon: React.ElementType; label: string; description: string }[] = [
  { value: 'all', icon: Newspaper, label: 'All', description: 'All posts from the diaspora community' },
  { value: 'for_you', icon: Compass, label: 'For You', description: 'Personalized for you' },
  { value: 'network', icon: UserPlus, label: 'My Network', description: 'Posts from your connections' },
  { value: 'my_posts', icon: PenSquare, label: 'Mine', description: 'Posts you have shared' },
  { value: 'bookmarks', icon: Bookmark, label: 'Saved', description: 'Posts you have saved' },
];

export function MobileFeedTabs({ activeTab, onTabChange }: MobileFeedTabsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg"
        role="tablist"
        aria-label="Feed tabs"
      >
        {TAB_CONFIG.map(({ value, icon: Icon, label, description }) => {
          const isActive = activeTab === value;

          return (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { haptic('light'); onTabChange(value); }}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${label} - ${description}`}
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
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
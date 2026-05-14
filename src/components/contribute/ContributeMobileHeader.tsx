/**
 * DNA | CONTRIBUTE — Mobile Header
 * Two-row fixed header matching Feed, Connect, and Convene patterns.
 * Row 1: DNA logo | Composer bubble | Notification bell | Profile avatar
 * Row 2: Segmented icon+label tab bar
 */

import React from 'react';
import { UserCircle, Target, ListChecks, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { haptic } from '@/utils/haptics';

export type ContributeTab = 'manifest' | 'needs' | 'mine' | 'impact';

const TABS: { id: ContributeTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'manifest', icon: UserCircle, label: 'Manifest' },
  { id: 'needs', icon: Target, label: 'Needs' },
  { id: 'mine', icon: ListChecks, label: 'Mine' },
  { id: 'impact', icon: TrendingUp, label: 'Impact' },
];

interface ContributeMobileHeaderProps {
  activeTab: ContributeTab;
  onTabChange: (tab: ContributeTab) => void;
  onComposerClick: () => void;
  isRow1Visible?: boolean;
}

export function ContributeMobileHeader({
  activeTab,
  onTabChange,
  onComposerClick,
  isRow1Visible = true,
}: ContributeMobileHeaderProps) {
  return (
    <div className="md:hidden bg-background">
      <DnaMobileHeader
        isVisible={isRow1Visible}
        bubble={{
          kind: 'composer',
          placeholder: 'Declare a Need or share what you bring...',
          onClick: onComposerClick,
        }}
      />

      {/* Row 2: Segmented Tab Bar */}
      <div className="px-3 py-1.5 bg-background border-b border-border">
        <div className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg">
          {TABS.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { haptic('light'); onTabChange(id); }}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 rounded-md transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-background shadow-sm flex-1 px-3'
                    : 'px-3 text-muted-foreground hover:text-foreground hover:bg-background/50',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                {isActive && (
                  <span className="text-xs font-medium truncate">{label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContributeMobileHeader;

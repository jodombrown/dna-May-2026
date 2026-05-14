/**
 * DNA | CONVENE — Mobile Header
 * Top row uses the shared DnaMobileHeader so the logo, composer bubble,
 * bell, and avatar match every other /dna/* hub. Tabs row is local.
 */

import React from 'react';
import { CalendarDays, MapPin, Clock, Globe, Ticket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { haptic } from '@/utils/haptics';

const TABS = [
  { id: 'all', icon: CalendarDays, label: 'All' },
  { id: 'near_me', icon: MapPin, label: 'Near Me' },
  { id: 'this_week', icon: Clock, label: 'This Week' },
  { id: 'online', icon: Globe, label: 'Online' },
  { id: 'free', icon: Ticket, label: 'Free' },
  { id: 'network', icon: Users, label: 'Network' },
] as const;

interface ConveneMobileHeaderProps {
  activePill: string;
  onPillChange: (pill: string) => void;
  onComposerClick: () => void;
  isRow1Visible?: boolean;
}

export function ConveneMobileHeader({
  activePill,
  onPillChange,
  onComposerClick,
  isRow1Visible = true,
}: ConveneMobileHeaderProps) {
  return (
    <div className="md:hidden bg-background">
      <DnaMobileHeader
        isVisible={isRow1Visible}
        bubble={{ kind: 'composer', placeholder: 'Host or find an event...', onClick: onComposerClick }}
      />

      {/* Row 2: Segmented Tab Bar - matches Feed & Connect */}
      <div className="px-3 py-1.5 bg-background border-b border-border">
        <div className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg">
          {TABS.map(({ id, icon: Icon, label }) => {
            const isActive = activePill === id;
            return (
              <button
                key={id}
                onClick={() => { haptic('light'); onPillChange(id); }}
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

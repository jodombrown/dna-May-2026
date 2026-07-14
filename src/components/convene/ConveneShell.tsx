/**
 * ConveneShell — the single source of mobile chrome for every Convene route
 * (hub, events index, event detail, my events, edit event, calendar view).
 *
 * Renders the canonical DnaMobileHeader (DNA logo, composer bubble, bell,
 * avatar) plus the Convene tab strip via DnaMobileHubShell. No Convene page
 * composes its own header chrome; pages only supply body content.
 *
 * The tab strip drives the hub's discovery pills: on /dna/convene it writes
 * the ?pill= search param in place; from any other Convene page it navigates
 * back to the hub with the chosen pill.
 *
 * On desktop this is a pass-through — pages keep their desktop chrome.
 */
import React, { type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Clock, Globe, Ticket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';

const HUB_PATH = '/dna/convene';

const TABS = [
  { id: 'all', icon: CalendarDays, label: 'All' },
  { id: 'near_me', icon: MapPin, label: 'Near Me' },
  { id: 'this_week', icon: Clock, label: 'This Week' },
  { id: 'online', icon: Globe, label: 'Online' },
  { id: 'free', icon: Ticket, label: 'Free' },
  { id: 'network', icon: Users, label: 'Network' },
] as const;

function ConveneTabStrip({
  activePill,
  onPillChange,
}: {
  activePill: string;
  onPillChange: (pill: string) => void;
}) {
  return (
    <div className="md:hidden px-3 py-1.5 bg-background border-b border-border">
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
  );
}

interface ConveneShellProps {
  children: ReactNode;
  /** Set false when the page renders its own fixed bottom bar (e.g. the
   *  event detail's StickyRSVPBar) — never two fixed bottom bars. */
  showBottomNav?: boolean;
  /** Extra classes on the scrolling content wrapper. */
  contentClassName?: string;
}

export function ConveneShell({
  children,
  showBottomNav = true,
  contentClassName,
}: ConveneShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const composer = useUniversalComposer();

  const isHub = location.pathname === HUB_PATH;
  // Off the hub no pill is active; tapping one is a navigation, not a filter.
  const activePill = isHub ? searchParams.get('pill') || 'all' : '';

  const handlePillChange = (pill: string) => {
    if (isHub) {
      const next = new URLSearchParams(searchParams);
      if (pill === 'all') next.delete('pill');
      else next.set('pill', pill);
      setSearchParams(next, { replace: true });
    } else {
      navigate(pill === 'all' ? HUB_PATH : `${HUB_PATH}?pill=${pill}`);
    }
  };

  return (
    <>
      <DnaMobileHubShell
        bubble={{
          kind: 'composer',
          placeholder: 'Host or find an event...',
          onClick: () => composer.open('event'),
        }}
        tabs={<ConveneTabStrip activePill={activePill} onPillChange={handlePillChange} />}
        showBottomNav={showBottomNav}
        contentClassName={contentClassName}
      >
        {children}
      </DnaMobileHubShell>

      <UniversalComposer
        isOpen={composer.isOpen}
        mode={composer.mode}
        context={composer.context}
        isSubmitting={composer.isSubmitting}
        onClose={composer.close}
        onModeChange={composer.switchMode}
        successData={composer.successData}
        onSubmit={composer.submit}
        onDismissSuccess={composer.dismissSuccess}
      />
    </>
  );
}

export default ConveneShell;

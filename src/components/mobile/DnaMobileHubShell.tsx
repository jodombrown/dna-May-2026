/**
 * DnaMobileHubShell - shared mobile chrome for /dna/* pages.
 *
 * Renders the canonical DnaMobileHeader (logo / bubble / bell / avatar) in a
 * fixed top-0 container that collapses on scroll-down (matching the Feed
 * + Connect pattern), an optional always-visible `tabs` row underneath, and
 * reserves the bottom-nav footer via MobileBottomNav.
 *
 * On desktop, renders children only (page keeps its own desktop chrome).
 */
import React, { useRef, type ReactNode } from 'react';
import { DnaMobileHeader, type DnaMobileHeaderBubble } from '@/components/mobile/DnaMobileHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { useMobile } from '@/hooks/useMobile';
import { useMobileHeaderHeight } from '@/hooks/useMobileHeaderHeight';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

interface DnaMobileHubShellProps {
  bubble: DnaMobileHeaderBubble;
  /** Optional always-visible row rendered directly under the top bar (e.g. tabs). */
  tabs?: ReactNode;
  /** Content column. */
  children: ReactNode;
  /** Extra classes on the scrolling content wrapper. */
  contentClassName?: string;
  /** Set false to omit the MobileBottomNav mount (page renders its own). */
  showBottomNav?: boolean;
}

export function DnaMobileHubShell({
  bubble,
  tabs,
  children,
  contentClassName,
  showBottomNav = true,
}: DnaMobileHubShellProps) {
  const { isMobile } = useMobile();
  const headerRef = useRef<HTMLDivElement>(null);
  const headerPadding = useMobileHeaderHeight(headerRef);
  const { isScrollingDown, isAtTop } = useScrollDirection(30);
  const topBarHidden = isMobile && isScrollingDown && !isAtTop;

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background pb-bottom-nav overflow-x-hidden">
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background"
      >
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            topBarHidden ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100',
          )}
        >
          <DnaMobileHeader bubble={bubble} />
        </div>
        {tabs}
      </div>

      <div
        className={cn('transition-[padding] duration-200', contentClassName)}
        style={{ paddingTop: headerPadding || 56 }}
      >
        {children}
      </div>

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

export default DnaMobileHubShell;

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
    <div
      className={cn(
        'min-h-screen bg-background overflow-x-hidden',
        // Pages that opt out of the bottom nav own their bottom spacing
        // (e.g. a page whose primary action is its own fixed bottom bar).
        showBottomNav && 'pb-bottom-nav',
      )}
    >
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background"
        /*
          BD157: the top safe-area inset, applied at the SHARED chrome and
          nowhere else (BD110).

          `index.html` sets `viewport-fit=cover` and `manifest.json` sets
          `display: standalone`, so in the INSTALLED PWA this container owns the
          strip under the notch — the strip iOS draws the clock, wifi and battery
          into. Without this padding the header renders beneath the status bar
          and its top-right control, the avatar, is physically unreachable in
          portrait. Not disabled, not covered by an overlay: the taps belong to
          the system layer and never reach the page.

          A Safari TAB cannot reproduce this, because Safari's own chrome
          occupies the same strip. That is why it survived DR0, DR1 and DR2.

          `.safe-area-pt` has existed in `index.css` since before this cycle with
          ZERO consumers. The class was written and never applied. Grep for
          consumers, never for the definition (BD145, one layer over).

          Padding rather than offset ON PURPOSE: `headerRef` is measured by
          ResizeObserver in `useMobileHeaderHeight`, so growing this element
          grows the measured height, and the content offset below corrects
          itself with no second source of truth to drift.
        */
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
        /*
          The fallback runs only for the frame before ResizeObserver reports.
          It has to carry the inset too, or that frame renders content under the
          header on exactly the devices this fix is for.
        */
        style={{ paddingTop: headerPadding || 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
      >
        {children}
      </div>

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

export default DnaMobileHubShell;

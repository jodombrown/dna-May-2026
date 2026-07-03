// Shared chrome for the COLLABORATE > Spaces pages. Keeps the unified
// DnaMobileHeader on mobile (logo / bubble / bell / avatar) so the header
// never shifts between /dna/* hubs, and centers page content on desktop.

import { useRef, type ReactNode } from 'react';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { useMobile } from '@/hooks/useMobile';
import { useMobileHeaderHeight } from '@/hooks/useMobileHeaderHeight';

interface SpacesShellProps {
  children: ReactNode;
  /** Placeholder shown in the mobile header bubble. */
  bubblePlaceholder?: string;
  /** Max width of the centered content column. */
  maxWidthClassName?: string;
}

export function SpacesShell({
  children,
  bubblePlaceholder = 'Search Spaces…',
  maxWidthClassName = 'max-w-4xl',
}: SpacesShellProps) {
  const { isMobile } = useMobile();
  const headerRef = useRef<HTMLDivElement>(null);
  const headerPadding = useMobileHeaderHeight(headerRef);

  return (
    <>
      {isMobile && (
        <div
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden"
        >
          <DnaMobileHeader
            bubble={{ kind: 'static', placeholder: bubblePlaceholder }}
          />
        </div>
      )}
      <div
        className="min-h-[60vh] bg-background"
        style={isMobile ? { paddingTop: headerPadding || 56 } : undefined}
      >
        <div className={`mx-auto ${maxWidthClassName} px-4 py-6 sm:py-8`}>
          {children}
        </div>
      </div>
    </>
  );
}

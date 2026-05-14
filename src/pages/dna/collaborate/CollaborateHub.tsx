// COLLABORATE module is in rebuild. We still ship the unified DnaMobileHeader
// on mobile so the chrome (logo / bubble / bell / avatar) matches the rest of
// the /dna/* hubs and never shifts.

import { useRef } from 'react';
import { RebuildingLanding } from '@/components/shared/RebuildingPlaceholder';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { useMobile } from '@/hooks/useMobile';
import { useMobileHeaderHeight } from '@/hooks/useMobileHeaderHeight';

export default function CollaborateHub() {
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
            bubble={{ kind: 'static', placeholder: 'Spaces are being reimagined...' }}
          />
        </div>
      )}
      <div style={isMobile ? { paddingTop: headerPadding || 56 } : undefined}>
        <RebuildingLanding module="collaborate" />
      </div>
    </>
  );
}

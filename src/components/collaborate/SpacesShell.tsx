// Shared chrome for the COLLABORATE > Spaces pages. Uses the unified
// DnaMobileHubShell on mobile so the top bar, tabs, and bottom nav match
// every other /dna/* hub exactly.

import { type ReactNode } from 'react';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';
import { CollaborateMobileTabs } from '@/components/collaborate/CollaborateMobileTabs';

interface SpacesShellProps {
  children: ReactNode;
  /** Placeholder shown in the mobile header bubble. */
  bubblePlaceholder?: string;
  /** Optional live search value driven by the header bubble. */
  searchQuery?: string;
  /** Optional handler for header bubble search input. */
  onSearchChange?: (value: string) => void;
  /** Max width of the centered content column. */
  maxWidthClassName?: string;
  /**
   * Optional menu-nav row rendered directly beneath the header. Defaults to
   * the shared CollaborateMobileTabs so every Collaborate surface shows the
   * same second row (Spaces / My Spaces / Discover), matching the pattern
   * used by Feed / Connect / Convene / Contribute. Pass `null` to opt out
   * (e.g. Space detail / board / settings sub-pages).
   */
  tabs?: ReactNode;
}

export function SpacesShell({
  children,
  bubblePlaceholder = 'Search Spaces…',
  searchQuery,
  onSearchChange,
  maxWidthClassName = 'max-w-4xl',
  tabs = <CollaborateMobileTabs />,
}: SpacesShellProps) {
  // If the caller doesn't wire searchQuery/onSearchChange, fall back to a
  // non-interactive static bubble so the mobile header doesn't render a
  // broken controlled input that swallows every keystroke.
  const bubble = onSearchChange
    ? {
        kind: 'search' as const,
        placeholder: bubblePlaceholder,
        value: searchQuery ?? '',
        onChange: onSearchChange,
      }
    : {
        kind: 'static' as const,
        placeholder: bubblePlaceholder,
      };

  return (
    <DnaMobileHubShell bubble={bubble} tabs={tabs ?? undefined}>
      <div className="min-h-[60vh] bg-background">
        <div className={`mx-auto ${maxWidthClassName} px-4 py-6 sm:py-8`}>
          {children}
        </div>
      </div>
    </DnaMobileHubShell>
  );
}

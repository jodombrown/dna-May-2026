// Shared chrome for the COLLABORATE > Spaces pages. Uses the unified
// DnaMobileHubShell on mobile so the top bar, tabs, and bottom nav match
// every other /dna/* hub exactly.

import { type ReactNode } from 'react';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';

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
}

export function SpacesShell({
  children,
  bubblePlaceholder = 'Search Spaces…',
  searchQuery,
  onSearchChange,
  maxWidthClassName = 'max-w-4xl',
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
        label: bubblePlaceholder,
      };

  return (
    <DnaMobileHubShell bubble={bubble}>
      <div className="min-h-[60vh] bg-background">
        <div className={`mx-auto ${maxWidthClassName} px-4 py-6 sm:py-8`}>
          {children}
        </div>
      </div>
    </DnaMobileHubShell>
  );
}

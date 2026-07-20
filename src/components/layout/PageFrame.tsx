/**
 * PageFrame — one wrapper for a surface that is both a route AND a drawer panel.
 *
 * DR2 step 1 made `SettingsLayout` panel-aware and that covered seven of the
 * eight Account panels. The eighth, `ProfileEdit`, does not use `SettingsLayout`
 * — it builds its own page frame — so the audit's file-by-file read never
 * reached it. The chrome-in-panel gate found it on its first run, which is the
 * whole argument for a gate over a sweep: a sweep finds what it went looking
 * for, and this was the sibling nobody knew to look for.
 *
 * The defect was live and it was on the most-tapped row in the drawer: the
 * identity card at the top of Account opens Profile, and Profile was rendering
 * `<UnifiedHeader />` and a full-viewport frame inside a 448px panel.
 *
 * On a route this renders exactly what those pages rendered before. In a
 * drawer panel it renders content only, because the shell already owns the
 * header, the back control, the close, the scroll container and the safe-area
 * inset (BD135 rule 5).
 *
 * `useIdentitySheetSafe()` is the detector. It returns null outside a sheet,
 * and the only live provider of that context is `DrawerIdentityShim`, which
 * wraps drawer panels and nothing else.
 */

import * as React from 'react';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useIdentitySheetSafe } from '@/components/ui/settings-kit';
import { cn } from '@/lib/utils';

interface PageFrameProps {
  children: React.ReactNode;
  /**
   * Centred single-message states: loading, error, signed-out, not-found.
   * On a route these fill the viewport; in a panel they sit in the panel.
   */
  centered?: boolean;
  className?: string;
}

export function PageFrame({ children, centered = false, className }: PageFrameProps) {
  const inPanel = useIdentitySheetSafe() !== null;

  if (inPanel) {
    return (
      <div
        className={cn(
          'p-4',
          centered && 'flex flex-col items-center justify-center gap-4 py-16',
          className,
        )}
      >
        {children}
      </div>
    );
  }

  if (centered) {
    return (
      <div className={cn('flex min-h-screen flex-col items-center justify-center gap-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <UnifiedHeader />
      {children}
    </div>
  );
}

export default PageFrame;

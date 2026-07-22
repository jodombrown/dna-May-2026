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
  /**
   * Route-only navigation. A Back-to-Feed control, a breadcrumb, anything whose
   * job is to move the user out of this surface.
   *
   * Dropped entirely in a panel, because the shell already owns leaving: it has
   * a back chevron and a close. Founder QA caught this exact duplication after
   * DR2 shipped — the panel header read "Profile" and a second "Back to Feed"
   * row sat directly beneath it. Suppressing the app header was not enough;
   * page-level navigation is chrome too.
   */
  pageNav?: React.ReactNode;
  /**
   * Actions on the surface itself: Save, Publish, Delete. Always rendered.
   * These are the content's own controls, not a way out of it, so a panel needs
   * them exactly as much as a route does. Keeping them in a separate slot from
   * `pageNav` is what lets the frame drop one without dropping the other — they
   * were previously siblings in one flex row, which is why the first fix took
   * the header and left the nav.
   */
  actions?: React.ReactNode;
  /**
   * Page-width container on routes. In a panel the shell sets the width, so a
   * `container max-w-4xl mx-auto` inside 448px is competing with it.
   */
  contained?: boolean;
  className?: string;
}

export function PageFrame({
  children,
  centered = false,
  pageNav,
  actions,
  contained = false,
  className,
}: PageFrameProps) {
  const inPanel = useIdentitySheetSafe() !== null;

  // One row, two slots. `pageNav` is route-only; `actions` always renders.
  // Justification flips so a lone action stays right-aligned in a panel.
  const controls =
    pageNav || actions ? (
      <div className={cn('mb-4 flex items-center', inPanel ? 'justify-end' : 'justify-between')}>
        {!inPanel && pageNav}
        {actions}
      </div>
    ) : null;

  if (inPanel) {
    return (
      <div
        className={cn(
          'p-4',
          centered && 'flex flex-col items-center justify-center gap-4 py-16',
          className,
        )}
      >
        {controls}
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
      <div className={cn(contained && 'container mx-auto max-w-4xl px-4 py-8')}>
        {controls}
        {children}
      </div>
    </div>
  );
}

export default PageFrame;

/**
 * FeedColumn — the center feed column shell.
 *
 * Owns the feed column's width ceiling so the page file (`src/pages/dna/Feed.tsx`)
 * carries no page-level layout value — per the design system, width belongs to a
 * shell, not the page call site. Mobile fills the viewport; tablet and desktop cap
 * at `max-w-feed` (560px) and center. This ceiling is the lever that prevents media
 * elongation on wide viewports (BD176).
 *
 * The scroll wiring (`ref`, `data-scroll-container="main"`) lives here so
 * `useScrollDirection` and `ScrollToTop` keep resolving the same element.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FeedColumnProps {
  children: React.ReactNode;
  className?: string;
}

export const FeedColumn = React.forwardRef<HTMLElement, FeedColumnProps>(
  ({ children, className }, ref) => (
    <main
      ref={ref}
      className={cn(
        'min-w-0 flex-1 overflow-y-auto scrollbar-thin',
        'max-w-feed mx-auto w-full',
        className
      )}
      data-scroll-container="main"
    >
      {children}
    </main>
  )
);

FeedColumn.displayName = 'FeedColumn';

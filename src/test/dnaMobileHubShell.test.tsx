/**
 * DnaMobileHubShell snapshot + structural regression test.
 *
 * Locks in the shared mobile chrome for /dna/* hubs:
 *  - fixed top-0 header container (z-50, bg-background)
 *  - collapsible top bar row (hide-on-scroll target)
 *  - optional always-visible tabs row directly beneath the top bar
 *  - MobileBottomNav mounted by default; suppressed when showBottomNav={false}
 *  - min-h-screen + pb-bottom-nav content wrapper
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({ isMobile: true }),
}));

vi.mock('@/hooks/useMobileHeaderHeight', () => ({
  useMobileHeaderHeight: () => 96,
}));

vi.mock('@/hooks/useScrollDirection', () => ({
  useScrollDirection: () => ({ isScrollingDown: false, isAtTop: true }),
}));

vi.mock('@/components/mobile/DnaMobileHeader', () => ({
  DnaMobileHeader: ({ bubble }: { bubble: { kind: string; placeholder?: string } }) => (
    <div data-testid="dna-mobile-header" data-bubble={bubble.kind}>
      {bubble.label ?? ''}
    </div>
  ),
}));

vi.mock('@/components/mobile/MobileBottomNav', () => ({
  __esModule: true,
  default: () => <nav data-testid="mobile-bottom-nav" />,
}));

import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';

describe('DnaMobileHubShell', () => {
  it('renders the canonical fixed top bar, tabs slot, content, and bottom nav', () => {
    const { container, getByTestId, getByText } = render(
      <DnaMobileHubShell
        bubble={{ kind: 'static', placeholder: 'Discover' }}
        tabs={<div data-testid="hub-tabs">Tabs</div>}
      >
        <main>Body</main>
      </DnaMobileHubShell>,
    );

    // Header + tabs + bottom nav all present.
    expect(getByTestId('dna-mobile-header')).toBeInTheDocument();
    expect(getByTestId('hub-tabs')).toBeInTheDocument();
    expect(getByTestId('mobile-bottom-nav')).toBeInTheDocument();
    expect(getByText('Body')).toBeInTheDocument();

    // Fixed header wrapper carries the expected chrome classes.
    const fixed = container.querySelector('div.fixed.top-0.left-0.right-0.z-50');
    expect(fixed).not.toBeNull();

    // Outer scroll container reserves bottom-nav space and clips overflow-x.
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toMatch(/min-h-screen/);
    expect(outer.className).toMatch(/pb-bottom-nav/);
    expect(outer.className).toMatch(/overflow-x-hidden/);

    // Snapshot the whole tree so future JSX/layout changes are surfaced.
    expect(container).toMatchSnapshot();
  });

  it('omits MobileBottomNav when showBottomNav is false', () => {
    const { queryByTestId } = render(
      <DnaMobileHubShell bubble={{ kind: 'static', placeholder: 'X' }} showBottomNav={false}>
        <div />
      </DnaMobileHubShell>,
    );
    expect(queryByTestId('mobile-bottom-nav')).toBeNull();
  });
});

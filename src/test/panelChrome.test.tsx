/**
 * Panel-aware layouts, tested by rendering them (BD109).
 *
 * DR2 step 1 stops seven settings pages and `ProfileEdit` from rendering a full
 * page inside a 448px drawer panel. `check-panel-chrome.ts` proves statically
 * that no panel REACHES chrome that is not panel-aware. It cannot prove that
 * the branch does the right thing when it runs, and a read of the code is not a
 * test of the code.
 *
 * So this mounts both layouts in both contexts. Route context must still render
 * the header — half of a chrome fix is a chrome regression, which is exactly
 * what BD142 was.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as React from 'react';
import { IdentitySheetContext } from '@/components/ui/settings-kit';
import { PageFrame } from '@/components/layout/PageFrame';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

/**
 * `UnifiedHeader` is stubbed, not provider-wrapped.
 *
 * The real one needs the auth context and a query client, and building that
 * tree here would make this test about provider plumbing rather than about the
 * invariant. The invariant is whether the layout RENDERS a header at all, and a
 * stub answers that exactly.
 *
 * Worth noting what the first run showed before the stub existed: the
 * panel-context cases passed while the route cases threw for want of an auth
 * provider. That is incidental proof that in a panel the header component is
 * never constructed, not merely hidden.
 */
vi.mock('@/components/UnifiedHeader', () => ({
  default: () => <header data-testid="app-header">app header</header>,
}));

/** The contract `DrawerIdentityShim` supplies. Presence of it IS panel context. */
const panelContext = { push: () => {}, pop: () => {}, close: () => {} };

function renderOnRoute(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

function renderInPanel(node: React.ReactNode) {
  return render(
    <MemoryRouter>
      <IdentitySheetContext.Provider value={panelContext}>{node}</IdentitySheetContext.Provider>
    </MemoryRouter>,
  );
}

/**
 * The app header renders a banner landmark. Asserting on the landmark rather
 * than on a class or a component name keeps this behavioural: it fails if the
 * header renders, however it is spelled.
 */
const headerCount = (c: { container: HTMLElement }) =>
  c.container.querySelectorAll('header').length;

describe('PageFrame', () => {
  it('renders its content in both contexts (guards the assertions below)', () => {
    // If the child never rendered, every chrome assertion would pass vacuously.
    renderOnRoute(<PageFrame><p>profile form</p></PageFrame>);
    expect(screen.getByText('profile form')).toBeTruthy();
    screen.getByText('profile form').remove();

    renderInPanel(<PageFrame><p>profile form</p></PageFrame>);
    expect(screen.getByText('profile form')).toBeTruthy();
  });

  it('renders no chrome inside a drawer panel', () => {
    const c = renderInPanel(<PageFrame><p>content</p></PageFrame>);
    expect(headerCount(c)).toBe(0);
    // A panel is not a page: no full-viewport frame either.
    expect(c.container.querySelector('.min-h-screen')).toBeNull();
  });

  it('still renders the app header on a route', () => {
    const c = renderOnRoute(<PageFrame><p>content</p></PageFrame>);
    expect(headerCount(c)).toBeGreaterThan(0);
  });

  it('a centred state fills the viewport on a route and not in a panel', () => {
    const onRoute = renderOnRoute(<PageFrame centered><p>loading</p></PageFrame>);
    expect(onRoute.container.querySelector('.min-h-screen')).not.toBeNull();

    const inPanel = renderInPanel(<PageFrame centered><p>loading</p></PageFrame>);
    expect(inPanel.container.querySelector('.min-h-screen')).toBeNull();
  });
});

describe('SettingsLayout', () => {
  it('renders its content in both contexts (guards the assertions below)', () => {
    renderOnRoute(<SettingsLayout title="Privacy"><p>privacy form</p></SettingsLayout>);
    expect(screen.getByText('privacy form')).toBeTruthy();
    screen.getByText('privacy form').remove();

    renderInPanel(<SettingsLayout title="Privacy"><p>privacy form</p></SettingsLayout>);
    expect(screen.getByText('privacy form')).toBeTruthy();
  });

  it('renders no chrome inside a drawer panel', () => {
    const c = renderInPanel(<SettingsLayout title="Privacy"><p>content</p></SettingsLayout>);
    expect(headerCount(c)).toBe(0);
    expect(c.container.querySelector('.min-h-screen')).toBeNull();
    // The seven-item sidebar and the Back-to-Feed button are chrome too. The
    // shell's header owns back; a second one inside the panel is the DR0 defect
    // class all over again.
    expect(c.container.querySelector('nav')).toBeNull();
    expect(screen.queryByText('Back to Feed')).toBeNull();
  });

  it('still renders header, sidebar and title on a route', () => {
    const c = renderOnRoute(<SettingsLayout title="Privacy"><p>content</p></SettingsLayout>);
    expect(headerCount(c)).toBeGreaterThan(0);
    expect(c.container.querySelector('nav')).not.toBeNull();
    expect(screen.getAllByText('Privacy').length).toBeGreaterThan(0);
  });
});

/**
 * AppDrawer shell + route binding (DR1 steps 2 and 4).
 *
 * The route-binding tests are the ones that matter most: DR0 finding 1 was that
 * ZERO of the 28 live sliding containers bound to a URL, so browser back closed
 * nothing, nothing was deep-linkable and nothing survived a refresh. These
 * assert the capability exists rather than that it was intended.
 */

import * as React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { click, tab, pressEscape } from '@/test/helpers/interact';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppDrawer } from '@/components/drawer/AppDrawer';
import { DrawerProvider, useDrawer, type DrawerResolvers } from '@/contexts/DrawerContext';
import { parseStack, serializeStack, stackDepth } from '@/components/drawer/stackUrl';

function forceDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
}

/**
 * Controls live INSIDE the surface content. Once a modal surface is open the
 * background is inert, which is the focus trap doing its job — an earlier draft
 * put them outside and failed with `pointer-events: none`. The shell was right
 * and the test was wrong.
 */
function AccountRoot() {
  const { pushPanel, swapToSurface } = useDrawer();
  return (
    <div>
      <p>account-root</p>
      <button type="button" onClick={() => pushPanel('privacy')}>push-privacy</button>
      <button type="button" onClick={() => swapToSurface('feedback')}>swap-feedback</button>
    </div>
  );
}

const resolvers: DrawerResolvers = {
  surface: (id) => {
    if (id === 'account') return { title: 'Account', node: <AccountRoot /> };
    if (id === 'feedback') return { title: 'Feedback', node: <p>feedback-root</p> };
    return null;
  },
  panel: (surfaceId, panelId) => {
    if (surfaceId === 'account' && panelId === 'privacy')
      return { title: 'Privacy', node: <p>privacy-panel</p> };
    return null;
  },
};

/** Surfaces the live URL so assertions read the real thing, not our state. */
function UrlProbe() {
  const loc = useLocation();
  return <output data-testid="url">{loc.search}</output>;
}

function Opener() {
  const { openSurface } = useDrawer();
  return <button type="button" onClick={() => openSurface('account')}>open-account</button>;
}

function Harness({ initialEntries = ['/dna/feed'] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <DrawerProvider resolvers={resolvers}>
        <UrlProbe />
        <Opener />
        <AppDrawer />
      </DrawerProvider>
    </MemoryRouter>
  );
}

const url = () => screen.getByTestId('url').textContent;

describe('stack serialization', () => {
  it('round-trips surfaces and panels', () => {
    const stack = [
      { surfaceId: 'account', panelIds: ['privacy'] },
      { surfaceId: 'feedback', panelIds: [] },
    ];
    expect(serializeStack(stack)).toBe('account.privacy*feedback');
    expect(parseStack('account.privacy*feedback')).toEqual(stack);
    expect(stackDepth(stack)).toBe(3);
  });

  it('separators survive URLSearchParams encoding — the guard for the ~ bug', () => {
    // The first draft used `~`, which form-urlencodes to %7E and produced
    // `?drawer=account%7Efeedback`. Correct, unshareable, and caught here.
    const serialized = serializeStack([
      { surfaceId: 'account', panelIds: ['privacy'] },
      { surfaceId: 'feedback', panelIds: [] },
    ]);
    const params = new URLSearchParams();
    params.set('drawer', serialized);
    expect(params.toString()).toBe(`drawer=${serialized}`);
    expect(params.toString()).not.toContain('%');
  });

  it('degrades a malformed value to the best valid prefix rather than throwing', () => {
    expect(parseStack('**account..privacy*')).toEqual([
      { surfaceId: 'account', panelIds: ['privacy'] },
    ]);
    expect(parseStack('')).toEqual([]);
    expect(parseStack(null)).toEqual([]);
  });
});

describe('AppDrawer shell', () => {
  beforeEach(forceDesktopViewport);

  it('renders nothing when no surface is active', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  it('renders one shared header, and no Back at the root of a surface', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));

    expect(await screen.findByText('account-root')).toBeInTheDocument();
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.queryByLabelText('Back')).toBeNull();
  });

  it('swap suspends the origin surface rather than nesting inside it', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    click(await screen.findByText('swap-feedback'));

    expect(await screen.findByText('feedback-root')).toBeInTheDocument();
    expect(screen.queryByText('account-root')).toBeNull();
    // One shell, one header, one close control. Surfaces never nest.
    expect(screen.getAllByLabelText('Close')).toHaveLength(1);
  });

  it('renders nothing for an unknown id instead of a placeholder panel', () => {
    render(<Harness initialEntries={['/dna/feed?drawer=does-not-exist']} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('route binding — the capability that did not exist before DR1', () => {
  beforeEach(forceDesktopViewport);

  it('opening a surface writes it to the URL', async () => {
    render(<Harness />);
    expect(url()).toBe('');

    click(screen.getByText('open-account'));
    await waitFor(() => expect(url()).toBe('?drawer=account'));
  });

  it('pushing a panel extends the URL and reveals Back', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    click(await screen.findByText('push-privacy'));

    await waitFor(() => expect(url()).toBe('?drawer=account.privacy'));
    expect(await screen.findByText('privacy-panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  it('a deep link opens the drawer directly on the right panel (survives refresh)', async () => {
    render(<Harness initialEntries={['/dna/feed?drawer=account.privacy']} />);
    expect(await screen.findByText('privacy-panel')).toBeInTheDocument();
    // Depth is 2, so the shared header offers Back without any per-surface flag.
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  it('Back is browser back: it pops one level and restores the previous URL', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    click(await screen.findByText('push-privacy'));
    await waitFor(() => expect(url()).toBe('?drawer=account.privacy'));

    click(screen.getByLabelText('Back'));

    await waitFor(() => expect(url()).toBe('?drawer=account'));
    expect(await screen.findByText('account-root')).toBeInTheDocument();
    expect(screen.queryByLabelText('Back')).toBeNull();
  });

  it('Back out of a swapped surface restores the suspended origin', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    click(await screen.findByText('swap-feedback'));
    await waitFor(() => expect(url()).toBe('?drawer=account*feedback'));

    click(screen.getByLabelText('Back'));

    await waitFor(() => expect(url()).toBe('?drawer=account'));
    expect(await screen.findByText('account-root')).toBeInTheDocument();
  });

  it('the page underneath is preserved, not replaced', async () => {
    render(<Harness initialEntries={['/dna/feed?tab=my_posts']} />);
    click(screen.getByText('open-account'));

    await waitFor(() => {
      // The existing param survives. A drawer is an overlay on a page, not a page.
      expect(url()).toContain('tab=my_posts');
      expect(url()).toContain('drawer=account');
    });
  });

  it('close clears the drawer param entirely', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    click(await screen.findByText('push-privacy'));
    click(screen.getByLabelText('Close'));

    await waitFor(() => expect(url()).not.toContain('drawer='));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

/**
 * Per-surface width (DR1 hotfix).
 *
 * Founder QA caught this, not the suite: the composer set its own 860px before
 * DR1, that width lived in the chrome the shell correctly took over, and the
 * shell then imposed one 448px on everything. The composer lost 48% of its
 * writing surface and became unusable for its actual purpose.
 *
 * A behavioural test could not have caught it — every assertion passed, the
 * drawer opened, the composer rendered, the post would have published. It was
 * only wrong to a human trying to write in it.
 */
describe('per-surface width', () => {
  beforeEach(forceDesktopViewport);

  const widthResolvers: DrawerResolvers = {
    surface: (id) => {
      if (id === 'wide') return { title: 'Wide', node: <p>wide-surface</p>, width: 'wide' };
      if (id === 'standard') return { title: 'Standard', node: <p>standard-surface</p> };
      return null;
    },
    panel: () => null,
  };

  function widthHarness(entry: string) {
    return (
      <MemoryRouter initialEntries={[entry]}>
        <DrawerProvider resolvers={widthResolvers}>
          <AppDrawer />
        </DrawerProvider>
      </MemoryRouter>
    );
  }

  it('a composing surface gets the wide token', async () => {
    render(widthHarness('/dna/feed?drawer=wide'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.className).toContain('max-w-drawer-wide');
    expect(dialog.className).not.toContain('max-w-drawer ');
  });

  it('a surface that asks for nothing gets the standard token', async () => {
    render(widthHarness('/dna/feed?drawer=standard'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.className).toContain('max-w-drawer');
    expect(dialog.className).not.toContain('max-w-drawer-wide');
  });

  it('both widths are real tokens in tailwind.config.ts, not arbitrary values', () => {
    const config = readFileSync(resolve(__dirname, '../../tailwind.config.ts'), 'utf8');
    expect(config).toMatch(/drawer:\s*'28rem'/);
    expect(config).toMatch(/'drawer-wide':\s*'860px'/);
  });
});

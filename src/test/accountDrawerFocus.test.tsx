/**
 * BD136 — the desktop half of DR0's focusable-background gate.
 *
 * ── Provenance, which matters more than the green ─────────────────────────
 * These four assertions were written at DR1 step 1 against the PRE-DR1 Account
 * drawer (`IdentitySheet`'s desktop branch) and observed FAILING, all four, for
 * the reasons DR0 predicted. That red run is recorded verbatim on the DR1
 * session row. This is BD121's "dirty" half and it cannot be reconstructed now.
 *
 * At step 6 the Account drawer moved onto `AppDrawer`, so the SUBJECT of these
 * assertions moved with it. That is deliberate and it is the honest reading:
 * the claim under test is "the Account drawer traps focus on desktop", not
 * "IdentitySheet traps focus". A gate that went green because its subject was
 * deleted would certify nothing, so these render the drawer as it now exists
 * rather than the component that used to implement it.
 *
 * Pre-DR1 failure causes, for the record:
 *   1. no focus trap     — the panel was a bespoke <div>, not a Radix Dialog
 *   2. no dismiss target — the dim was pointer-events-none with no handler
 *   3a. no focus entry   — nothing autofocused the panel (DR0 missed this)
 *   3b. no focus restore — nothing captured or returned the trigger
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { click, tab, pressEscape } from '@/test/helpers/interact';
import { MemoryRouter } from 'react-router-dom';
import { AppDrawer } from '@/components/drawer/AppDrawer';
import { DrawerProvider, useDrawer, type DrawerResolvers } from '@/contexts/DrawerContext';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function forceDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
}

/** Stands in for the Account surface's rows. Content only, no chrome. */
function AccountRows() {
  return (
    <div>
      <button type="button">panel-first</button>
      <button type="button">panel-last</button>
    </div>
  );
}

const resolvers: DrawerResolvers = {
  surface: (id) => (id === 'account' ? { title: 'Account', node: <AccountRows /> } : null),
  panel: () => null,
};

/** The app behind the drawer. Its controls must be unreachable while open. */
function Harness() {
  return (
    <MemoryRouter initialEntries={['/dna/feed']}>
      <DrawerProvider resolvers={resolvers}>
        <Opener />
        <div>
          <button type="button">background-before</button>
          <a href="/dna/feed">background-link</a>
          <button type="button">background-after</button>
        </div>
        <AppDrawer />
      </DrawerProvider>
    </MemoryRouter>
  );
}

function Opener() {
  const { openSurface } = useDrawer();
  return (
    <button type="button" onClick={() => openSurface('account')}>
      open-account
    </button>
  );
}

describe('BD136 — Account drawer, desktop branch, focus and dismissal', () => {
  beforeEach(forceDesktopViewport);

  it('1. traps focus: tabbing past the last control does not reach the app behind', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));

    const dialog = await screen.findByRole('dialog');
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(focusables.length).toBeGreaterThan(0);

    focusables[focusables.length - 1].focus();
    expect(dialog.contains(document.activeElement)).toBe(true);

    tab();

    // With a trap, focus wraps inside the panel. Without one, it walks into the
    // page behind — which is exactly what it did before DR1.
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('2. the scrim is a dismiss target: clicking it closes the drawer', async () => {
    render(<Harness />);
    click(screen.getByText('open-account'));
    await screen.findByRole('dialog');

    // vaul renders the overlay as a sibling of the content, marked aria-hidden.
    const scrim = document.querySelector('[data-vaul-overlay]') as HTMLElement | null;
    expect(scrim, 'a scrim must exist at all — pre-DR1 desktop had none').not.toBeNull();

    fireEvent.pointerDown(scrim as HTMLElement);
    fireEvent.click(scrim as HTMLElement);

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('3a. moves focus into the panel when the drawer opens', async () => {
    render(<Harness />);

    const trigger = screen.getByText('open-account');
    click(trigger);

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(document.activeElement).not.toBe(trigger);
  });

  it('3b. restores focus to the trigger when the drawer closes', async () => {
    render(<Harness />);

    const trigger = screen.getByText('open-account');
    click(trigger);
    const dialog = await screen.findByRole('dialog');

    // Guard against a false green: restore is only meaningful if focus moved.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    pressEscape();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

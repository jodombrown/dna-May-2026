/**
 * Minimal interaction helpers for tests.
 *
 * ── Why these exist instead of @testing-library/user-event ────────────────
 * Adding user-event as a dependency changed `package.json`, and CI installs
 * with `bun install --frozen-lockfile` against a `bun.lock` that pins packages
 * to a private registry. Any new dependency therefore requires regenerating a
 * lockfile that only Lovable's registry can resolve — so a two-line test
 * convenience turned into a hard merge blocker with no route around it.
 *
 * These three helpers cover everything the drawer tests actually used: click,
 * Tab, and Escape. No dependency, no lockfile change, no blocker.
 *
 * ── One honest difference from user-event ─────────────────────────────────
 * user-event refuses to click an element with `pointer-events: none`, which is
 * how the shell's focus trap was first observed working (a background button
 * behind an open modal drawer became unclickable). `click()` here does not
 * enforce that, so it is NOT a substitute for asserting inertness. The trap is
 * asserted directly and behaviourally in `accountDrawerFocus.test.tsx` test 1,
 * which is the stronger check anyway.
 */

import { fireEvent } from '@testing-library/react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Click, and focus first — a real pointer click focuses the target. */
export function click(el: HTMLElement) {
  if (typeof el.focus === 'function') el.focus();
  fireEvent.click(el);
}

/**
 * Move focus to the next focusable element in document order, the way a
 * browser's default Tab does.
 *
 * jsdom does not implement Tab, so focus is moved manually and the keydown is
 * dispatched as well. That ordering matters: a focus trap works by pulling
 * focus back after it moves, so moving focus first is what gives the trap
 * something to react to. A test that only dispatched the key would assert
 * nothing.
 */
export function tab(options: { shift?: boolean } = {}) {
  const active = document.activeElement as HTMLElement | null;
  fireEvent.keyDown(active ?? document.body, {
    key: 'Tab',
    code: 'Tab',
    shiftKey: !!options.shift,
  });

  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement || true,
  );
  if (all.length === 0) return;

  const idx = active ? all.indexOf(active) : -1;
  const nextIdx = options.shift
    ? (idx <= 0 ? all.length - 1 : idx - 1)
    : (idx === -1 || idx === all.length - 1 ? 0 : idx + 1);

  all[nextIdx]?.focus();
}

/** Escape, dispatched where a real key event would land. */
export function pressEscape() {
  fireEvent.keyDown(document.activeElement ?? document, { key: 'Escape', code: 'Escape' });
  fireEvent.keyUp(document.activeElement ?? document, { key: 'Escape', code: 'Escape' });
}

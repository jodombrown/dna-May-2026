/**
 * App-chrome safe-area gate (BD157, extending BD110).
 *
 * BD110 already requires every route to render the standard chrome. This adds
 * the clause the founder's device found the hard way: the chrome must apply the
 * TOP safe-area inset.
 *
 * ── Why this needs a gate rather than a fix ────────────────────────────────
 * The defect is invisible in every environment a developer works in. It only
 * appears in the INSTALLED PWA, where `display: standalone` removes the browser
 * chrome and `viewport-fit=cover` hands the notch strip to the page. In a
 * Safari tab the browser's own UI occupies that strip, so the header looks
 * correct and the avatar is reachable. It survived DR0, DR1 and DR2 for exactly
 * that reason, and it will regress the same way unless something checks.
 *
 * ── Why a source read and not a render ────────────────────────────────────
 * jsdom has no notion of `env(safe-area-inset-top)` and no viewport insets to
 * resolve it against, so a rendered assertion would pass on an empty string and
 * certify nothing — the vacuous-green failure mode BD141 names. Reading the
 * source for the declaration is the honest instrument at this layer. The real
 * certification is founder QA in the installed PWA in portrait, named as a step
 * inside the cycle.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

/** Comments are prose, not code. Four times this cycle a matcher matched prose. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const TOP_INSET = 'env(safe-area-inset-top';

describe('BD157 — the shared mobile chrome applies the top safe-area inset', () => {
  const shell = strip(read('src/components/mobile/DnaMobileHubShell.tsx'));

  it('the fixed header container declares the inset', () => {
    expect(shell).toContain(TOP_INSET);
  });

  it('the pre-measurement fallback carries it too', () => {
    // The frame before ResizeObserver reports is still a frame a member sees.
    expect(shell).toMatch(/paddingTop:\s*headerPadding\s*\|\|[^,\n]*env\(safe-area-inset-top/);
  });

  /**
   * DIRTY INPUT (BD121). A gate observed only against clean input can be
   * inverted and still look correct. This is the shell exactly as it stood on
   * main before DR3: a fixed top-0 container with no inset.
   */
  it('REJECTS a chrome container with no inset (main before DR3)', () => {
    const asShipped = `<div ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-background">`;
    expect(asShipped).not.toContain(TOP_INSET);
  });

  it('guards the matcher itself', () => {
    // A read that returned nothing would make every assertion above vacuous.
    expect(shell.length).toBeGreaterThan(500);
  });
});

/**
 * BD145 one layer over: a CSS class existing is not evidence anything uses it.
 *
 * `.safe-area-pt` sat in `index.css` with ZERO consumers while the defect it
 * was written to prevent was live in production. This asserts the shape of that
 * lesson: if the class is going to exist, something has to consume it, or the
 * inset has to be declared directly where it is needed. Either satisfies the
 * member; neither is satisfied by a definition alone.
 */
describe('BD157 — the top inset reaches the DOM, not just the stylesheet', () => {
  it('the inset is declared somewhere the chrome actually renders', () => {
    const shell = strip(read('src/components/mobile/DnaMobileHubShell.tsx'));
    const css = read('src/index.css');

    const definedInCss = css.includes('.safe-area-pt');
    const appliedInChrome = shell.includes(TOP_INSET) || shell.includes('safe-area-pt');

    // The definition may or may not survive. The application must.
    expect(
      appliedInChrome,
      definedInCss
        ? '.safe-area-pt is defined in index.css but the chrome applies no top inset — the DR3 defect, exactly'
        : 'the chrome applies no top inset',
    ).toBe(true);
  });
});

/**
 * BD158 — the landscape gate must never catch a desktop.
 *
 * A bare `(orientation: landscape)` matches every desktop monitor on earth.
 * The height bound is the entire safety property, so it is asserted rather than
 * trusted to survive a future edit.
 */
describe('BD158 — the landscape gate is scoped to phones', () => {
  const gate = strip(read('src/components/mobile/LandscapeGate.tsx'));

  it('binds orientation to a phone-sized height', () => {
    expect(gate).toMatch(/\(orientation:\s*landscape\)\s*and\s*\(max-height:\s*\d+px\)/);
  });

  it('never queries orientation alone', () => {
    const bare = gate.match(/'\(orientation:\s*landscape\)'/);
    expect(bare, 'an unscoped orientation query would blur the app for every desktop member').toBeNull();
  });

  it('is dismissible (WCAG 2.1 SC 1.3.4)', () => {
    expect(gate).toContain('Continue anyway');
  });
});

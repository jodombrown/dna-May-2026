/**
 * App-chrome safe-area gate (BD157, extending BD110).
 *
 * ── Why this ENUMERATES rather than names ─────────────────────────────────
 * The first version of this gate asserted one file, `DnaMobileHubShell`, and
 * went green while the defect stayed live on the Feed, which is the busiest
 * surface in the app and the one the founder photographed. A gate that names
 * its subject can only ever certify the site someone already found.
 *
 * So this walks `src/` instead. It finds every fixed chrome container and
 * requires each to declare the inset for the edge it is pinned to. When a
 * twelfth container is added next month it fails on arrival rather than
 * shipping a strip of unreachable controls to whoever installs the PWA.
 *
 * The first run of this scan found ELEVEN containers. Two had an inset.
 *
 * ── Why the defect is invisible without it ────────────────────────────────
 * `index.html` sets `viewport-fit=cover` and `manifest.json` sets
 * `display: standalone`, so in the INSTALLED PWA these containers own the strip
 * under the notch and the strip above the home indicator. In a browser tab the
 * browser's own UI occupies both, so everything looks correct. No developer
 * environment reproduces it. That is why it survived DR0, DR1 and DR2.
 *
 * ── Why a source read ─────────────────────────────────────────────────────
 * jsdom has no viewport insets and cannot resolve `env()`, so a rendered
 * assertion would pass on an empty string and certify nothing (BD141's vacuous
 * green). Reading source is the honest instrument at this layer. The real
 * certification is founder QA in the installed PWA, in portrait, named as a
 * step inside the cycle.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const repoRoot = resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

/** Comments are prose, not code. Prose has matched code patterns repeatedly in this series. */
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * The safe-area classes `index.css` ACTUALLY defines.
 *
 * Read from the stylesheet, never hardcoded. `pb-safe`, `pb-bottom-nav` and
 * `min-h-touch` were all live in this codebase and all rendered nothing,
 * because `tailwind.config.ts` declares no spacing, padding, minHeight or
 * zIndex scale. A class name is a claim; the stylesheet is the fact (BD145).
 */
const definedSafeAreaClasses = new Set(
  Array.from(read('src/index.css').matchAll(/\.(safe-area-[a-z-]+)\s*\{/g)).map((m) => m[1]),
);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(repoRoot, dir))) {
    if (entry === '_archived' || entry === '__snapshots__' || entry === 'node_modules') continue;
    const rel = join(dir, entry);
    if (statSync(join(repoRoot, rel)).isDirectory()) walk(rel, out);
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx') && !rel.includes('/test/')) {
      out.push(rel);
    }
  }
  return out;
}

interface Container {
  file: string;
  edges: Array<'top' | 'bottom'>;
  body: string;
}

function findChromeContainers(): Container[] {
  const out: Container[] = [];
  for (const file of walk('src')) {
    const body = strip(read(file));
    const edges: Array<'top' | 'bottom'> = [];
    if (body.includes('fixed top-0')) edges.push('top');
    if (body.includes('fixed bottom-0')) edges.push('bottom');
    if (edges.length) out.push({ file, edges, body });
  }
  return out;
}

/** Does this file declare the inset for that edge, by any mechanism that exists? */
function declaresInset(body: string, edge: 'top' | 'bottom'): boolean {
  if (body.includes(`env(safe-area-inset-${edge}`)) return true;
  for (const cls of definedSafeAreaClasses) {
    if (cls.includes(edge) && body.includes(cls)) return true;
  }
  return false;
}

describe('BD157 — every fixed chrome container declares its safe-area inset', () => {
  const containers = findChromeContainers();

  it('the scan finds containers at all (guards the matcher)', () => {
    // A walk that returned nothing would make every assertion below vacuous.
    expect(containers.length).toBeGreaterThan(8);
  });

  it('no container is pinned to an edge it does not inset', () => {
    const violations = containers.flatMap((c) =>
      c.edges
        .filter((edge) => !declaresInset(c.body, edge))
        .map((edge) => `${c.file} is fixed to ${edge} with no ${edge} inset`),
    );
    expect(violations).toEqual([]);
  });

  /**
   * DIRTY INPUT (BD121). A gate observed only against clean input can be
   * inverted and still look correct. This is `Feed.tsx` exactly as it stood
   * before DR3: the container in the founder's screenshot.
   */
  it('REJECTS a top-pinned container with no inset (Feed before DR3)', () => {
    const asShipped = `<div ref={mobileHeaderRef} className="fixed top-0 left-0 right-0" style={{ zIndex: 50 }}>`;
    expect(declaresInset(asShipped, 'top')).toBe(false);
  });

  it('REJECTS a bottom-pinned container relying on a phantom class', () => {
    // `pb-safe` looks like it handles this. It is not defined anywhere.
    const asShipped = `<div className="flex justify-around items-center h-16 px-2 pb-safe">`;
    expect(declaresInset(asShipped, 'bottom')).toBe(false);
  });

  it('ACCEPTS a container using a class index.css actually defines', () => {
    const [anyDefined] = [...definedSafeAreaClasses].filter((c) => c.includes('bottom'));
    expect(anyDefined, 'index.css defines no bottom safe-area class').toBeTruthy();
    expect(declaresInset(`<nav className="fixed bottom-0 ${anyDefined}">`, 'bottom')).toBe(true);
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
    expect(
      gate.match(/'\(orientation:\s*landscape\)'/),
      'an unscoped orientation query would blur the app for every desktop member',
    ).toBeNull();
  });

  it('is dismissible (WCAG 2.1 SC 1.3.4)', () => {
    expect(gate).toContain('Continue anyway');
  });
});

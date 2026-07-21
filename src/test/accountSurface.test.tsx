/**
 * Account surface panel contract (DR1 step 6).
 *
 * `DrawerIdentityShim` deliberately IGNORES the `node` passed to
 * `push({ id, title, node })` and resolves content from `ACCOUNT_PANELS` by id
 * instead, so that the id in the URL is the source of truth.
 *
 * That is safe only if every id anyone pushes is registered. This is the test
 * that makes it safe: it reads the ids `AccountDrawer` actually pushes and
 * fails if any of them has no panel. Without it, an ignored node becomes a
 * silently blank drawer — and a silently blank panel is exactly the class of
 * failure BD111 refuses.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ACCOUNT_PANELS } from '@/components/drawer/surfaces/AccountSurface';
import { ACCOUNT_SURFACE } from '@/components/drawer/registry';

const repoRoot = resolve(__dirname, '../..');
const accountSource = readFileSync(
  resolve(repoRoot, 'src/components/navigation/AccountDrawer.tsx'),
  'utf8',
);

/**
 * DR2 step 2 moved the ids out of this file and into the registry, so the old
 * source-grep for `push({ id: '...' })` literals now finds nothing and its own
 * self-check fired — which is what a self-check is for.
 *
 * The replacement is stronger than what it replaces: it reads every `push` row
 * in `ACCOUNT_SURFACE` rather than the id literals someone happened to write,
 * so a row added to the registry with no panel behind it fails here instead of
 * opening a blank drawer.
 */
const pushRows = ACCOUNT_SURFACE.rows.filter((r) => r.behaviour.kind === 'push');

/**
 * DR3: the `INLINE_PANEL_IDS` exemption is GONE, and its removal is the point.
 *
 * It exempted `share` on the stated grounds that the surface rendered that
 * panel inline from the live action handlers. That was false the day it was
 * written. `DrawerIdentityShim` ignores the `node` argument and resolves panels
 * BY ID, and `share` was never in `ACCOUNT_PANELS` — so tapping Share profile
 * pushed `?drawer=account.share`, resolved to null, and made the whole drawer
 * vanish. The exemption is why a dead row passed a gate built to catch dead rows.
 *
 * There is no allowlist now. Every push row resolves to registered content or
 * the gate fails. An exemption written in prose is a claim, not a fact
 * (BD111, BD145: read the config, not the doc).
 */

/**
 * `identity-card` is the avatar-and-name card at the top of the surface, not a
 * labelled row. Its registry `label` names the control for the inventory; the
 * member sees their own name there, so it has no copy to keep in step with the
 * panel it opens. Every other push row does.
 */
const NON_ROW_IDS = new Set(['identity-card']);

/**
 * DIRTY INPUT (BD121). The gate above is only certified if it REJECTS the row
 * that shipped. This is `share-profile` exactly as it sat in the registry
 * before DR3 cut it: a push row naming a panel id that no resolver registers.
 * If this test ever goes green, the exemption has come back in another form.
 */
describe('account surface panels — the gate rejects the DR3 defect', () => {
  it('a push row naming an unregistered panel is a violation', () => {
    const shareAsShipped = { id: 'share-profile', panelId: 'share' };
    expect(shareAsShipped.panelId in ACCOUNT_PANELS).toBe(false);
  });

  it('no live registry row still points at it', () => {
    const ids = ACCOUNT_SURFACE.rows.map((r) => r.id);
    expect(ids).not.toContain('share-profile');
  });
});

describe('account surface panels', () => {
  it('finds the push rows (guards the matcher itself)', () => {
    // A selector that found nothing would make every assertion below vacuous.
    expect(pushRows.length).toBeGreaterThan(5);
  });

  it('every registry push row resolves to registered content', () => {
    const unregistered = pushRows
      .map((r) => (r.behaviour as { panelId: string }).panelId)
      .filter((id) => !(id in ACCOUNT_PANELS));
    expect(unregistered).toEqual([]);
  });

  /**
   * The assertion that would have caught the live defect.
   *
   * On main before this cycle, `registry.ts` and `ACCOUNT_PANELS.account` both
   * read "Sign-in and security" while `AccountDrawer.tsx` still rendered a row
   * labelled "Account". The panel header and the row that opened it disagreed,
   * in production, because the copy lived in two places and only one was
   * updated. Now there is one place, and this checks the other end of it.
   */
  it('a panel title equals the label of the row that opens it', () => {
    const mismatched = pushRows
      .filter((r) => !NON_ROW_IDS.has(r.id))
      .map((r) => ({ row: r, panelId: (r.behaviour as { panelId: string }).panelId }))
      .filter(({ panelId }) => panelId in ACCOUNT_PANELS)
      .map(({ row, panelId }) => ({
        row: row.id,
        rowLabel: row.label,
        panelTitle: ACCOUNT_PANELS[panelId]().title,
      }))
      .filter((x) => x.rowLabel !== x.panelTitle);
    expect(mismatched).toEqual([]);
  });

  it('panel titles carry the founder-approved copy lock', () => {
    // `Account` sat confusingly adjacent to both `Profile` and the surface title.
    expect(ACCOUNT_PANELS.account().title).toBe('Sign-in and security');
  });

  /**
   * The surface no longer defines panels of its own. Two definitions of one
   * list is the drift vector BD137 exists to close, and it had already drifted.
   */
  it('the surface declares no panel content — the shell owns it', () => {
    const code = accountSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/React\.lazy\(/);
    expect(code).not.toMatch(/content:\s*wrap\(/);
  });
});

/**
 * Single-mount guards (DR0 defects 5, 6, 7).
 *
 * These assert the SHAPE that made the old bugs possible is gone, not just that
 * the bugs were fixed. A second mount is how they came back last time.
 */
describe('account surface — single mount', () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'node_modules' || entry === '_archived') continue;
        walk(full, out);
      } else if (full.endsWith('.tsx')) out.push(full);
    }
    return out;
  };

  /**
   * Strip comments AND string literals before matching.
   *
   * Third time a source-grep in this cycle matched something that was not code.
   * First it matched a doc comment describing the old mounts; then the comment
   * explaining the chrome removal; then this — `<IdentitySheet />` inside an
   * error message string. A structural gate that reads source will match the
   * prose and the error copy about the thing it is looking for.
   */
  const strip = (s: string) =>
    s
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");

  const files = walk(resolve(repoRoot, 'src')).filter((f) => !f.includes('.test.'));
  /** A component's own definition file is not a mount site. */
  const mountsOf = (component: string) =>
    files
      .filter((f) => !f.endsWith(`/${component}.tsx`))
      .filter((f) => new RegExp(`<${component}[\\s\\n/>]`).test(strip(readFileSync(f, 'utf8'))))
      .map((f) => f.replace(repoRoot + '/', ''));

  it('FeedbackDrawer is mounted exactly once, at app root', () => {
    expect(mountsOf('FeedbackDrawer')).toEqual(['src/contexts/AccountActionsContext.tsx']);
  });

  it('AlphaTestGuide is mounted exactly once, and behind the alpha flag', () => {
    expect(mountsOf('AlphaTestGuide')).toEqual(['src/contexts/AccountActionsContext.tsx']);
    const src = readFileSync(resolve(repoRoot, 'src/contexts/AccountActionsContext.tsx'), 'utf8');
    // DR0 defect 6: the Account-side copy had no gate at all.
    expect(src).toMatch(/FEATURE_FLAGS\.isAlphaTest && user && \(\s*<AlphaTestGuide/);
  });

  it('no surface renders its own IdentitySheet any more (BD135 rule 5)', () => {
    expect(mountsOf('IdentitySheet')).toEqual([]);
  });

  it('the drawer shell is mounted once, at app root and not in a layout', () => {
    expect(mountsOf('AppDrawer')).toEqual(['src/App.tsx']);
  });
});

/**
 * Navigating rows actually navigate (DR1 hotfix 2).
 *
 * Founder QA on a real iPhone: tapping "About DNA" did nothing. Six rows were
 * affected — every row that leaves the drawer.
 *
 * Cause: `go()` was `close(); navigate(path)`. Once the drawer became URL-bound,
 * `close()` became `navigate(-depth)` — a history POP — so a pop and a push
 * fired in the same tick and the pop unwound the push.
 *
 * No test caught it. Every handler fired, every assertion passed, and the app
 * did nothing. This one is structural rather than behavioural because the race
 * needs a real history stack, but it fails loudly if anyone reintroduces the
 * pattern.
 */
describe('navigating rows leave the drawer without racing history', () => {
  const source = readFileSync(
    resolve(repoRoot, 'src/components/navigation/AccountDrawer.tsx'),
    'utf8',
  );

  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('go() does not call close() — the drawer closes because the URL changed', () => {
    const goBody = code.match(/const go = \(path: string\) => \{([\s\S]*?)\};/)?.[1] ?? '';
    expect(goBody, 'go() must exist and be matchable').toContain('navigate(path)');
    expect(goBody, 'close() inside go() races the navigation and cancels it').not.toMatch(
      /close\(\)/,
    );
  });

  it('the rows that leave the drawer all route through go()', () => {
    // Guards against someone "fixing" a row by inlining close() + navigate().
    const inlined = code.match(/close\(\);\s*navigate\(/g) ?? [];
    expect(inlined).toEqual([]);
  });
});

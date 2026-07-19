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

const repoRoot = resolve(__dirname, '../..');
const accountSource = readFileSync(
  resolve(repoRoot, 'src/components/navigation/AccountDrawer.tsx'),
  'utf8',
);

/** Every id pushed via `push({ id: ... })` or `subpage={{ id: ... }}`. */
function pushedIds(src: string): string[] {
  const ids = new Set<string>();
  for (const m of src.matchAll(/(?:push\(\{|subpage=\{\{)\s*id:\s*'([^']+)'/g)) ids.add(m[1]);
  return [...ids];
}

describe('account surface panels', () => {
  it('finds the ids the surface actually pushes (guards the matcher itself)', () => {
    // A matcher that found nothing would make the next test pass vacuously.
    expect(pushedIds(accountSource).length).toBeGreaterThan(3);
  });

  it('every pushed panel id resolves to registered content', () => {
    const unregistered = pushedIds(accountSource).filter(
      (id) => !(id in ACCOUNT_PANELS) && id !== 'share',
    );
    expect(unregistered).toEqual([]);
  });

  it('panel titles carry the founder-approved copy lock', () => {
    // `Account` sat confusingly adjacent to both `Profile` and the surface title.
    expect(ACCOUNT_PANELS.account().title).toBe('Sign-in and security');
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

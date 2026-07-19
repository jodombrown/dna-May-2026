/**
 * Composer collapse (DR1 step 5).
 *
 * Pre-DR1, `<UniversalComposer>` was mounted at twelve sites, eleven reachable,
 * each holding its own `isOpen`. The first test here would have FAILED against
 * that codebase: two consumers could not see each other's state, because they
 * were two different composers wearing the same name.
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { click, tab, pressEscape } from '@/test/helpers/interact';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The composer state reads the signed-in user. Auth is not what is under test.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, session: null, loading: false }),
}));

const repoRoot = resolve(__dirname, '../..');

/**
 * Strip comments before matching.
 *
 * The first draft of these tests grepped raw source and reported two mounts and
 * a surviving <SheetContent>. Both were false: it was matching PROSE — a doc
 * comment describing the twelve old mounts, and the comment explaining which
 * chrome had just been removed. A structural test that greps source will match
 * the documentation of the thing it is looking for.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '_archived') continue;
      walk(full, out);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('composer collapse — structural', () => {
  const files = walk(resolve(repoRoot, 'src'));

  it('is mounted exactly once in the whole app', () => {
    const mounts = files.filter((f) => {
      if (f.includes('.test.')) return false;
      return /<UniversalComposer[\s\n/>]/.test(code(readFileSync(f, 'utf8')));
    });

    expect(mounts.map((f) => f.replace(repoRoot + '/', ''))).toEqual([
      'src/components/drawer/surfaces/ComposerSurface.tsx',
    ]);
  });

  it('renders no chrome of its own (BD135 rule 5)', () => {
    const source = code(
      readFileSync(resolve(repoRoot, 'src/components/composer/UniversalComposer.tsx'), 'utf8'),
    );
    // The shell owns the sliding container, the scrim, the header and the title.
    expect(source).not.toMatch(/<SheetContent/);
    expect(source).not.toMatch(/<SheetHeader/);
    expect(source).not.toMatch(/<SheetTitle/);
    expect(source).not.toMatch(/<Sheet[\s>]/);
  });

  it('the two dead mounts are gone, not migrated', () => {
    for (const rel of [
      'src/components/mobile/MobileBottomNav.tsx',
      'src/pages/dna/convene/EventDetail.tsx',
    ]) {
      const s = code(readFileSync(resolve(repoRoot, rel), 'utf8'));
      expect(s, `${rel} should no longer reference the composer`).not.toMatch(
        /useUniversalComposer|<UniversalComposer/,
      );
    }
  });
});

/**
 * Behavioural: one state, many consumers.
 *
 * Uses the real ComposerProvider but a stub composer state module would defeat
 * the point, so this drives the actual context. It asserts the property that
 * makes the collapse meaningful rather than the implementation that delivers it.
 */
describe('composer collapse — behavioural', () => {
  it('two independent consumers share one open state', async () => {
    const { ComposerProvider, useUniversalComposer } = await import('@/contexts/ComposerContext');

    function Opener() {
      const composer = useUniversalComposer();
      return (
        <button type="button" onClick={() => composer.open('connect')}>
          open-from-header
        </button>
      );
    }

    function DistantObserver() {
      const composer = useUniversalComposer();
      return <output data-testid="observer">{composer.isOpen ? 'open' : 'closed'}</output>;
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ComposerProvider>
            <Opener />
            <DistantObserver />
          </ComposerProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('observer')).toHaveTextContent('closed');

    click(screen.getByText('open-from-header'));

    // Pre-DR1 this stayed 'closed': the observer had its own composer.
    await waitFor(() => expect(screen.getByTestId('observer')).toHaveTextContent('open'));
  });
});

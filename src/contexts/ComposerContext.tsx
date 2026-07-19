/**
 * ComposerContext — one composer state for the whole app (DR1 step 5).
 *
 * ── What this replaces ────────────────────────────────────────────────────
 * DR0 found `<UniversalComposer>` mounted at TWELVE sites, eleven of them
 * reachable, each calling `useUniversalComposer()` and holding its own
 * independent `isOpen`. "The composer" was never one thing; it was eleven
 * things that happened to look alike.
 *
 * The collapse was cheap because every site passed a byte-identical nine-prop
 * set from one hook, and `open(mode, ctx)` already accepted context per call.
 * So the hook hoists into a provider and NOT ONE `composer.open(...)` call site
 * changes. That is the whole migration.
 *
 * Two of the twelve were dead: `MobileBottomNav` and `EventDetail` each wired
 * all nine props and never called `open`. Deleted rather than migrated, and
 * since `MobileBottomNav` is itself mounted seven times, that one dead composer
 * was instantiated seven times over.
 */

import * as React from 'react';
import {
  useComposerState,
  type ComposerContext as ComposerContextValue,
} from '@/hooks/useUniversalComposer';
import { useDrawerSafe } from '@/contexts/DrawerContext';
import { COMPOSER_SURFACE_ID } from '@/components/drawer/surfaces/ComposerSurface';

type ComposerApi = ReturnType<typeof useComposerState>;

const ComposerCtx = React.createContext<ComposerApi | null>(null);

export function ComposerProvider({ children }: { children: React.ReactNode }) {
  const composer = useComposerState();
  const drawer = useDrawerSafe();

  /**
   * Composer state and drawer state are bound in ONE place, here, so no call
   * site has to know the composer lives in a drawer and the two can never
   * drift. `open()` drives the shell; the shell's close (X, Escape, scrim tap,
   * browser back) drives `close()`.
   */
  const drawerSurfaceId = drawer?.stack.at(-1)?.surfaceId ?? null;

  const open = React.useCallback<ComposerApi['open']>(
    (...args) => {
      composer.open(...args);
      drawer?.openSurface(COMPOSER_SURFACE_ID);
    },
    [composer, drawer],
  );

  const close = React.useCallback(() => {
    composer.close();
    if (drawerSurfaceId === COMPOSER_SURFACE_ID) drawer?.close();
  }, [composer, drawer, drawerSurfaceId]);

  /**
   * Openness is DERIVED from the shell, not mirrored into it.
   *
   * The first draft synced the two with an effect that closed the composer
   * whenever the drawer's surface did not match. That was a race: `openSurface`
   * writes to the URL, so there is a frame where the composer is open and the
   * URL has not caught up, and the effect closed it mid-open. A behavioural
   * test caught it; reading the code did not (BD109).
   *
   * Deriving instead of syncing means there is one source of truth and no
   * window in which the two can disagree. Shell-initiated dismissal (X, Escape,
   * scrim tap, browser back) flows through for free, because the URL changing
   * IS the composer closing.
   *
   * With no drawer above it the composer falls back to its own state, so it
   * stays usable in isolation and in tests.
   */
  const isOpen = drawer ? drawerSurfaceId === COMPOSER_SURFACE_ID : composer.isOpen;

  const value = React.useMemo<ComposerApi>(
    () => ({ ...composer, isOpen, open, close }),
    [composer, isOpen, open, close],
  );

  return <ComposerCtx.Provider value={value}>{children}</ComposerCtx.Provider>;
}

/**
 * Unchanged call signature by design: every existing `const composer =
 * useUniversalComposer()` keeps working, and every `composer.open(...)` is
 * untouched. Only the mount moved.
 *
 * The old hook accepted an `initialContext` argument; exactly one site used it
 * (`EventDetail`, which was a dead mount). Context now travels per call as
 * `open(mode, ctx)`, which the API already supported.
 */
export function useUniversalComposer(): ComposerApi {
  const ctx = React.useContext(ComposerCtx);
  if (!ctx) throw new Error('useUniversalComposer must be used inside <ComposerProvider />');
  return ctx;
}

export type { ComposerContextValue };

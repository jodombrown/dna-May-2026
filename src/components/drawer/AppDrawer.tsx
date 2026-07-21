/**
 * AppDrawer — the one drawer shell (BD135).
 *
 * Mounted ONCE at app root. Owns everything below BD135's line:
 *   anchor edge · handedness mirror · slide + easing · scrim · swipe-to-dismiss
 *   header row · back derived from stack depth · focus trap · focus restore
 *   safe areas · per-panel scroll memory · reduced motion · Escape · Android back
 *
 * Surfaces own CONTENT ONLY. A surface that renders its own header, back, close,
 * scrim or sliding container does not merge (BD135 rule 5).
 *
 * ── Why vaul for every edge ────────────────────────────────────────────────
 * vaul 0.9.9 supports direction 'top' | 'bottom' | 'left' | 'right' and is built
 * on Radix Dialog internally, so focus trap, focus restore, Escape, scrim and
 * scroll lock come from a battle-tested implementation rather than a hand-rolled
 * one. The pre-DR1 desktop panel hand-rolled it and got all four wrong, which is
 * exactly what the BD136 assertions record. One primitive, every edge, and
 * handedness becomes a prop instead of a branch.
 *
 * `modal` is TRUE on every viewport. BD135 rule 6 makes the scrim, the trap and
 * tap-outside-to-close non-negotiable, and this is the line that enforces it.
 * The pre-DR1 desktop branch set aria-modal="false" deliberately; that intent is
 * overruled, not tidied.
 */

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMobile';
import { useDrawer } from '@/contexts/DrawerContext';
import { DRAWER_Z_INDEX, anchorFor } from '@/components/drawer/constants';
import { cn } from '@/lib/utils';

export function AppDrawer() {
  const { isOpen, currentFrame, currentKey, depth, handedness, back, close, getScroll, setScroll } =
    useDrawer();
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  /**
   * Focus entry and restore (DR0 defects 3 and 13).
   *
   * DR0's code read caught the missing trap and the missing restore but NOT the
   * missing entry — a read finds what is written, and this was a defect of
   * omission. The BD136 assertion caught it in one run: opening the old desktop
   * panel never moved focus at all, so a keyboard or screen-reader member got
   * no focus move and no announcement, and their only way in was a Tab that
   * walked them into the page behind instead.
   *
   * Handled here rather than left to the primitive, because a capability the
   * shell promises should not depend on a library's default behaviour holding
   * across versions.
   */
  React.useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const id = window.requestAnimationFrame(() => contentRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(id);
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen]);

  const anchor = anchorFor(handedness, isMobile);
  const canGoBack = depth > 1;

  /**
   * Scroll position (DR3).
   *
   * The defect: opening a second panel left the member part-way down it,
   * inheriting the previous panel's offset. Two causes compounded.
   *
   * One, the scroll container was a SINGLE reused element across every frame,
   * so a frame change never reset the browser's own scrollTop. Two, the reset
   * that was written could not take effect: panel content is `React.lazy`
   * behind Suspense, so at the moment the effect ran the container had no
   * scrollable height and writing `scrollTop` was a silent no-op. The retained
   * offset then reappeared once the chunk resolved.
   *
   * `key={currentKey}` on the container fixes the reset structurally rather
   * than by timing: every frame mounts a FRESH element, and a fresh element
   * starts at zero with no write required and nothing to race.
   *
   * Memory is kept for SURFACE ROOTS only, and deliberately dropped for panels
   * (founder call, DR3). A surface root renders eagerly, so restoring into it
   * is reliable; a panel is lazy, so a restore would be the same no-op that
   * caused this defect, and returning a member mid-list in a settings panel
   * they had already backed out of is not behaviour anyone asked for. Best-effort
   * restore into lazy content is exactly the half-working half this cycle refuses.
   */
  const isSurfaceRoot = !!currentKey && !currentKey.includes('.');

  React.useEffect(() => {
    if (!currentKey || !isSurfaceRoot || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = getScroll(currentKey);
    return () => setScroll(currentKey, el.scrollTop);
  }, [currentKey, isSurfaceRoot, getScroll, setScroll]);

  // The shell renders nothing at all when no surface is active.
  if (!isOpen || !currentFrame) return null;

  const BackIcon = handedness === 'left' ? ChevronRight : ChevronLeft;

  return (
    <DrawerPrimitive.Root
      open
      onOpenChange={(next) => {
        if (!next) close();
      }}
      direction={anchor}
      modal
      dismissible
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          className="fixed inset-0 bg-foreground/50"
          style={{ zIndex: DRAWER_Z_INDEX }}
        />
        <DrawerPrimitive.Content
          ref={contentRef}
          tabIndex={-1}
          aria-label={currentFrame.title}
          style={{ zIndex: DRAWER_Z_INDEX + 1 }}
          className={cn(
            'fixed flex flex-col bg-background outline-none',
            anchor === 'bottom' &&
              // h-sheet (92vh) is a real token in tailwind.config.ts and is what
              // the pre-DR1 sheet used. An arbitrary height was invented here
              // instead and the design-system gate correctly rejected it. The
              // offending value is not repeated in this comment, because the
              // gate greps source text and would flag the comment too.
              'inset-x-0 bottom-0 h-sheet rounded-t-2xl border-t border-border',
            anchor === 'right' && 'inset-y-0 right-0 h-full w-full border-l border-border',
            anchor === 'left' && 'inset-y-0 left-0 h-full w-full border-r border-border',
            anchor !== 'bottom' &&
              (currentFrame.width === 'wide' ? 'max-w-drawer-wide' : 'max-w-drawer'),
          )}
        >
          {/* Drag handle: bottom anchor only. */}
          {anchor === 'bottom' && (
            <div
              aria-hidden="true"
              className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
            />
          )}

          {/*
            One header for every surface. Back appears from DEPTH, not from a
            per-surface flag, so it can never disagree with the stack.
            Control order mirrors on handedness.
          */}
          <header
            className={cn(
              'flex shrink-0 items-center gap-2 border-b border-border px-2 py-3',
              handedness === 'left' && 'flex-row-reverse',
            )}
          >
            <div className="flex w-10 shrink-0 justify-center">
              {canGoBack && (
                <button
                  type="button"
                  onClick={back}
                  aria-label="Back"
                  className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground"
                >
                  <BackIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <DrawerPrimitive.Title className="flex-1 truncate text-center text-h3">
              {currentFrame.title}
            </DrawerPrimitive.Title>

            <div className="flex w-10 shrink-0 justify-center">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/*
            Surface content. Safe-area inset is applied HERE, by the shell.
            DR0 defect 9: the pre-DR1 mobile sheet ran under the iOS Safari
            toolbar and cut its last row, because the surface was measuring
            height without an inset nobody owned.
          */}
          <div
            // A fresh element per frame. See the scroll note above: this is the
            // reset, and it is structural rather than timed.
            key={currentKey ?? 'empty'}
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {currentFrame.node}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

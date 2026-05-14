/**
 * RoadmapBanner - fixed top announcement strip that drives the landing page
 * (/) to /roadmap, the public marketing home for DNA's annual flagship event.
 *
 * Placement contract:
 * - Renders as `position: fixed; top: 0` so it always anchors to the very top
 *   of the viewport (no awkward gap below the navigation header).
 * - Honors `env(safe-area-inset-top)` so iOS/Android status bars never overlap.
 * - Measures its own height into `--roadmap-banner-height` so the
 *   UnifiedHeader (which reads that var) shifts down by exactly the banner
 *   height. When the banner is unmounted/dismissed, the var is cleared and
 *   the header returns to `top: 0`.
 * - Re-measures on resize, font load, theme change (class on <html>), and
 *   route transitions to prevent any drift.
 * - Dismiss animates a smooth collapse (height + opacity) and the header
 *   tracks the var with a matching transition for a seamless shift.
 *
 * - Dismissible for 7 days (localStorage)
 * - Honors prefers-reduced-motion
 * - WCAG AA: keyboard reachable, accessible name on dismiss button
 */
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

const STORAGE_KEY = 'dna.roadmapBanner.dismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const ROADMAP_BANNER_CSS_VAR = '--roadmap-banner-height';
const COLLAPSE_MS = 280;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const RoadmapBanner: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // Decide initial visibility from storage
  useEffect(() => {
    try {
      const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissedAt) {
        setMounted(true);
        return;
      }
      const ts = parseInt(dismissedAt, 10);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
        setMounted(false);
      } else {
        setMounted(true);
      }
    } catch {
      setMounted(true);
    }
  }, []);

  const writeVar = useCallback((px: number) => {
    document.documentElement.style.setProperty(
      ROADMAP_BANNER_CSS_VAR,
      `${Math.max(0, Math.round(px))}px`,
    );
  }, []);

  const measureAndApply = useCallback(() => {
    const el = innerRef.current;
    const wrap = wrapperRef.current;
    if (!el || !wrap) return;
    const h = el.getBoundingClientRect().height;
    // Drive the wrapper height (for collapse animation) and the global var
    // (for header offset) from the same source of truth.
    wrap.style.height = `${Math.round(h)}px`;
    writeVar(h);
  }, [writeVar]);

  // Measure + observe while mounted and not collapsing.
  useLayoutEffect(() => {
    if (!mounted) {
      writeVar(0);
      return;
    }
    if (collapsing) return;

    const el = innerRef.current;
    if (!el) return;

    measureAndApply();

    const ro = new ResizeObserver(() => measureAndApply());
    ro.observe(el);
    window.addEventListener('resize', measureAndApply);

    // Re-measure once webfonts settle (Lora/Inter swap can change line height).
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready?.then(() => measureAndApply()).catch(() => {});

    // Re-measure when the theme class on <html> changes (light/dark swaps
    // can alter padding/border tokens).
    const mo = new MutationObserver(() => measureAndApply());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', measureAndApply);
    };
  }, [mounted, collapsing, measureAndApply]);

  // Re-measure on route transitions (layout around the banner can shift).
  useEffect(() => {
    if (!mounted || collapsing) return;
    // Defer to after the route's first paint.
    const id = window.requestAnimationFrame(() => measureAndApply());
    return () => window.cancelAnimationFrame(id);
  }, [location.pathname, mounted, collapsing, measureAndApply]);

  // Clear the var on unmount no matter what.
  useEffect(() => {
    return () => writeVar(0);
  }, [writeVar]);

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }

    if (prefersReducedMotion()) {
      setMounted(false);
      writeVar(0);
      return;
    }

    // Animate: snap wrapper to its current measured height, then transition
    // to 0 on the next frame. The header's `top` reads the same var and
    // transitions in lockstep.
    const wrap = wrapperRef.current;
    const inner = innerRef.current;
    if (wrap && inner) {
      const h = inner.getBoundingClientRect().height;
      wrap.style.height = `${Math.round(h)}px`;
      // force reflow so the transition picks up the start value
      void wrap.offsetHeight;
    }
    setCollapsing(true);
    requestAnimationFrame(() => {
      if (wrapperRef.current) wrapperRef.current.style.height = '0px';
      writeVar(0);
    });
    window.setTimeout(() => {
      setMounted(false);
      setCollapsing(false);
    }, COLLAPSE_MS + 30);
  }, [writeVar]);

  if (!mounted) return null;

  const reduceMotion = prefersReducedMotion();

  return (
    <div
      ref={wrapperRef}
      aria-hidden={collapsing}
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden will-change-[height,opacity]"
      style={{
        transitionProperty: reduceMotion ? 'none' : 'height, opacity',
        transitionDuration: `${COLLAPSE_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: collapsing ? 0 : 1,
      }}
    >
      <div
        ref={innerRef}
        role="region"
        aria-label="ROADMAP 2026 announcement"
        className="bg-dna-forest text-white shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1 sm:py-2 flex items-center gap-2 sm:gap-3 min-h-[32px] sm:min-h-[40px]">
          <MateMasie className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dna-copper-light shrink-0" aria-hidden />
          <p className="text-[12px] leading-tight sm:text-[15px] flex-1 min-w-0 truncate sm:whitespace-normal">
            <span className="font-semibold tracking-[0.04em] mr-1.5 sm:mr-2">ROADMAP 2026</span>
            <span className="text-white/80 hidden sm:inline">
              DNA's annual flagship event lands in Los Angeles this December.{' '}
            </span>
            <span className="text-white/80 sm:hidden">LA · Dec 2026.{' '}</span>
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-dna-copper-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dna-forest rounded-sm"
            >
              Learn more
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
            </Link>
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss ROADMAP announcement"
            className="shrink-0 rounded-full p-0.5 sm:p-1 text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapBanner;

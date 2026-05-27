import { useEffect, useRef, type RefObject } from 'react';

/**
 * Sets a CSS custom property on :root equal to the observed element's height.
 * This is the **standard** way to communicate header height to the rest of
 * the layout.  Any component that needs to offset below a fixed/sticky header
 * reads the variable instead of hard-coding `top-14` / `pt-16` etc.
 *
 * Variables set by the platform:
 *   --unified-header-height   (UnifiedHeader, ~56-64px)
 *   --pulse-bar-height        (PulseBar, ~56px, 0 on mobile)
 *   --total-header-height     (sum of the two, convenience var)
 *
 * Usage:
 *   const ref = useRef<HTMLElement>(null);
 *   useSetCSSHeaderHeight(ref, '--unified-header-height');
 */
export function useSetCSSHeaderHeight(
  ref: RefObject<HTMLElement | null>,
  varName: string,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = Math.ceil(el.getBoundingClientRect().height);
        document.documentElement.style.setProperty(varName, `${h}px`);
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    // popstate covers browser back/forward. ResizeObserver covers any
    // size changes triggered by SPA navigation. We intentionally do NOT
    // patch history.pushState / replaceState — that creates feedback loops
    // with React Router and can exceed the browser's 100-calls/10s quota.
    window.addEventListener('popstate', update);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('popstate', update);
      document.documentElement.style.removeProperty(varName);
    };
  }, [ref, varName]);
}

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
    // Re-run after route changes (history navigation in SPA)
    window.addEventListener('popstate', update);
    // pushState/replaceState don't fire events; patch once for SPA nav
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      const r = origPush.apply(this, args as Parameters<typeof origPush>);
      update();
      return r;
    };
    history.replaceState = function (...args) {
      const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
      update();
      return r;
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('popstate', update);
      history.pushState = origPush;
      history.replaceState = origReplace;
      document.documentElement.style.removeProperty(varName);
    };
  }, [ref, varName]);
}

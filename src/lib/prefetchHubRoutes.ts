/**
 * prefetchHubRoutes — warm-import the five DNA hub chunks so Pulse taps
 * resolve synchronously.
 *
 * `React.lazy()` caches the module promise it wraps, so once we've kicked
 * off the dynamic import here, the <Route>'s Suspense fallback never
 * actually mounts on subsequent navigation — the module is already
 * resolved.
 *
 * Called from three places:
 *   1. PulseBar / PulseDock on mount → requestIdleCallback warms all 5.
 *   2. PulseItem hover/focus → belt-and-suspenders per-route warm.
 *   3. PulseDockItem pointerdown/touchstart → per-route warm before tap.
 */

const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/dna/connect': () => import('@/pages/dna/connect/Connect'),
  '/dna/convene': () => import('@/pages/dna/convene/ConveneHub'),
  '/dna/collaborate': () => import('@/pages/dna/collaborate/CollaborateHub'),
  '/dna/contribute': () => import('@/pages/dna/contribute/ContributeHub'),
  '/dna/convey': () => import('@/pages/dna/convey/ConveyHub'),
};

const prefetched = new Set<string>();

export function prefetchHubRoute(href: string): void {
  if (prefetched.has(href)) return;
  const loader = ROUTE_PREFETCH[href];
  if (!loader) return;
  prefetched.add(href);
  loader().catch(() => prefetched.delete(href));
}

export function prefetchAllHubRoutes(): void {
  for (const href of Object.keys(ROUTE_PREFETCH)) {
    prefetchHubRoute(href);
  }
}

/**
 * Schedule prefetching of all hub chunks during browser idle time.
 * Safe to call multiple times — subsequent calls are no-ops thanks to
 * the `prefetched` Set.
 */
export function scheduleHubPrefetch(): void {
  if (typeof window === 'undefined') return;

  const runner = () => prefetchAllHubRoutes();

  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(runner, { timeout: 2000 });
  } else {
    // Safari fallback — fire after a short delay so we don't fight
    // first-paint work.
    setTimeout(runner, 1500);
  }
}

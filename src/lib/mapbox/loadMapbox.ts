import { config } from '@/lib/config';

/**
 * Mapbox GL JS — runtime CDN loader.
 *
 * The platform deliberately does NOT take a hard `mapbox-gl` npm dependency:
 * adding one trips the frozen-lockfile / private-registry blocker in the
 * Lovable build. Instead we inject the official Mapbox GL JS v3 script +
 * stylesheet from api.mapbox.com once, at runtime, and resolve the global
 * `window.mapboxgl` namespace.
 *
 * Guarantees:
 *  - single injection: concurrent callers share one in-flight promise, and a
 *    global that is already present (script pre-loaded elsewhere) is reused
 *    without re-injecting.
 *  - graceful failure: a network/script error rejects the promise so callers
 *    can render a clear "map unavailable" state instead of crashing.
 *
 * There is NO Content-Security-Policy on this app (checked index.html and the
 * Vite/host config — no CSP meta tag, no _headers/vercel/netlify header file),
 * so the CDN origins do not need to be allow-listed. If a CSP is introduced
 * later, add `https://api.mapbox.com` (and the Mapbox tile/telemetry origins,
 * `https://*.tiles.mapbox.com https://events.mapbox.com`) to `script-src`,
 * `style-src`, `img-src`, `connect-src`, and `worker-src blob:`.
 */

// Pinned Mapbox GL JS v3 release. api.mapbox.com serves only exact versions
// (no floating "latest"), so this is intentionally explicit.
const MAPBOX_VERSION = 'v3.9.0';
const SCRIPT_URL = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`;
const STYLE_URL = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`;

const SCRIPT_ID = 'mapbox-gl-js-cdn';
const STYLE_ID = 'mapbox-gl-css-cdn';

/* ── Minimal typing for the subset of the Mapbox GL API this app uses ──────
   The real `mapbox-gl` type package is not installed (no npm dependency), so
   we describe only what we call. */

export interface MapboxLngLat {
  lng: number;
  lat: number;
}

export interface MapboxMapMouseEvent {
  lngLat: MapboxLngLat;
  features?: Array<{ properties: Record<string, unknown> | null }>;
}

export interface MapboxPopup {
  setLngLat(coords: [number, number]): MapboxPopup;
  setHTML(html: string): MapboxPopup;
  setText(text: string): MapboxPopup;
  addTo(map: MapboxMap): MapboxPopup;
  remove(): MapboxPopup;
}

export interface MapboxLngLatBounds {
  extend(coord: [number, number]): MapboxLngLatBounds;
}

export interface MapboxMarker {
  setLngLat(coords: [number, number]): MapboxMarker;
  setPopup(popup: MapboxPopup): MapboxMarker;
  addTo(map: MapboxMap): MapboxMarker;
  getElement(): HTMLElement;
  togglePopup(): MapboxMarker;
  remove(): void;
}

export interface MapboxMap {
  on(type: string, listener: (ev: MapboxMapMouseEvent) => void): void;
  on(type: string, layerId: string, listener: (ev: MapboxMapMouseEvent) => void): void;
  once(type: string, listener: () => void): void;
  addSource(id: string, source: Record<string, unknown>): void;
  addLayer(layer: Record<string, unknown>): void;
  getSource(id: string): { setData(data: unknown): void } | undefined;
  getLayer(id: string): unknown | undefined;
  getCanvas(): HTMLCanvasElement;
  fitBounds(bounds: MapboxLngLatBounds, options?: Record<string, unknown>): void;
  addControl(control: unknown, position?: string): void;
  resize(): void;
  remove(): void;
}

export interface MapboxGL {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => MapboxMap;
  Popup: new (options?: Record<string, unknown>) => MapboxPopup;
  Marker: new (options?: Record<string, unknown>) => MapboxMarker;
  LngLatBounds: new (sw?: [number, number], ne?: [number, number]) => MapboxLngLatBounds;
  NavigationControl: new (options?: Record<string, unknown>) => unknown;
}

declare global {
  interface Window {
    mapboxgl?: MapboxGL;
  }
}

let loaderPromise: Promise<MapboxGL> | null = null;

function injectStylesheet(): void {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = STYLE_URL;
  document.head.appendChild(link);
}

/**
 * Load (or reuse) the Mapbox GL JS global. Resolves with `window.mapboxgl`.
 * Safe to call from many components at once — one injection, one promise.
 */
export function loadMapbox(): Promise<MapboxGL> {
  // Already available (this app or another surface loaded it first).
  if (typeof window !== 'undefined' && window.mapboxgl) {
    injectStylesheet();
    return Promise.resolve(window.mapboxgl);
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<MapboxGL>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Mapbox GL can only load in a browser environment.'));
      return;
    }

    injectStylesheet();

    const settle = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
      } else {
        loaderPromise = null;
        reject(new Error('Mapbox GL script loaded but window.mapboxgl is undefined.'));
      }
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // A prior call already injected the tag; wait for it to finish.
      if (window.mapboxgl) {
        settle();
      } else {
        existing.addEventListener('load', settle, { once: true });
        existing.addEventListener('error', () => {
          loaderPromise = null;
          reject(new Error('Failed to load Mapbox GL JS from the CDN.'));
        }, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = settle;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('Failed to load Mapbox GL JS from the CDN.'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/**
 * The public Mapbox token, injected at build time by the Lovable connector.
 * Absent in some environments — callers must handle `null` (render a clear
 * "token not configured" state) rather than passing an empty token to Mapbox.
 */
export function getMapboxToken(): string | null {
  const token = config.MAPBOX_PUBLIC_TOKEN;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

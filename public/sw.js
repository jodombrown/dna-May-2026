// DNA Platform Service Worker v7
// Hardened caching strategy with version-bump and empty-response protection
//
// BUILD VERSION: Updated automatically — bump CACHE_VERSION to force invalidation
// SAFETY: Never caches empty or broken HTML responses

const CACHE_VERSION = 7;
const CACHE_NAME = `dna-cache-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `dna-runtime-v${CACHE_VERSION}`;

// Static assets to cache on install (never index.html)
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// ============================================================
// SAFETY: Response validation — prevents empty HTML caching
// ============================================================

/**
 * Validates that an HTML response actually contains a working app.
 * Rejects empty bodies, error pages, and responses missing <script> tags.
 */
async function isValidHtmlResponse(response) {
  if (!response || !response.ok) return false;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return true; // Non-HTML is fine

  try {
    const clone = response.clone();
    const text = await clone.text();

    // Reject empty or near-empty responses
    if (!text || text.trim().length < 100) {
      console.warn('[SW] Rejected empty HTML response');
      return false;
    }

    // HTML must contain a <script> tag to be a working SPA
    if (!text.includes('<script')) {
      console.warn('[SW] Rejected HTML without scripts (likely broken build)');
      return false;
    }

    // HTML must contain the root div
    if (!text.includes('id="root"') && !text.includes("id='root'")) {
      console.warn('[SW] Rejected HTML without #root element');
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// URL pattern matching
// ============================================================

const NEVER_CACHE_PATTERNS = [
  /\/auth\//,
  /\/realtime\//,
  /\/node_modules\/\.vite\//,
  /\/src\//,
  /\.hot-update\./,
  /chrome-extension/,
];

const NETWORK_FIRST_PATTERNS = [
  /\/rest\/v1\//,
  /supabase\.co/,
  /\/api\//,
];

const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
  /\/icons\//,
];

function matchesPattern(url, patterns) {
  return patterns.some((p) => p.test(url));
}

// ============================================================
// Install — cache static assets, skip waiting immediately
// ============================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log(`[SW] v${CACHE_VERSION} installed`);
        return self.skipWaiting();
      })
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// ============================================================
// Activate — purge ALL old caches (version-bump invalidation)
// ============================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME && n !== RUNTIME_CACHE)
            .map((n) => {
              console.log('[SW] Purging old cache:', n);
              return caches.delete(n);
            })
        )
      )
      .then(() => {
        console.log(`[SW] v${CACHE_VERSION} activated — old caches purged`);
        return self.clients.claim();
      })
  );
});

// ============================================================
// Fetch strategies with empty-response protection
// ============================================================

/**
 * Network-first with validation.
 * If the network response is empty/broken HTML, falls back to cache.
 * If cache is also bad, returns a safe fallback.
 */
async function networkFirstSafe(request) {
  try {
    const networkResponse = await fetch(request);

    const isDocumentRequest =
      request.mode === 'navigate' ||
      request.destination === 'document' ||
      (request.headers.get('accept') || '').includes('text/html');

    // For non-document requests (images, fonts, XHR, opaque cross-origin responses),
    // return live network response directly and only cache safe responses.
    if (!isDocumentRequest) {
      if (networkResponse.ok || networkResponse.type === 'opaque') {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }

    // Validate HTML before caching — NEVER cache broken HTML
    const isValid = await isValidHtmlResponse(networkResponse);
    if (isValid) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else if (networkResponse.ok) {
      // Response is ok but HTML validation failed — still return it
      // (user gets it live but we don't pollute the cache)
      console.warn('[SW] Serving unvalidated response without caching');
      return networkResponse;
    }

    // Network returned error — try cache
    throw new Error('Network response not ok');
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Last resort for navigation requests — show offline page
    if (request.mode === 'navigate' || request.destination === 'document') {
      const rootCached = await caches.match('/');
      if (rootCached) return rootCached;

      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>DNA — Offline</title></head>' +
        '<body style="font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F9F7F4">' +
        '<div style="text-align:center;padding:2rem"><h1 style="color:#1A1A1A">You\'re offline</h1>' +
        '<p style="color:#666">Please check your connection and try again.</p>' +
        '<button onclick="location.reload()" style="margin-top:1rem;padding:0.75rem 1.5rem;background:#4A8D77;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem">Retry</button>' +
        '</div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/**
 * Cache-first for immutable hashed assets (JS/CSS bundles).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ============================================================
// Main fetch handler
// ============================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (matchesPattern(request.url, NEVER_CACHE_PATTERNS)) return;

  // ALL navigation requests and HTML — network-first with validation
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstSafe(request));
    return;
  }

  // Supabase Storage images: always network-direct to avoid offline HTML fallbacks
  if (request.url.includes('/storage/v1/object/') && request.destination === 'image') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // API calls — network-first (no HTML validation needed)
  if (matchesPattern(request.url, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirstSafe(request));
    return;
  }

  // Static hashed assets — cache-first (safe, Vite hashes change per build)
  if (matchesPattern(request.url, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else — network-first
  event.respondWith(networkFirstSafe(request));
});

// ============================================================
// Message handlers
// ============================================================

self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      if (event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_NAME, cacheVersion: CACHE_VERSION });
      }
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys()
          .then((names) => Promise.all(names.map((n) => caches.delete(n))))
          .then(() => self.clients.matchAll())
          .then((clients) => {
            clients.forEach((c) => c.postMessage({ type: 'CACHE_CLEARED' }));
          })
      );
      break;

    case 'CHECK_VERSION':
      // Client can send expected version; if mismatch, force update
      if (event.data.expectedVersion && event.data.expectedVersion !== CACHE_VERSION) {
        console.log('[SW] Version mismatch — clearing caches');
        caches.keys().then((names) =>
          Promise.all(names.map((n) => caches.delete(n)))
        );
      }
      break;
  }
});

// ============================================================
// Background sync (future use)
// ============================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(Promise.resolve());
  }
});

// Push & notification handlers
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'DNA', {
      body: data.message || 'New notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const url = event.notification.data?.url || '/';
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

console.log(`[SW] DNA Service Worker v${CACHE_VERSION} loaded`);

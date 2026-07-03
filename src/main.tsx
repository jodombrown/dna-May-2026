// React application entry point
import React from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initOfflineQueue } from './lib/initOfflineQueue'

initOfflineQueue()

// Ensure root element exists
if (!document.getElementById("root")) {
  console.error("Root element not found. Make sure your HTML includes <div id='root'></div>");
}

const clearDevelopmentServiceWorkerState = async () => {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return false;
  }

  let clearedState = Boolean(navigator.serviceWorker.controller);

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    clearedState = clearedState || registrations.length > 0;
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // Dev cleanup is best-effort.
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      const dnaCacheKeys = keys.filter((key) => key.startsWith('dna-cache-') || key.startsWith('dna-runtime-'));
      clearedState = clearedState || dnaCacheKeys.length > 0;
      await Promise.all(dnaCacheKeys.map((key) => caches.delete(key)));
    } catch {
      // Dev cleanup is best-effort.
    }
  }

  return clearedState;
};

const registerProductionServiceWorker = () => {
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Force update check on every page load
          registration.update();

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New SW ready: skip waiting and activate immediately
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                }
              });
            }
          });
        })
        .catch(() => {
          // SW registration failed; app still works without it.
        });

      // Auto-reload when new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
};

const renderApp = async () => {
  const clearedDevelopmentState = await clearDevelopmentServiceWorkerState();

  if (clearedDevelopmentState) {
    window.location.reload();
    return;
  }

  registerProductionServiceWorker();
  createRoot(document.getElementById("root")!).render(<App />);
};

void renderApp();
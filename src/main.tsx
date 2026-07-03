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

// Register service worker only for production builds.
// In Vite dev preview, caching /node_modules/.vite chunks can mix stale React
// modules with fresh ReactDOM modules and crash hooks with a null dispatcher.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {
          // Dev cleanup is best-effort.
        });

      if ('caches' in window) {
        caches.keys()
          .then((keys) => Promise.all(
            keys
              .filter((key) => key.startsWith('dna-cache-') || key.startsWith('dna-runtime-'))
              .map((key) => caches.delete(key))
          ))
          .catch(() => {
            // Dev cleanup is best-effort.
          });
      }
    });
  } else {
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
}

createRoot(document.getElementById("root")!).render(<App />);
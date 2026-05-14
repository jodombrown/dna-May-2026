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

// Register service worker for PWA support with version-check
if ('serviceWorker' in navigator) {
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
                // New SW ready — skip waiting and activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
      })
      .catch(() => {
        // SW registration failed — app still works without it
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

createRoot(document.getElementById("root")!).render(<App />);
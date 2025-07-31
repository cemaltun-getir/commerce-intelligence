// Minimal service worker to prevent 404 errors
// This file is created to handle requests from browser extensions or other scripts
// that may be looking for a service worker

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// No-op fetch handler
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally
  return;
}); 
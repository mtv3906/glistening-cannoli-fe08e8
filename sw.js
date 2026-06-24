// SFPD Reserve Hours — offline service worker
// Bump CACHE_VERSION whenever you change index.html so devices pull the update.
const CACHE_VERSION = 'sfpd-hours-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './SFPD-Star.png'
];

// Install: pre-cache the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove any old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network.
// Navigation requests fall back to the cached app shell when offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache same-origin successful responses for next time
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached: for page loads, return the app shell
          if (request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});

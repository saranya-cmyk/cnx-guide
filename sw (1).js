const CACHE_NAME = 'cm-food-guide-v1';
const APP_SHELL = [
  './chiangmai-food-guide.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Strategy:
// - App shell (this same origin): cache-first, falls back to network, updates cache in background.
// - Map tiles / fonts / leaflet CDN: cache-first so previously-viewed areas work offline;
//   falls back to network when not cached yet (needs internet the first time).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isTile = url.hostname.endsWith('tile.openstreetmap.org');
  const isCdn = url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  const isSameOrigin = url.origin === self.location.origin;

  if (isTile || isCdn || isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
  // Everything else (e.g. OSRM routing, live geolocation): always go to network, no caching
  // (routes need to be fresh and geolocation isn't cacheable).
});

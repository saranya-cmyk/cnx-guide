// Offline caching has been retired — it was causing stale versions to get stuck
// on people's devices after every update. This file now only exists to clean up
// after itself: it deletes any old caches and unregisters, so devices that still
// have the old service worker installed get flushed back to normal on next visit.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

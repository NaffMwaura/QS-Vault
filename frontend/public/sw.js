/* ======================================================
    QS VAULT: OFFLINE ASSET GUARD (SERVICE WORKER)
    Version: 2.6.0 (Integrated Native Assets)
   ====================================================== */

const CACHE_NAME = 'qs-vault-shell-v2.6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-icon-180.png',
  '/manifest-icon-192.maskable.png',
  '/manifest-icon-512.maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Native Shell Nodes Cached.');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
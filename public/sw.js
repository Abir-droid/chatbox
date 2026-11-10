// Progressive Web App Service Worker for Chatbox
const ASSET_VERSION = '{{VERSION}}';
const BASE_PATH = '{{BASE}}';
const CACHE_NAME = 'chatbox-shell-' + (ASSET_VERSION.startsWith('{{') ? 'v1' : ASSET_VERSION);

const PRECACHE_ASSETS = [
  (BASE_PATH || '') + '/',
  (BASE_PATH || '') + '/static/app.css?v=' + ASSET_VERSION,
  (BASE_PATH || '') + '/static/app.js?v=' + ASSET_VERSION,
  (BASE_PATH || '') + '/static/theme.js?v=' + ASSET_VERSION,
  (BASE_PATH || '') + '/static/favicon.svg?v=' + ASSET_VERSION,
  (BASE_PATH || '') + '/static/icons/icon-192.png',
  (BASE_PATH || '') + '/static/icons/icon-512.png',
  (BASE_PATH || '') + '/static/icons/apple-touch-icon.png',
  (BASE_PATH || '') + '/static/icons/icon-maskable-192.png',
  (BASE_PATH || '') + '/static/icons/icon-maskable-512.png',
  (BASE_PATH || '') + '/static/fonts/bricolage-grotesque-latin-wght-normal.woff2',
  (BASE_PATH || '') + '/static/fonts/figtree-latin-wght-normal.woff2',
  (BASE_PATH || '') + '/offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('chatbox-shell-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bypass WebSockets, Socket.IO, live WebRTC signaling, uploads, and healthchecks
  if (
    url.pathname.includes('/socket.io/') ||
    url.pathname.includes('/healthz') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/login') ||
    url.pathname.includes('/register') ||
    url.pathname.includes('/logout')
  ) {
    return;
  }

  // HTML navigation requests
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return (
              cached ||
              caches.match((BASE_PATH || '') + '/') ||
              caches.match((BASE_PATH || '') + '/offline.html')
            );
          });
        })
    );
    return;
  }

  // Static assets (CSS, JS, Fonts, Icons)
  if (
    url.pathname.includes('/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => null);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Notifications click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || (BASE_PATH || '') + '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(BASE_PATH || '/') || client.url === targetUrl) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

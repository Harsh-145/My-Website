// Service Worker for The Wizarding Hub PWA
const CACHE_NAME = 'wizarding-hub-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './images/bg.webp',
  './images/img.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './audio/background-music.mp3',
  './manifest.json'
];

const FONT_CACHE = 'wizarding-hub-fonts-v1';
const DYNAMIC_CACHE = 'wizarding-hub-dynamic-v1';

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== FONT_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase and other API requests — always go network
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') && url.pathname.includes('/v1')) {
    return;
  }

  // Google Fonts — cache first, then network
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Static assets — cache first, fallback to network
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '')) || url.pathname === '/' || url.pathname.endsWith('index.html'))) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Everything else — network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

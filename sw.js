// Service Worker for Cluedo Assistant
// Enables offline functionality and caching

const CACHE_NAME = 'cluedo-assistant-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './game.js',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  './apple-touch-icon.png',
  './favicon.svg',
  './favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail, return offline page or basic response
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});


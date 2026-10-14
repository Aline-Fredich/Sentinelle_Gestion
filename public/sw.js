/**
 * SENTINEL GESTION — Service Worker PWA (Offline-First)
 * Mise en cache intelligente et résilience réseau en mobilité.
 */

const CACHE_NAME = 'sentinel-pwa-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/sentinel-icon.svg',
  '/sentinel-logo.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET ou les extensions de navigateur
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ignorer l'API de santé pour qu'elle reflète toujours le statut temps réel
  if (event.request.url.includes('/api/health')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stratégie Stale-While-Revalidate : renvoie le cache s'il existe et met à jour en arrière-plan
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // En cas d'échec réseau complet et sans cache pour la page, renvoyer la racine en cache
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});

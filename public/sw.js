/**
 * Service worker for the TK77 Skalica PWA shell.
 *
 * Deliberately narrow scope: it ONLY cache-first serves static, non-personal
 * assets (icons, /_next/static build output). It never touches an HTML page
 * or anything under /api - all of that always goes to the network. That's
 * intentional: this app is session-cookie-authenticated (Supabase Auth), and
 * caching an authenticated response in a shared/public cache (as a service
 * worker cache effectively is on a shared device) risks showing one user's
 * page to the next person who opens the app on the same device/browser
 * profile.
 */

const CACHE_NAME = 'tk77-static-v1';

function isCacheableStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/.test(url.pathname)
  );
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return; // never intercept writes

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !isCacheableStaticAsset(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});

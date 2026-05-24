// Service Worker for Zeynep & Batuhan Wedding Invitation
// Enables offline functionality

const CACHE_NAME = 'zeynep-batuhan-v14';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/script.js',
  '/assets/audio/music.mp3',
  '/assets/images/favicon.ico',
  '/assets/images/favicon.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/background.png',
  '/assets/images/davetiye.jpeg',
  '/assets/images/gloria-event.jpg',
  '/assets/images/sakura-branch.png',
  '/assets/images/og-invite.jpeg',
  '/assets/images/hikaye.jpg',
  '/assets/images/hikaye-600.jpg',
  '/assets/images/askilavinya.jpg',
  '/assets/images/beykozevlendirme.jpg',
  '/assets/videos/sakurawaxsealintrovideo.mp4',
  '/kina.ics',
  '/nikah.ics'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Cache failed:', err))
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isPrivateArea = requestUrl.pathname === '/gir' ||
    requestUrl.pathname.startsWith('/gir/');

  // Private area: always network, never touch the cache.
  if (isSameOrigin && isPrivateArea) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isCoreAsset =
    requestUrl.pathname === '/' ||
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/assets/js/script.js') ||
    requestUrl.pathname.endsWith('/assets/css/styles.css');

  if (isSameOrigin && isCoreAsset) {
    // Keep HTML/CSS/JS fresh to avoid serving stale broken bundles.
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Push notification event
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Zeynep & Batuhan';
  const body = data.body || 'Davetiyede yeni bir güncelleme var!';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/assets/images/og-invite.jpeg',
      badge: '/assets/images/favicon.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Service Worker for Zeynep & Batuhan Wedding Invitation
// Enables offline functionality

const CACHE_NAME = 'zeynep-batuhan-v18';
// Sadece hafif ve gercekten kullanilan dosyalar. Muzik (3.4 MB) ve intro
// videosu (14 MB) bilerek disarida: ikisi de sayfada lazy yukleniyor,
// precache etmek mobil kullaniciya bosuna ~18 MB indirtiyordu.
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/script.js',
  '/assets/images/favicon.ico',
  '/assets/images/favicon.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/sakura-branch.png',
  '/assets/images/og-invite.jpeg',
  '/assets/images/hikaye.jpg',
  '/assets/images/hikaye-600.jpg',
  '/assets/images/askilavinya.jpg',
  '/assets/images/beykozevlendirme.jpg',
  '/kina.ics',
  '/nikah.ics'
];

// Install event - cache assets
// Tek tek ekliyoruz: cache.addAll atomiktir, listedeki bir dosya 404 verirse
// hicbiri yazilmaz ve cache tamamen bos kalir.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.all(
      urlsToCache.map(url => cache.add(url).catch(err => {
        console.warn('Cache atlandi:', url, err);
      }))
    ))
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

  // Ses/video icin tarayici Range istegi yapar; SW araya girerse seek bozulur.
  if (event.request.headers.has('range')) return;

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
      icon: '/assets/images/notif-heart.png',
      badge: '/assets/images/notif-heart.png',
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

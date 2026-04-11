// Service Worker for Zeynep & Batuhan Wedding Invitation
// Enables offline functionality

const CACHE_NAME = 'zeynep-batuhan-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/music.mp3',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/background.png',
  '/484988162_1172576828203231_8853228718053290437_n.jpg',
  '/WhatsApp Image 2026-03-29 at 9.20.17 PM.jpeg',
  '/assets/images/sakura-branch.png',
  '/assets/images/og-invite.jpeg',
  '/assets/videos/sakurawaxsealintrovideo.mp4'
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
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
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

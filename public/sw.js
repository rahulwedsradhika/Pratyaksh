const CACHE = 'pratyaksh-public-offline-v1';
const PUBLIC_FILES = ['/offline.html', '/pwa/icon-192.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC_FILES.map(url => new Request(url, { credentials: 'omit', cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pratyaksh-public-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Never cache or intercept authenticated APIs, payment requests, PDFs,
  // streamed video or application assets. Navigation is always network first;
  // only the generic public offline screen is cached, never a student's page.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || /^\/(api|upload|assets)(\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || new Response('Reconnect to open your classroom.', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
});

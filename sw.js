/* Service worker — síť má přednost, cache je záloha pro offline.
   Díky tomu se po nahrání nové verze na GitHub Pages načtou nové soubory
   hned, ne až po smazání aplikace. */
const CACHE = 'mojestavba-hra-v5';
const FILES = ['./','./index.html','./style.css','./data.js','./icons.js',
  './state.js','./render.js','./ui.js','./main.js','./dev.js','./manifest.json',
  './icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = e.request.url.startsWith(self.location.origin);
  if (!sameOrigin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok) { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// Lets the scoreboard open without a connection.
// Network first: when online you always get the latest version from GitHub;
// when offline it falls back to the last copy saved on this phone.
// Only the app's own files, its fonts and the Firebase code are cached.
// Sign-in and cloud-save traffic is never touched.
const CACHE = 'amerikano-v5';
const CDN = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  self.skipWaiting();
  // Each file is added on its own, so one missing file can't stop the app working offline.
  const files = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'];
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(files.map(f => c.add(f).catch(() => {})))));
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin && !CDN.includes(url.hostname)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(hit =>
        hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});

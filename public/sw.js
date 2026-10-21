/* Offline support: app shell is cached on install; sounds are cached as they are played
   (or all at once from the parent screen). */
const SHELL = 'tamil-shell-v1';
const AUDIO = 'tamil-audio-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './audio/manifest.json']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      // Only clean up this app's own old caches: other apps on the same origin
      // (e.g. another GitHub Pages site of the same account) have caches too.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tamil-') && k !== SHELL && k !== AUDIO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // sound clips never change (their names are content hashes): cache first
  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.open(AUDIO).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }),
    );
    return;
  }

  // built assets have hashed names: cache first
  if (url.pathname.includes('/assets/') || url.pathname.includes('/fonts/') || url.pathname.includes('/icons/')) {
    e.respondWith(
      caches.open(SHELL).then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }),
    );
    return;
  }

  // pages and manifests: network first, so updates arrive; cache as fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});

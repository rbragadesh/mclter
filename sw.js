// Offline support: every file is cached on install, then served cache-first.
// VERSION is a hash of the files below (npm run bump), so any change reaches installed iPads.
const VERSION = 'mathclimb-823f184b20';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './js/app.js',
  './js/mastery.js',
  './js/rng.js',
  './js/session.js',
  './js/sound.js',
  './js/speech.js',
  './js/store.js',
  './js/ui.js',
  './js/visuals.js',
  './js/skills/add.js',
  './js/skills/count.js',
  './js/skills/div.js',
  './js/skills/frac.js',
  './js/skills/index.js',
  './js/skills/logic.js',
  './js/skills/mult.js',
  './js/skills/place.js',
  './js/skills/story.js',
  './js/skills/sub.js',
  './js/skills/time.js',
  './js/skills/util.js',
  './js/views/home.js',
  './js/views/learn.js',
  './js/views/parent.js',
  './js/views/play.js',
  './js/views/practice.js',
  './js/views/skill.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
    ),
  );
});

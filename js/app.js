// Boot, hash router and the shared `app` context handed to every screen.
import { load, save } from './store.js';
import { randomSeed, mulberry32 } from './rng.js';
import { initSpeech, setSpeech, say, stopSpeech } from './speech.js';
import { setSound, unlockAudio, sfx } from './sound.js';
import { toast } from './ui.js';
import { home, welcome } from './views/home.js';
import { skillHub } from './views/skill.js';
import { practice, test } from './views/practice.js';
import { learn } from './views/learn.js';
import { play, game } from './views/play.js';
import { parent } from './views/parent.js';

const ROUTES = [
  ['', home],
  ['welcome', welcome],
  ['skill/:id', skillHub],
  ['learn/:id', learn],
  ['practice/:id', practice],
  ['table/:n', (root, p, app) => practice(root, { id: 'table', n: p.n }, app)],
  ['test/:type', test],
  ['test/:type/:n', test],
  ['play', play],
  ['play/:game', game],
  ['parent', parent],
  ['parent/:tab', parent],
];

function match(path) {
  const parts = path.split('/').filter(Boolean);
  for (const [pattern, view] of ROUTES) {
    const pp = pattern.split('/').filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params = {};
    if (pp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(parts[i])), true) : seg === parts[i]))) return { view, params };
  }
  return { view: home, params: {} };
}

const root = document.getElementById('app');
let cleanup = null;

export const app = {
  state: load(),
  rng: mulberry32(randomSeed()),
  now: () => Date.now(),
  current: null, // the question on screen (read by end-to-end tests)
  save() {
    save(this.state);
  },
  go(path) {
    const target = `#/${path.replace(/^#?\/?/, '')}`;
    if (location.hash === target) render();
    else location.hash = target;
  },
  say(text, opts) {
    say(text, opts);
  },
  applySettings() {
    setSpeech(this.state.settings.speech);
    setSound(this.state.settings.sound);
  },
  sfx,
};

function render() {
  stopSpeech();
  if (cleanup) cleanup();
  cleanup = null;
  app.current = null;
  const path = location.hash.replace(/^#\/?/, '');
  const needsProfile = !app.state.profile.name && !path.startsWith('welcome') && !path.startsWith('parent');
  const { view, params } = needsProfile ? { view: welcome, params: {} } : match(path);
  root.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = view(root, params, app) || null;
}

window.addEventListener('hashchange', render);
// iPad blocks audio and speech until the first touch
window.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopSpeech();
    app.save();
  }
});

initSpeech(app.state.settings.speech);
app.applySettings();
window.__mc = app;
render();

// ---------------------------------------------------------------- offline support
// sandboxed previews can throw just for touching navigator.serviceWorker, so guard the whole block
try {
  if ('serviceWorker' in navigator && navigator.serviceWorker && location.protocol !== 'file:') registerWorker();
} catch {
  // no offline mode here; the app itself still runs
}

function registerWorker() {
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            toast('A new version is ready.', { action: 'Update', ms: 0, onAction: () => w.postMessage('skipWaiting') });
          }
        });
      });
    })
    .catch(() => {});
  let reloading = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // the very first install also fires this; only reload when replacing an older version
    if (reloading || !hadController) return;
    reloading = true;
    location.reload();
  });
}

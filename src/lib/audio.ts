/**
 * Speech and sound effects.
 *
 * Tamil and English speech come from pre-generated clips (public/audio). If a
 * text has no clip (e.g. a story she typed herself) we fall back to the
 * device's own text-to-speech, if it has a voice for that language.
 * iPad Safari only allows sound after the first tap, so `unlockAudio()` is
 * called from the first touch.
 */

type Lang = 'ta' | 'en';

let manifest: Record<Lang, Record<string, string>> | null = null;
let manifestPromise: Promise<void> | null = null;
const base = import.meta.env.BASE_URL + 'audio/';

function loadManifest(): Promise<void> {
  if (!manifestPromise) {
    manifestPromise = fetch(base + 'manifest.json')
      .then((r) => (r.ok ? r.json() : { ta: {}, en: {} }))
      .then((m) => {
        manifest = m;
      })
      .catch(() => {
        manifest = { ta: {}, en: {} };
      });
  }
  return manifestPromise;
}
void loadManifest();

let player: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let muted = false;
let token = 0;

export function setMuted(m: boolean) {
  muted = m;
  if (m) stopSpeech();
}
export const isMuted = () => muted;

function getPlayer(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.preload = 'auto';
  }
  return player;
}

/** Call from a user gesture (first tap) so iOS lets us play sound later. */
export function unlockAudio() {
  const p = getPlayer();
  if (!p.src) {
    // a tiny silent wav
    p.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    p.play().catch(() => undefined);
  }
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // no Web Audio
  }
}

export function stopSpeech() {
  token++;
  const p = getPlayer();
  p.pause();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}

export function hasClip(text: string, lang: Lang = 'ta'): boolean {
  return !!manifest?.[lang]?.[text.trim()];
}

function deviceVoice(lang: Lang): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const want = lang === 'ta' ? 'ta' : 'en';
  return voices.find((v) => v.lang.toLowerCase().startsWith(want + '-in')) ?? voices.find((v) => v.lang.toLowerCase().startsWith(want)) ?? null;
}

export function canSpeak(text: string, lang: Lang = 'ta'): boolean {
  return hasClip(text, lang) || !!deviceVoice(lang);
}

/** Speak a text; resolves when finished (or immediately if it can't). */
export async function speak(text: string, lang: Lang = 'ta'): Promise<void> {
  if (muted || !text.trim()) return;
  await loadManifest();
  const my = ++token;
  const p = getPlayer();
  p.pause();
  const file = manifest?.[lang]?.[text.trim()];
  if (file) {
    return new Promise((resolve) => {
      const done = () => {
        p.onended = null;
        p.onerror = null;
        resolve();
      };
      p.onended = done;
      p.onerror = done;
      p.src = base + file;
      p.play().catch(done);
    });
  }
  const voice = deviceVoice(lang);
  if (!voice || my !== token) return;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.85;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

/** Speak several texts one after another (stops if something else is spoken). */
export async function speakSequence(items: { text: string; lang?: Lang; pause?: number }[]) {
  const my = token + 1;
  for (const it of items) {
    if (token > my) return;
    await speak(it.text, it.lang ?? 'ta');
    if (it.pause) await new Promise((r) => setTimeout(r, it.pause));
  }
}

// ---------------------------------------------------------------- sound fx

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (!ctx || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

export const sfx = {
  stroke: () => tone(880, 0, 0.12, 'triangle', 0.08),
  good: () => {
    tone(660, 0, 0.12);
    tone(880, 0.1, 0.18);
  },
  bad: () => tone(196, 0, 0.25, 'square', 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.12)),
  tap: () => tone(520, 0, 0.06, 'sine', 0.06),
};

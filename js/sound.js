// Tiny synthesized sound effects (no audio files to download). iPad needs a tap before audio can start.
let ctx = null;
let enabled = true;

export const setSound = (on) => {
  enabled = on;
};

export function unlockAudio() {
  if (ctx || typeof window === 'undefined') return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function play(notes, opts) {
  if (!enabled || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  notes.forEach(([f, s, d]) => tone(f, s, d, opts));
}

export const sfx = {
  tap: () => play([[660, 0, 0.06]], { gain: 0.05 }),
  correct: () => play([[660, 0, 0.14], [880, 0.1, 0.22]]),
  wrong: () => play([[220, 0, 0.22]], { type: 'triangle', gain: 0.14 }),
  level: () => play([[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.16], [1047, 0.36, 0.35]]),
  done: () => play([[784, 0, 0.14], [1047, 0.12, 0.3]]),
};

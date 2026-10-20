// Seeded random helpers. Every generator takes an rng so questions are reproducible in tests.

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Integer in [a, b], inclusive. */
export const int = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export const chance = (rng, p) => rng() < p;

export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** k distinct items from arr. */
export const sample = (rng, arr, k) => shuffle(rng, arr).slice(0, k);

/** Pick from items using parallel weights. */
export function weighted(rng, items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

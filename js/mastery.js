// Adaptive difficulty and spaced review. Pure functions over plain objects so they are easy to test.
import { weighted } from './rng.js';

export const LEVEL_UP = { window: 10, need: 8, min: 8 };
export const LEVEL_DOWN_AFTER = 3; // questions in a row failed even after the hint

export const newSkill = (level = 1) => ({ level, attempts: 0, correct: 0, recent: [], window: [], failRun: 0, last: 0, mastered: false });

/**
 * Record one answer for a skill.
 *  correct — right on the first try without "show me"
 *  failed  — still wrong after the second try (only these push the level down)
 * Questions below the current level are review: they count in stats but never move the level.
 * Returns 'up' | 'down' | 'mastered' | null.
 */
export function applyResult(p, { level, correct, failed = !correct }, maxLevel, now = Date.now()) {
  p.attempts += 1;
  if (correct) p.correct += 1;
  p.recent.push(correct ? 1 : 0);
  if (p.recent.length > 20) p.recent.shift();
  p.last = now;
  if (level !== p.level) return null;

  p.window.push(correct ? 1 : 0);
  if (p.window.length > LEVEL_UP.window) p.window.shift();
  p.failRun = correct ? 0 : failed ? p.failRun + 1 : p.failRun;

  const hits = p.window.reduce((a, b) => a + b, 0);
  if (p.window.length >= LEVEL_UP.min && hits >= LEVEL_UP.need) {
    p.window = [];
    p.failRun = 0;
    if (p.level < maxLevel) {
      p.level += 1;
      return 'up';
    }
    const first = !p.mastered;
    p.mastered = true;
    return first ? 'mastered' : null;
  }
  if (p.failRun >= LEVEL_DOWN_AFTER && p.level > 1) {
    p.level -= 1;
    p.window = [];
    p.failRun = 0;
    return 'down';
  }
  return null;
}

export const accuracy = (p) => (p && p.recent.length ? p.recent.reduce((a, b) => a + b, 0) / p.recent.length : null);

/** Progress through the current level, 0..1, for the level bar. */
export const levelProgress = (p) => Math.min(1, (p?.window || []).reduce((a, b) => a + b, 0) / LEVEL_UP.need);

// ---------------------------------------------------------------- Leitner boxes for facts

const MIN = 60e3;
const DAY = 864e5;
export const BOX_WAIT = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY];

export function reviewFact(f, correct, now = Date.now()) {
  const r = f || { box: 0, due: 0, seen: 0, miss: 0 };
  r.seen += 1;
  if (correct) r.box = Math.min(5, r.box + 1);
  else {
    r.box = 1;
    r.miss += 1;
  }
  r.due = now + BOX_WAIT[r.box];
  return r;
}

/** Weight for choosing a fact: overdue and shaky facts come up most, solid ones rarely. */
export function factWeight(f, now) {
  if (!f) return 3;
  const due = f.due <= now;
  if (due && f.box <= 2) return 8;
  if (due) return 4;
  return f.box >= 4 ? 0.3 : 1;
}

export function pickFact(facts, pool, now, rng) {
  return weighted(rng, pool, pool.map((c) => factWeight(facts[c.key], now)));
}

export const dueCount = (facts, prefix, now = Date.now()) => Object.entries(facts).filter(([k, f]) => k.startsWith(prefix) && f.due <= now).length;

// Everything lives in one JSON blob in localStorage. Home-screen web apps on iPad are exempt
// from Safari's 7-day storage eviction, but a backup code is still offered in the parent area.
import { SKILLS } from './skills/index.js';
import { newSkill } from './mastery.js';

export const KEY = 'mathclimb:v1';
export const VERSION = 1;

const START_LEVELS = {
  1: {},
  2: { count: 4, place: 3, add: 3, sub: 3, frac: 2, time: 2, logic: 2, story: 2 },
};

export function defaultState(now = Date.now()) {
  return {
    v: VERSION,
    profile: { name: '', grade: 1, createdAt: now },
    settings: { speech: true, sound: true, autoRead: true, showTimer: false, sessionLength: 10, enabled: Object.fromEntries(SKILLS.map((s) => [s.id, true])) },
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, newSkill()])),
    facts: {},
    stars: 0,
    days: {},
    sessions: [],
    tests: [],
    games: { sprint: {}, make10: {} },
  };
}

export function setGrade(state, grade) {
  state.profile.grade = grade;
  for (const s of SKILLS) {
    const p = state.skills[s.id];
    if (p.attempts === 0) p.level = Math.min(s.levels.length, START_LEVELS[grade]?.[s.id] || 1);
  }
}

/** Fill in anything missing so older saves keep working after updates. */
export function normalize(raw, now = Date.now()) {
  const d = defaultState(now);
  if (!raw || typeof raw !== 'object') return d;
  const s = { ...d, ...raw };
  s.profile = { ...d.profile, ...(raw.profile || {}) };
  s.settings = { ...d.settings, ...(raw.settings || {}) };
  s.settings.enabled = { ...d.settings.enabled, ...(raw.settings?.enabled || {}) };
  s.skills = { ...d.skills };
  for (const sk of SKILLS) {
    const p = raw.skills?.[sk.id];
    if (p) s.skills[sk.id] = { ...newSkill(), ...p, level: Math.max(1, Math.min(sk.levels.length, p.level || 1)) };
  }
  s.facts = raw.facts && typeof raw.facts === 'object' ? raw.facts : {};
  s.days = raw.days && typeof raw.days === 'object' ? raw.days : {};
  s.sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  s.tests = Array.isArray(raw.tests) ? raw.tests : [];
  s.games = { ...d.games, ...(raw.games || {}) };
  s.stars = Number(raw.stars) || 0;
  s.v = VERSION;
  return s;
}

const memory = new Map();
const fallbackStorage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: (k) => memory.delete(k) };

function storage() {
  try {
    const ls = globalThis.localStorage;
    ls.setItem('__mc_probe', '1');
    ls.removeItem('__mc_probe');
    return ls;
  } catch {
    return fallbackStorage;
  }
}

export function load(store = storage()) {
  try {
    const raw = store.getItem(KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

export function save(state, store = storage()) {
  try {
    store.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- backup codes

const toB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const fromB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

export const exportCode = (state) => `MC1.${toB64(JSON.stringify(state))}`;

export function importCode(code) {
  const c = String(code || '').trim().replace(/\s+/g, '');
  if (!c.startsWith('MC1.')) throw new Error('That is not a Math Climb backup code. It should start with MC1.');
  let raw;
  try {
    raw = JSON.parse(fromB64(c.slice(4)));
  } catch {
    throw new Error('The backup code is incomplete. Copy the whole code and try again.');
  }
  if (!raw || !raw.skills) throw new Error('The backup code has no progress in it.');
  return normalize(raw);
}

// ---------------------------------------------------------------- days & streaks

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDay(state, { q = 0, c = 0, ms = 0 }, now = Date.now()) {
  const k = dayKey(now);
  const d = state.days[k] || { q: 0, c: 0, ms: 0 };
  d.q += q;
  d.c += c;
  d.ms += ms;
  state.days[k] = d;
}

/** Consecutive days with practice, counting back from today (or yesterday if today has none yet). */
export function streak(days, now = Date.now()) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0); // noon, so daylight-saving shifts never skip a day
  const has = () => (days[dayKey(d.getTime())]?.q || 0) > 0;
  if (!has()) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has()) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const daysSince = (ts, now = Date.now()) => (ts ? Math.floor((now - ts) / 864e5) : Infinity);

/**
 * Progress and settings, kept in this browser's localStorage (on the iPad).
 * Export/import in the parent screen moves it to another device.
 */
import { useSyncExternalStore } from 'react';
import type { Strictness } from './strokeMatch';

export interface LetterStat {
  attempts: number; // letters written
  mistakes: number; // stroke mistakes in total
  best: number; // best stars (0–3)
  last: number; // timestamp
}

export interface Settings {
  strictness: Strictness;
  pencilOnly: boolean;
  englishPrompts: boolean;
  showRoman: boolean;
  showEnglish: boolean;
  childName: string;
  leftHanded: boolean;
}

export interface NotebookPage {
  id: string;
  created: number;
  image: string; // PNG data URL
}

export interface MyStory {
  id: string;
  created: number;
  picture: string;
  sentences: string[];
}

export interface Progress {
  version: 1;
  lessons: Record<string, { stars: number; done: number }>;
  letters: Record<string, LetterStat>;
  words: Record<string, { right: number; wrong: number }>;
  stars: number;
  days: string[]; // dates practised (YYYY-MM-DD)
  settings: Settings;
  notebook: NotebookPage[];
  myStories: MyStory[];
}

const KEY = 'tamil-padi-progress-v1';

export const DEFAULT_SETTINGS: Settings = {
  strictness: 'normal',
  pencilOnly: false,
  englishPrompts: true,
  showRoman: true,
  showEnglish: true,
  childName: '',
  leftHanded: false,
};

function fresh(): Progress {
  return { version: 1, lessons: {}, letters: {}, words: {}, stars: 0, days: [], settings: { ...DEFAULT_SETTINGS }, notebook: [], myStories: [] };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as Progress;
    return { ...fresh(), ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
  } catch {
    return fresh();
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable (private mode): keep working in memory
  }
  listeners.forEach((l) => l());
}

export function update(fn: (p: Progress) => void) {
  const next: Progress = typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  fn(next);
  state = next;
  save();
}

export function getProgress(): Progress {
  return state;
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function useSettings(): Settings {
  return useProgress().settings;
}

const today = () => new Date().toISOString().slice(0, 10);

function markDay(p: Progress) {
  const d = today();
  if (!p.days.includes(d)) p.days.push(d);
}

export function recordLetter(letter: string, stars: number, mistakes: number) {
  update((p) => {
    const s = p.letters[letter] ?? { attempts: 0, mistakes: 0, best: 0, last: 0 };
    s.attempts += 1;
    s.mistakes += mistakes;
    s.best = Math.max(s.best, stars);
    s.last = Date.now();
    p.letters[letter] = s;
    markDay(p);
  });
}

export function recordWord(word: string, right: boolean) {
  update((p) => {
    const s = p.words[word] ?? { right: 0, wrong: 0 };
    if (right) s.right += 1;
    else s.wrong += 1;
    p.words[word] = s;
    markDay(p);
  });
}

export function recordLesson(id: string, stars: number) {
  update((p) => {
    const prev = p.lessons[id];
    p.lessons[id] = { stars: Math.max(stars, prev?.stars ?? 0), done: Date.now() };
    p.stars += stars;
    markDay(p);
  });
}

export function setSettings(patch: Partial<Settings>) {
  update((p) => {
    p.settings = { ...p.settings, ...patch };
  });
}

export function streak(p: Progress): number {
  const set = new Set(p.days);
  let n = 0;
  const d = new Date();
  // today counts if practised; otherwise start from yesterday
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function exportProgress(): string {
  return JSON.stringify(state);
}

export function importProgress(json: string): boolean {
  try {
    const p = JSON.parse(json) as Progress;
    if (p.version !== 1 || typeof p.lessons !== 'object') return false;
    state = { ...fresh(), ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
    save();
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  const settings = state.settings;
  state = { ...fresh(), settings };
  save();
}

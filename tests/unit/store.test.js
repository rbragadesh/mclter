import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, normalize, load, save, exportCode, importCode, streak, dayKey, addDay, setGrade, KEY } from '../../js/store.js';
import { SKILLS } from '../../js/skills/index.js';

const memStore = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};

test('default state has every skill at level 1', () => {
  const s = defaultState();
  for (const sk of SKILLS) assert.equal(s.skills[sk.id].level, 1);
  assert.equal(s.settings.sessionLength, 10);
  assert.equal(s.settings.showTimer, false);
});

test('normalize repairs partial and junk saves', () => {
  assert.deepEqual(Object.keys(normalize(null).skills), SKILLS.map((s) => s.id));
  const s = normalize({ profile: { name: 'A' }, skills: { mult: { level: 99 } }, stars: '12', tests: 'nope' });
  assert.equal(s.profile.name, 'A');
  assert.equal(s.profile.grade, 1);
  assert.equal(s.skills.mult.level, 6, 'clamped to the top level');
  assert.equal(s.skills.add.level, 1);
  assert.deepEqual(s.tests, []);
  assert.equal(s.stars, 12);
});

test('save and load round-trip; corrupt JSON falls back to defaults', () => {
  const st = memStore();
  const s = defaultState();
  s.profile.name = 'Zoë';
  s.stars = 5;
  save(s, st);
  assert.equal(load(st).profile.name, 'Zoë');
  st.setItem(KEY, '{broken');
  assert.equal(load(st).profile.name, '');
});

test('backup code round-trips, including non-English names', () => {
  const s = defaultState();
  s.profile.name = 'अनिका 🌟';
  s.stars = 321;
  s.facts['m:3x4'] = { box: 3, due: 1, seen: 4, miss: 1 };
  const code = exportCode(s);
  assert.match(code, /^MC1\./);
  const back = importCode(`  ${code.slice(0, 40)}\n${code.slice(40)}  `);
  assert.equal(back.profile.name, 'अनिका 🌟');
  assert.equal(back.stars, 321);
  assert.equal(back.facts['m:3x4'].box, 3);
});

test('bad backup codes give a clear message', () => {
  assert.throws(() => importCode('hello'), /should start with MC1/);
  assert.throws(() => importCode('MC1.@@@'), /incomplete/);
  assert.throws(() => importCode(`MC1.${btoa('{"a":1}')}`), /no progress/);
});

test('streak counts consecutive days and tolerates no practice yet today', () => {
  const s = defaultState();
  const day = (offset) => {
    const d = new Date(2026, 9, 20, 12);
    d.setDate(d.getDate() - offset);
    return d.getTime();
  };
  const now = day(0);
  [1, 2, 3].forEach((o) => addDay(s, { q: 5 }, day(o)));
  assert.equal(streak(s.days, now), 3, 'yesterday, and the two days before');
  addDay(s, { q: 1 }, now);
  assert.equal(streak(s.days, now), 4);
  addDay(s, { q: 1 }, day(5));
  assert.equal(streak(s.days, now), 4, 'gap on day 4 stops the count');
  assert.equal(dayKey(now), '2026-10-20');
});

test('choosing grade 2 lifts only topics not started', () => {
  const s = defaultState();
  s.skills.add.attempts = 4;
  setGrade(s, 2);
  assert.equal(s.skills.count.level, 4);
  assert.equal(s.skills.add.level, 1, 'already started: left alone');
  assert.equal(s.skills.mult.level, 1);
});

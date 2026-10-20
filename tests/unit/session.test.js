import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, practicePlan, mixPlan, weeklyPlan, olympiadPlan, tablesTestPlan, tablePlan } from '../../js/session.js';
import { defaultState } from '../../js/store.js';
import { SKILLS } from '../../js/skills/index.js';
import { mulberry32 } from '../../js/rng.js';

const wrongFor = (q) => (q.kind === 'number' ? String(q.answer + 1) : q.choices.find((c) => String(c.value) !== String(q.answer)).value);

test('a perfect practice session earns a star per question and climbs a level', () => {
  const state = defaultState();
  const s = new Session({ state, plan: practicePlan('add', 10), rng: mulberry32(1) });
  for (let q = s.next(); q; q = s.next()) {
    const r = s.submit(String(q.answer));
    assert.ok(r.ok && r.final);
  }
  const sum = s.finish();
  assert.equal(sum.correct, 10);
  assert.equal(state.stars, 10);
  assert.ok(state.skills.add.level >= 2, `level ${state.skills.add.level}`);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.tests.length, 0);
});

test('a wrong answer gets a second try, then the question comes back later', () => {
  const state = defaultState();
  const s = new Session({ state, plan: practicePlan('mult', 5), rng: mulberry32(2) });
  const q = s.next();
  const r1 = s.submit(wrongFor(q));
  assert.deepEqual([r1.ok, r1.final], [false, false]);
  const r2 = s.submit(wrongFor(q));
  assert.deepEqual([r2.ok, r2.final], [false, true]);
  assert.equal(s.total, 6, 'one retry was added');
  const seen = [];
  for (let x = s.next(); x; x = s.next()) {
    seen.push(x);
    s.submit(String(x.answer));
  }
  assert.ok(seen.some((x) => x.again && x.sig === q.sig), 'the missed question was asked again');
  assert.equal(state.stars, 4, 'no star for the missed one or its retry');
});

test('"Show me" removes the star but does not count as a failure', () => {
  const state = defaultState();
  const s = new Session({ state, plan: practicePlan('count', 1), rng: mulberry32(3) });
  const q = s.next();
  s.showMe();
  const r = s.submit(String(q.answer));
  assert.ok(r.ok);
  assert.equal(r.star, 0);
  assert.equal(state.skills.count.failRun, 0);
});

test('tests: one try, no stars, no level change, saved to history', () => {
  const state = defaultState();
  const s = new Session({ state, kind: 'test', type: 'weekly', title: 'Weekly', plan: weeklyPlan(state, 20, mulberry32(4)), rng: mulberry32(4) });
  let i = 0;
  for (let q = s.next(); q; q = s.next()) {
    const r = s.submit(i++ % 2 ? String(q.answer) : wrongFor(q));
    assert.ok(r.final);
  }
  s.finish();
  assert.equal(state.stars, 0);
  assert.ok(SKILLS.every((sk) => state.skills[sk.id].level === 1));
  assert.equal(state.tests.length, 1);
  const t = state.tests[0];
  assert.equal(t.n, 20);
  assert.equal(t.c, 10);
  assert.equal(t.wrong.length, 10);
  assert.ok(t.wrong.every((w) => w.answer && w.given));
});

test('weekly check-up covers every enabled topic', () => {
  const state = defaultState();
  state.settings.enabled.time = false;
  const plan = weeklyPlan(state, 20, mulberry32(5));
  assert.equal(plan.length, 20);
  const ids = new Set(plan.map((p) => p.skill));
  assert.ok(!ids.has('time'));
  assert.equal(ids.size, SKILLS.length - 1);
});

test('olympiad mock has 5+5+5 questions worth 30 points', () => {
  const plan = olympiadPlan(defaultState(), mulberry32(6));
  assert.equal(plan.length, 15);
  assert.equal(plan.reduce((s, p) => s + p.points, 0), 30);
  assert.deepEqual([...new Set(plan.map((p) => p.section))], ['A', 'B', 'C']);
  assert.ok(plan.filter((p) => p.section === 'C').every((p) => p.level >= 3));
});

test('daily mix skips switched-off topics and spreads questions', () => {
  const state = defaultState();
  for (const sk of SKILLS) state.settings.enabled[sk.id] = ['add', 'sub', 'mult'].includes(sk.id);
  const plan = mixPlan(state, 10, mulberry32(7));
  assert.equal(plan.length, 10);
  assert.ok(plan.every((p) => ['add', 'sub', 'mult'].includes(p.skill)));
  const counts = plan.reduce((m, p) => ({ ...m, [p.skill]: (m[p.skill] || 0) + 1 }), {});
  assert.ok(Object.values(counts).every((c) => c <= 4), JSON.stringify(counts));
});

test('table practice feeds the fact scheduler but never moves the level', () => {
  const state = defaultState();
  const s = new Session({ state, plan: tablePlan(6, 15, mulberry32(8)), rng: mulberry32(8) });
  for (let q = s.next(); q; q = s.next()) s.submit(String(q.answer));
  assert.equal(state.skills.mult.level, 1);
  assert.ok(Object.keys(state.facts).some((k) => k.includes('6')));
});

test('times-table test uses only the chosen tables', () => {
  const state = defaultState();
  const s = new Session({ state, kind: 'test', type: 'tables', plan: tablesTestPlan([3, 4], 20, mulberry32(9)), rng: mulberry32(9) });
  for (let q = s.next(); q; q = s.next()) {
    const factors = q.fact.slice(2).split('x').map(Number);
    assert.ok(factors.includes(3) || factors.includes(4), `${q.math} is not in the 3 or 4 table`);
    s.submit(String(q.answer));
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyResult, newSkill, reviewFact, pickFact, factWeight, BOX_WAIT, levelProgress } from '../../js/mastery.js';
import { mulberry32 } from '../../js/rng.js';

test('8 right out of the first 8 moves up a level', () => {
  const p = newSkill(1);
  const events = [];
  for (let i = 0; i < 8; i++) events.push(applyResult(p, { level: 1, correct: true }, 5));
  assert.equal(p.level, 2);
  assert.equal(events.filter(Boolean).length, 1);
  assert.equal(events[7], 'up');
  assert.equal(levelProgress(p), 0);
});

test('8 of the last 10 is enough; 7 of 10 is not', () => {
  const p = newSkill(1);
  [1, 1, 0, 1, 1, 0, 1, 1, 0, 1].forEach((c) => applyResult(p, { level: 1, correct: !!c, failed: false }, 5));
  assert.equal(p.level, 1, '7 of 10');
  // the window slides: the two oldest answers were right, so two more right answers keep it at 7
  applyResult(p, { level: 1, correct: true }, 5);
  applyResult(p, { level: 1, correct: true }, 5);
  assert.equal(p.level, 1, 'still 7 of 10');
  applyResult(p, { level: 1, correct: true }, 5);
  assert.equal(p.level, 2, 'the oldest miss slid out: 8 of 10');
});

test('review questions from a lower level never move the level', () => {
  const p = newSkill(3);
  for (let i = 0; i < 20; i++) applyResult(p, { level: 2, correct: true }, 5);
  assert.equal(p.level, 3);
  assert.equal(p.attempts, 20);
});

test('three failures in a row drop a level, never below 1', () => {
  const p = newSkill(2);
  for (let i = 0; i < 3; i++) applyResult(p, { level: 2, correct: false, failed: true }, 5);
  assert.equal(p.level, 1);
  for (let i = 0; i < 6; i++) applyResult(p, { level: 1, correct: false, failed: true }, 5);
  assert.equal(p.level, 1);
});

test('getting it on the second try does not count as a failure', () => {
  const p = newSkill(2);
  for (let i = 0; i < 6; i++) applyResult(p, { level: 2, correct: false, failed: false }, 5);
  assert.equal(p.level, 2);
});

test('top level reports mastered once', () => {
  const p = newSkill(3);
  const ev = [];
  for (let i = 0; i < 20; i++) ev.push(applyResult(p, { level: 3, correct: true }, 3));
  assert.equal(p.level, 3);
  assert.deepEqual(ev.filter(Boolean), ['mastered']);
  assert.ok(p.mastered);
});

test('Leitner boxes: right moves up, wrong goes back to box 1', () => {
  const now = 1_000_000;
  let f = reviewFact(undefined, true, now);
  assert.equal(f.box, 1);
  f = reviewFact(f, true, now);
  f = reviewFact(f, true, now);
  assert.equal(f.box, 3);
  assert.equal(f.due, now + BOX_WAIT[3]);
  f = reviewFact(f, false, now);
  assert.equal(f.box, 1);
  assert.equal(f.miss, 1);
  for (let i = 0; i < 10; i++) f = reviewFact(f, true, now);
  assert.equal(f.box, 5);
});

test('overdue shaky facts are picked far more than solid ones', () => {
  const now = 10 ** 10;
  const pool = [
    { key: 'shaky' },
    { key: 'solid' },
  ];
  const facts = { shaky: { box: 1, due: now - 1, seen: 3, miss: 2 }, solid: { box: 5, due: now + 1e9, seen: 9, miss: 0 } };
  assert.ok(factWeight(facts.shaky, now) > 10 * factWeight(facts.solid, now));
  const rng = mulberry32(42);
  let shaky = 0;
  for (let i = 0; i < 2000; i++) if (pickFact(facts, pool, now, rng).key === 'shaky') shaky++;
  assert.ok(shaky > 1800, `picked shaky ${shaky}/2000`);
});

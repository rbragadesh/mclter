import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, makeQuestion, isCorrect, answerLabel } from '../../js/skills/index.js';
import { mulberry32 } from '../../js/rng.js';
import { outliers } from '../../js/skills/logic.js';
import { addMinutes, timeWords } from '../../js/skills/time.js';
import { factPool, trick } from '../../js/skills/mult.js';

const SEEDS = 400;

function* allQuestions() {
  for (const s of SKILLS) {
    for (let level = 1; level <= s.levels.length; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) yield makeQuestion(s.id, level, mulberry32(seed * 7919 + level * 31));
    }
  }
}

const strings = (q) => [q.text, q.say, q.explain, q.visual, q.hint?.text, q.hint?.visual, ...(Array.isArray(q.math) ? q.math : [q.math]), ...(q.choices || []).flatMap((c) => [c.label, c.html])].filter((x) => x !== undefined && x !== null);

/** Check an arithmetic line like "7 + ? = 10" once ? is replaced by the answer. */
function equationHolds(line, answer) {
  const expr = line.replace('?', String(answer)).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  if (!/^[\d\s+\-*/=]+$/.test(expr)) return null; // not pure arithmetic
  const [l, r] = expr.split('=');
  if (r === undefined) return null;
  const ev = (s) => Function(`return (${s})`)();
  return Math.abs(ev(l) - ev(r)) < 1e-9;
}

test('every skill and level produces well-formed questions', () => {
  let n = 0;
  for (const q of allQuestions()) {
    n++;
    const where = `${q.skill} L${q.level}: ${q.text}`;
    assert.ok(q.text && q.text.length > 2, `text missing — ${where}`);
    assert.ok(['number', 'choice'].includes(q.kind), where);
    for (const s of strings(q)) {
      assert.ok(!/undefined|NaN|\[object/.test(String(s)), `bad string "${String(s).slice(0, 120)}" — ${where}`);
    }
    if (q.visual) assert.match(q.visual, /^<svg /, where);
    if (q.hint?.visual) assert.match(q.hint.visual, /^<svg /, where);
    if (q.kind === 'number') {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0, `answer ${q.answer} — ${where}`);
      assert.ok(isCorrect(q, String(q.answer)), where);
      assert.ok(!isCorrect(q, String(q.answer + 1)), where);
    } else {
      assert.ok(q.choices.length >= 2 && q.choices.length <= 4, `${q.choices.length} choices — ${where}`);
      const values = q.choices.map((c) => String(c.value));
      assert.equal(new Set(values).size, values.length, `duplicate choices — ${where}`);
      assert.equal(values.filter((v) => v === String(q.answer)).length, 1, `answer not in choices exactly once — ${where}`);
      assert.ok(answerLabel(q).length > 0, where);
    }
  }
  assert.ok(n > 20000);
});

test('arithmetic shown on screen agrees with the answer', () => {
  let checked = 0;
  for (const q of allQuestions()) {
    if (q.kind !== 'number' || !q.math) continue;
    const lines = Array.isArray(q.math) ? q.math : [q.math];
    for (const line of lines) {
      const ok = equationHolds(line, q.answer);
      if (ok === null) continue;
      checked++;
      assert.ok(ok, `${q.skill} L${q.level}: "${line}" with answer ${q.answer}`);
    }
  }
  assert.ok(checked > 5000, `only ${checked} equations checked`);
});

test('missing-number sequences follow a single step', () => {
  for (const q of allQuestions()) {
    if (!(q.skill === 'count' && q.level === 5) && !(q.skill === 'mult' && q.level === 3)) continue;
    const seq = q.math.split(', ').map((x) => (x === '?' ? q.answer : Number(x)));
    const step = seq[1] - seq[0];
    seq.forEach((v, i) => i && assert.equal(v - seq[i - 1], step, q.math));
  }
});

test('levels stay inside their grade ranges', () => {
  const range = { 'count:1': [1, 10], 'count:2': [11, 20], 'add:1': [2, 10], 'add:3': [11, 18], 'add:5': [23, 100], 'sub:1': [0, 9], 'mult:4': [1, 100], 'div:6': [1, 5] };
  for (const q of allQuestions()) {
    const r = range[`${q.skill}:${q.level}`];
    if (r) assert.ok(q.answer >= r[0] && q.answer <= r[1], `${q.skill} L${q.level} answer ${q.answer} outside ${r}`);
  }
});

test('fraction choices never include an equivalent of the right answer', () => {
  for (const q of allQuestions()) {
    if (q.skill !== 'frac' || q.kind !== 'choice' || !String(q.answer).includes('/')) continue;
    const [n, d] = String(q.answer).split('/').map(Number);
    for (const c of q.choices) {
      if (String(c.value) === String(q.answer)) continue;
      const [cn, cd] = String(c.value).split('/').map(Number);
      assert.notEqual(cn * d, n * cd, `${c.value} equals ${q.answer}`);
      assert.ok(cn >= 1 && cn <= cd, `${c.value} is not a proper fraction`);
    }
  }
});

test('Yes/No equal-parts buttons keep a fixed order', () => {
  for (let seed = 1; seed < 200; seed++) {
    const q = makeQuestion('frac', 1, mulberry32(seed));
    assert.deepEqual(q.choices.map((c) => c.value), ['yes', 'no']);
  }
});

test('odd-one-out puzzles have exactly one defensible answer', () => {
  let seen = 0;
  for (const q of allQuestions()) {
    if (q.skill !== 'logic' || q.kind !== 'choice' || q.text !== 'Which number does not belong?') continue;
    seen++;
    const nums = q.choices.map((c) => Number(c.value));
    assert.deepEqual([...outliers(nums)], [q.answer], `${nums} → ${q.answer}`);
  }
  assert.ok(seen > 50);
});

test('clock helpers wrap around 12', () => {
  assert.deepEqual(addMinutes(11, 30, 60), [12, 30]);
  assert.deepEqual(addMinutes(12, 30, 60), [1, 30]);
  assert.deepEqual(addMinutes(1, 0, -60), [12, 0]);
  assert.deepEqual(addMinutes(10, 30, 180), [1, 30]);
  assert.equal(timeWords(3, 45), 'quarter to 4');
  assert.equal(timeWords(12, 45), 'quarter to 1');
  assert.equal(timeWords(7, 30), 'half past 7');
});

test('clock answers are real times', () => {
  for (const q of allQuestions()) {
    if (q.skill !== 'time') continue;
    const [h, m] = String(q.answer).split(':').map(Number);
    assert.ok(h >= 1 && h <= 12 && m >= 0 && m < 60 && m % 5 === 0, q.answer);
  }
});

test('multiplication tricks give the right product', () => {
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const t = trick(a, b);
      const nums = t.match(/= (\d+)\.?$/);
      if (nums) assert.equal(Number(nums[1]), a * b, `${a}×${b}: ${t}`);
    }
  }
  assert.equal(factPool([7]).length, 10);
});

test('table practice only asks the chosen table', () => {
  for (let seed = 1; seed < 300; seed++) {
    const q = makeQuestion('mult', 5, mulberry32(seed), { table: 7 });
    assert.match(q.math, /^7 × \d+ = \?$/);
  }
});

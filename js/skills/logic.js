import { int, pick, chance, sample } from '../rng.js';
import { shapePattern, shapeIcon, SHAPES, COLORS, chain, balance, pyramid, objects } from '../visuals.js';
import { numberQ, choiceQ, numChoice } from './util.js';

const FRUIT = ['🍎', '🍌', '🍇', '🍐', '🍉', '🍒', '🥕', '🍋'];
const ANIMALS = ['🐱', '🐶', '🐰', '🐻', '🐸', '🐵'];

const itemKey = (it) => `${it.k}-${it.c}`;
const itemName = (it) => `${it.c} ${it.k}`;

function numberPattern(rng, level) {
  if (level === 2) {
    const step = pick(rng, [1, 2, 3, 5, 10, -1, -2, -5, -10]);
    const start = step > 0 ? int(rng, 0, 20) : int(rng, Math.abs(step) * 6, Math.abs(step) * 6 + 20);
    const seq = Array.from({ length: 6 }, (_, i) => start + i * step);
    return { seq, rule: `${step > 0 ? '+' : '−'}${Math.abs(step)} each time`, diffs: Array(5).fill(`${step > 0 ? '+' : '−'}${Math.abs(step)}`) };
  }
  const kind = pick(rng, ['double', 'grow', 'alt', 'fib']);
  if (kind === 'double') {
    const s = int(rng, 1, 3);
    const seq = Array.from({ length: 6 }, (_, i) => s * 2 ** i);
    return { seq, rule: 'double each time', diffs: Array(5).fill('×2') };
  }
  if (kind === 'grow') {
    const s = int(rng, 1, 5);
    const seq = [s];
    for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + i);
    return { seq, rule: 'add 1, then 2, then 3… one more each time', diffs: [1, 2, 3, 4, 5].map((d) => `+${d}`) };
  }
  if (kind === 'alt') {
    const s = int(rng, 5, 10);
    const up = int(rng, 3, 5);
    const down = int(rng, 1, 2);
    const seq = [s];
    for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? up : -down));
    return { seq, rule: `+${up}, then −${down}, again and again`, diffs: [1, 2, 3, 4, 5].map((i) => (i % 2 ? `+${up}` : `−${down}`)) };
  }
  const [a, b] = pick(rng, [
    [1, 1],
    [1, 2],
    [2, 3],
    [1, 3],
  ]);
  const seq = [a, b];
  for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return { seq, rule: 'add the two numbers before', diffs: null };
}

export default {
  id: 'logic',
  title: 'Puzzles',
  color: 'purple',
  olympiad: true,
  blurb: 'Olympiad-style thinking: patterns, balance scales, number pyramids and clever counting.',
  levels: [
    { name: 'Shape patterns', grade: '1' },
    { name: 'Number patterns', grade: '1' },
    { name: 'Balance & picture equations', grade: '1–2' },
    { name: 'Number pyramids', grade: '1–2' },
    { name: 'Tricky patterns & odd one out', grade: '2' },
    { name: 'Think it through', grade: '2' },
  ],
  generate(level, rng) {
    switch (level) {
      case 1: {
        const unit = pick(rng, ['AB', 'AAB', 'ABB', 'ABC', 'AABB']);
        const kinds = sample(rng, SHAPES, 3);
        const cols = sample(rng, COLORS, 3);
        const items = { A: { k: kinds[0], c: cols[0] }, B: { k: kinds[1], c: cols[1] }, C: { k: kinds[2], c: cols[2] } };
        const len = unit.length * 2 + int(rng, 0, unit.length - 1);
        const seq = Array.from({ length: len }, (_, i) => items[unit[i % unit.length]]);
        const ans = items[unit[len % unit.length]];
        const used = [...new Set(unit)].map((l) => items[l]);
        const extra = { k: pick(rng, SHAPES.filter((k) => !kinds.includes(k))), c: cols[0] };
        const all = [...used, extra];
        return choiceQ(
          rng,
          {
            text: 'What comes next?',
            say: 'Look at the pattern. What shape comes next?',
            visual: shapePattern(seq),
            hint: { text: `Find the part that repeats. It has ${unit.length} shapes.` },
            explain: `The pattern repeats every ${unit.length}. Next is the ${itemName(ans)}.`,
          },
          { value: itemKey(ans), label: itemName(ans), html: shapeIcon(ans) },
          all.filter((it) => itemKey(it) !== itemKey(ans)).map((it) => ({ value: itemKey(it), label: itemName(it), html: shapeIcon(it) })),
        );
      }
      case 2:
      case 5: {
        if (level === 5 && chance(rng, 0.35)) return oddOneOut(rng);
        const { seq, rule, diffs } = numberPattern(rng, level);
        const shown = [...seq.slice(0, 5), null];
        return numberQ({
          text: 'What comes next?',
          say: `What number comes next? ${seq.slice(0, 5).join(', ')}`,
          math: `${seq.slice(0, 5).join(', ')}, ?`,
          visual: chain(shown),
          hint: { text: 'How does each number change?', visual: diffs ? chain(shown, { diffs }) : null },
          answer: seq[5],
          explain: `The rule is: ${rule}. Next is ${seq[5]}.`,
        });
      }
      case 3: {
        const kind = pick(rng, ['same', 'two', 'swap']);
        if (kind === 'same') {
          const e = pick(rng, FRUIT);
          const k = int(rng, 2, 4);
          const v = int(rng, 1, 9);
          return numberQ({
            text: `The scale is balanced. What is one ${e} worth?`,
            say: `${k} of the same fruit balance ${k * v}. What is one fruit worth?`,
            math: `${Array(k).fill(e).join(' + ')} = ${k * v}`,
            visual: balance(Array(k).fill(e), [String(k * v)]),
            hint: { text: `Share ${k * v} equally into ${k} parts.` },
            answer: v,
            explain: `${k} × ${v} = ${k * v}, so one ${e} is ${v}.`,
          });
        }
        if (kind === 'two') {
          const [e1, e2] = sample(rng, ANIMALS, 2);
          const a = int(rng, 1, 9);
          const b = int(rng, 1, 9);
          return numberQ({
            text: `What is ${e2} worth?`,
            say: 'Use the first line to find the first animal. Then find the second animal.',
            math: [`${e1} + ${e1} = ${2 * a}`, `${e1} + ${e2} = ${a + b}`, `${e2} = ?`],
            hint: { text: `First: ${e1} + ${e1} = ${2 * a}, so ${e1} = ${a}.` },
            answer: b,
            explain: `${e1} = ${a}. Then ${a} + ${e2} = ${a + b}, so ${e2} = ${b}.`,
          });
        }
        const [big, small] = sample(rng, FRUIT, 2);
        const m = int(rng, 2, 3);
        const k = int(rng, 2, 4);
        return numberQ({
          text: `1 ${big} balances ${m} ${small}. How many ${small} balance ${k} ${big}?`,
          say: `One big fruit balances ${m} small fruits. How many small fruits balance ${k} big fruits?`,
          visual: balance([big], Array(m).fill(small)),
          hint: { text: `Each ${big} is worth ${m} ${small}. Count by ${m}s, ${k} times.` },
          answer: m * k,
          explain: `${k} × ${m} = ${m * k}.`,
        });
      }
      case 4: {
        const base = [int(rng, 1, 9), int(rng, 1, 9), int(rng, 1, 9)];
        const mid = [base[0] + base[1], base[1] + base[2]];
        const top = mid[0] + mid[1];
        const rows = [[top], [...mid], [...base]];
        const hide = pick(rng, [
          [0, 0],
          [1, 0],
          [1, 1],
          [2, 0],
          [2, 2],
        ]);
        const ans = rows[hide[0]][hide[1]];
        rows[hide[0]][hide[1]] = null;
        return numberQ({
          text: 'Each brick is the sum of the two bricks under it. Find ?',
          say: 'Each brick is the two bricks below it added together. What number goes in the question mark brick?',
          visual: pyramid(rows),
          hint: { text: hide[0] === 2 ? 'Use the brick above it and take away its neighbour.' : 'Add the two bricks underneath.' },
          answer: ans,
          explain: `Bottom ${base.join(', ')} → middle ${mid.join(', ')} → top ${top}.`,
        });
      }
      default:
        return thinkItThrough(rng);
    }
  },
};

const RULES = {
  even: { test: (n) => n % 2 === 0, text: 'even (they end in 0, 2, 4, 6 or 8)' },
  odd: { test: (n) => n % 2 === 1, text: 'odd (they end in 1, 3, 5, 7 or 9)' },
  five: { test: (n) => n % 5 === 0, text: 'in the 5 times table' },
  ten: { test: (n) => n % 10 === 0, text: 'in the 10 times table' },
  small: { test: (n) => n < 10, text: 'one-digit numbers' },
};

/** Every number that some rule singles out. A fair puzzle has exactly one. */
export function outliers(nums) {
  const out = new Set();
  for (const { test } of Object.values(RULES)) {
    const yes = nums.filter(test);
    if (yes.length === 1) out.add(yes[0]);
    if (yes.length === nums.length - 1) out.add(nums.find((n) => !test(n)));
  }
  return out;
}

function oddOneOut(rng) {
  const rule = pick(rng, ['even', 'odd', 'five', 'ten']);
  const { test, text } = RULES[rule];
  for (;;) {
    const fits = [];
    while (fits.length < 3) {
      const n = int(rng, 2, 60);
      if (test(n) && !fits.includes(n)) fits.push(n);
    }
    let odd;
    do odd = int(rng, 2, 60);
    while (test(odd));
    const out = outliers([...fits, odd]);
    if (out.size !== 1 || !out.has(odd)) continue;
    return choiceQ(
      rng,
      {
        text: 'Which number does not belong?',
        say: `Which number does not belong: ${[...fits, odd].join(', ')}?`,
        hint: { text: 'What is the same about three of them?' },
        explain: `${fits.join(', ')} are all ${text}. ${odd} is not.`,
      },
      numChoice(odd),
      fits.map(numChoice),
    );
  }
}

function thinkItThrough(rng) {
  const kind = pick(rng, ['legs', 'symbols', 'wheels']);
  if (kind === 'legs') {
    const c = int(rng, 1, 5);
    const d = int(rng, 1, 4);
    return numberQ({
      text: `${c} 🐔 and ${d} 🐶. How many legs altogether?`,
      say: `There ${c === 1 ? 'is 1 chicken' : `are ${c} chickens`} and ${d} dog${d === 1 ? '' : 's'}. How many legs are there altogether?`,
      visual: objects(c + d, [...Array(c).fill('🐔'), ...Array(d).fill('🐶')], { perRow: 5 }),
      hint: { text: 'A chicken has 2 legs. A dog has 4 legs.' },
      answer: 2 * c + 4 * d,
      explain: `Chickens: ${c} × 2 = ${2 * c}. Dogs: ${d} × 4 = ${4 * d}. Total ${2 * c + 4 * d}.`,
    });
  }
  if (kind === 'wheels') {
    const b = int(rng, 1, 4);
    const a = int(rng, 1, 3);
    return numberQ({
      text: `${b} 🚲 and ${a} 🛺. How many wheels?`,
      say: `There ${b === 1 ? 'is 1 bicycle' : `are ${b} bicycles`} and ${a} auto rickshaw${a === 1 ? '' : 's'}. How many wheels in all?`,
      visual: objects(a + b, [...Array(b).fill('🚲'), ...Array(a).fill('🛺')]),
      hint: { text: 'A bicycle has 2 wheels. An auto rickshaw has 3 wheels.' },
      answer: 2 * b + 3 * a,
      explain: `${b} × 2 = ${2 * b} and ${a} × 3 = ${3 * a}. ${2 * b} + ${3 * a} = ${2 * b + 3 * a}.`,
    });
  }
  const [e1, e2] = sample(rng, ANIMALS, 2);
  const s = int(rng, 2, 6);
  const t = int(rng, 1, 6);
  const askFirst = chance(rng, 0.5);
  return numberQ({
    text: `What is ${askFirst ? e1 : e2} worth?`,
    say: 'Compare the two lines. What changed?',
    math: [`${e1} + ${e1} + ${e2} = ${2 * s + t}`, `${e1} + ${e2} = ${s + t}`, `${askFirst ? e1 : e2} = ?`],
    hint: { text: `The first line has one extra ${e1}. What is the difference between ${2 * s + t} and ${s + t}?` },
    answer: askFirst ? s : t,
    explain: `The extra ${e1} is ${2 * s + t} − ${s + t} = ${s}. Then ${e2} = ${s + t} − ${s} = ${t}.`,
  });
}

import { int, pick, chance, sample } from '../rng.js';
import { fractionShape, fractionBars, groups, fracHTML } from '../visuals.js';
import { THINGS, choiceQ, numberQ } from './util.js';

const PARTS = { 1: ['whole', 'wholes'], 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'] };
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export const fracWords = (n, d) => `${NUM[n]} ${n === 1 ? PARTS[d][0] : PARTS[d][1]}`;
export const fracChoice = (n, d) => ({ value: `${n}/${d}`, label: fracWords(n, d), html: fracHTML(n, d) });

const shapeFor = (rng, d) => pick(rng, [...(d === 4 ? ['grid', 'diag'] : []), ...([6, 8, 9].includes(d) ? ['grid'] : []), 'circle', 'rect']);

function unequalWeights(rng, d) {
  for (;;) {
    const w = Array.from({ length: d }, () => 1 + rng() * 2.5);
    if (Math.max(...w) / Math.min(...w) > 1.7) return w;
  }
}

const shadedIdx = (rng, n, d) => {
  const start = int(rng, 0, d - 1);
  return Array.from({ length: n }, (_, i) => (start + i) % d);
};

export default {
  id: 'frac',
  title: 'Fractions',
  color: 'green',
  blurb: 'Equal parts, halves and quarters, comparing fractions, and fractions of a group.',
  levels: [
    { name: 'Equal parts or not?', grade: '1' },
    { name: 'Halves, thirds, quarters', grade: '1–2' },
    { name: 'Name the fraction', grade: '2–3' },
    { name: 'Find the picture', grade: '2–3' },
    { name: 'Which is bigger?', grade: '3' },
    { name: 'Fraction of a group', grade: '2–3' },
  ],
  generate(level, rng) {
    switch (level) {
      case 1: {
        const d = int(rng, 2, 4);
        const equal = chance(rng, 0.5);
        const shape = pick(rng, ['circle', 'rect']);
        // fixed Yes/No order so the button position never gives the answer away
        return {
          kind: 'choice',
          text: 'Are these equal parts?',
          say: 'Is this shape cut into equal parts? Are all the pieces the same size?',
          visual: fractionShape({ shape, d, weights: equal ? null : unequalWeights(rng, d) }),
          explain: equal ? `Yes! All ${d} parts are the same size.` : 'No. Some parts are bigger than others, so they are not equal parts.',
          answer: equal ? 'yes' : 'no',
          choices: [
            { value: 'yes', label: 'Yes, equal' },
            { value: 'no', label: 'No, not equal' },
          ],
        };
      }
      case 2: {
        const d = int(rng, 2, 4);
        const opts = [fracChoice(1, 2), fracChoice(1, 3), fracChoice(1, 4), d > 2 ? fracChoice(d - 1, d) : fracChoice(2, 3)];
        return choiceQ(
          rng,
          {
            text: 'What part is shaded?',
            say: 'What fraction of the shape is shaded?',
            visual: fractionShape({ shape: shapeFor(rng, d), d, shaded: shadedIdx(rng, 1, d) }),
            hint: { text: `Count all the equal parts. That is the bottom number.` },
            explain: `The shape has ${d} equal parts and 1 is shaded: ${fracWords(1, d)}.`,
          },
          fracChoice(1, d),
          opts,
        );
      }
      case 3: {
        const d = pick(rng, [2, 3, 4, 5, 6, 8]);
        const n = int(rng, 1, d - 1);
        const same = (a, b) => a[0] * b[1] === a[1] * b[0];
        const cands = [
          [d - n, d],
          [n, d - n],
          [n + 1, d],
          [n - 1, d],
          [n, d + 2],
          [n, d + 1],
          [n + 1, d + 1],
        ].filter(([x, y]) => x >= 1 && x < y && PARTS[y] && !same([x, y], [n, d]));
        return choiceQ(
          rng,
          {
            text: 'What fraction is shaded?',
            say: 'What fraction of the shape is shaded?',
            visual: fractionShape({ shape: shapeFor(rng, d), d, shaded: shadedIdx(rng, n, d) }),
            hint: { text: 'Top number: shaded parts. Bottom number: all the equal parts.' },
            explain: `${n} of the ${d} equal parts ${n === 1 ? 'is' : 'are'} shaded: ${n}/${d}.`,
          },
          fracChoice(n, d),
          cands.slice(0, 3).map(([x, y]) => fracChoice(x, y)),
        );
      }
      case 4: {
        const d = pick(rng, [2, 3, 4, 6, 8]);
        const n = d <= 3 ? 1 : int(rng, 1, d - 1);
        const shape = pick(rng, ['circle', 'rect']);
        const wrongD = pick(rng, [2, 3, 4, 5, 6, 8, 10].filter((x) => x !== d && x > n));
        const wrongN = n + 1 <= d ? n + 1 : n - 1;
        const pic = (o) => fractionShape({ shape, size: 120, ...o });
        return choiceQ(
          rng,
          {
            text: `Which picture shows ${n}/${d} shaded?`,
            say: `Which picture shows ${fracWords(n, d)} shaded?`,
            math: fracHTML(n, d),
            hint: { text: `Look for ${d} EQUAL parts with ${n} shaded.` },
            explain: `${n}/${d} means ${d} equal parts with ${n} shaded.`,
          },
          { value: 'right', label: `${d} equal parts, ${n} shaded`, html: pic({ d, shaded: shadedIdx(rng, n, d) }) },
          [
            { value: 'unequal', label: `${d} unequal parts`, html: pic({ d, shaded: shadedIdx(rng, n, d), weights: unequalWeights(rng, d) }) },
            { value: 'wrongD', label: `${wrongD} parts`, html: pic({ d: wrongD, shaded: shadedIdx(rng, n, wrongD) }) },
            { value: 'wrongN', label: `${wrongN} shaded`, html: pic({ d, shaded: shadedIdx(rng, wrongN, d) }) },
          ],
        );
      }
      case 5: {
        let A;
        let B;
        if (chance(rng, 0.5)) {
          const [a, b] = sample(rng, [2, 3, 4, 5, 6, 8, 10], 2);
          A = [1, a];
          B = [1, b];
        } else {
          const d = pick(rng, [3, 4, 5, 6, 8, 10]);
          const n1 = int(rng, 1, d - 1);
          let n2 = int(rng, 1, d - 1);
          while (n2 === n1) n2 = int(rng, 1, d - 1);
          A = [n1, d];
          B = [n2, d];
        }
        const val = (f) => f[0] / f[1];
        const askBig = chance(rng, 0.7);
        const [big, small] = val(A) > val(B) ? [A, B] : [B, A];
        const ans = askBig ? big : small;
        const other = askBig ? small : big;
        const unit = A[0] === 1 && B[0] === 1;
        return choiceQ(
          rng,
          {
            text: `Which is ${askBig ? 'bigger' : 'smaller'}?`,
            say: `Which is ${askBig ? 'bigger' : 'smaller'}, ${fracWords(...A)} or ${fracWords(...B)}?`,
            hint: { text: unit ? 'Fewer pieces means each piece is bigger.' : 'Same size pieces: more pieces is bigger.', visual: fractionBars([{ d: A[1], n: A[0] }, { d: B[1], n: B[0], color: 'orange' }]) },
            explain: unit
              ? `1/${big[1]} is bigger than 1/${small[1]}: when the whole is cut into fewer pieces, each piece is bigger.`
              : `${big[0]}/${big[1]} is bigger than ${small[0]}/${small[1]}: same size pieces, and ${big[0]} is more than ${small[0]}.`,
          },
          fracChoice(...ans),
          [fracChoice(...other)],
        );
      }
      default: {
        const d = pick(rng, [2, 3, 4, 5]);
        const k = int(rng, 2, 5);
        const n = chance(rng, 0.65) ? 1 : int(rng, 1, d - 1);
        const whole = d * k;
        const t = pick(rng, THINGS);
        return numberQ({
          text: `What is ${n}/${d} of ${whole}?`,
          say: `What is ${fracWords(n, d)} of ${whole}?`,
          math: `${fracHTML(n, d)} of ${whole} = ?`,
          visual: groups(d, k, { emoji: t.e, highlight: n }),
          hint: { text: `${whole} split into ${d} equal groups is ${k} in each group. Count ${n} group${n > 1 ? 's' : ''}.` },
          answer: n * k,
          explain: `${whole} ÷ ${d} = ${k} in each group. ${n} group${n > 1 ? 's' : ''} = ${n * k}.`,
        });
      }
    }
  },
};

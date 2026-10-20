import { int, shuffle } from '../rng.js';
import { tenFrames, tenFrameSum, numberBond, numberLine, baseTenRow } from '../visuals.js';
import { numberQ } from './util.js';

export const addKey = (a, b) => `a:${Math.min(a, b)}+${Math.max(a, b)}`;

export default {
  id: 'add',
  title: 'Addition',
  color: 'red',
  blurb: 'Put groups together with ten-frames, number bonds and number lines.',
  levels: [
    { name: 'Add within 10', grade: '1' },
    { name: 'Make 10', grade: '1' },
    { name: 'Add within 20 (make-10 trick)', grade: '1' },
    { name: '2-digit + 1-digit', grade: '1–2' },
    { name: '2-digit + 2-digit', grade: '2' },
    { name: 'Three numbers (find the 10!)', grade: '1–2' },
  ],
  generate(level, rng, ctx = {}) {
    switch (level) {
      case 1: {
        const pair = ctx.pickFact ? ctx.pickFact(within10Facts) : within10Facts[int(rng, 0, within10Facts.length - 1)];
        const [a, b] = rng() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];
        return numberQ({
          text: 'Put them together.',
          say: `What is ${a} plus ${b}?`,
          math: `${a} + ${b} = ?`,
          visual: tenFrameSum(a, b),
          hint: { text: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.` },
          answer: a + b,
          explain: `${a} red and ${b} blue make ${a + b}.`,
          fact: addKey(a, b),
        });
      }
      case 2: {
        const a = int(rng, 1, 9);
        return numberQ({
          text: 'How many more to make 10?',
          say: `${a} plus what makes 10?`,
          math: `${a} + ? = 10`,
          visual: tenFrames(Array(a).fill('red'), { frames: 1 }),
          hint: { text: 'Count the empty boxes.', visual: numberBond(10, a, null) },
          answer: 10 - a,
          explain: `${a} and ${10 - a} make 10.`,
        });
      }
      case 3: {
        const pair = ctx.pickFact ? ctx.pickFact(bridgeFacts) : bridgeFacts[int(rng, 0, bridgeFacts.length - 1)];
        const [a, b] = rng() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const fill = 10 - big;
        return numberQ({
          text: 'Add them. Fill the first frame!',
          say: `What is ${a} plus ${b}?`,
          math: `${a} + ${b} = ?`,
          visual: tenFrameSum(big, small),
          hint: { text: `Make 10 first: ${big} + ${fill} = 10. Then ${small - fill} more.` },
          answer: a + b,
          explain: `${big} + ${fill} = 10, and 10 + ${small - fill} = ${a + b}.`,
          fact: addKey(a, b),
        });
      }
      case 4: {
        const a = int(rng, 10, 89);
        const b = int(rng, 1, 9);
        return numberQ({
          text: 'Add the ones to the number.',
          say: `What is ${a} plus ${b}?`,
          math: `${a} + ${b} = ?`,
          visual: baseTenRow([a, '+', b]),
          hint: { text: `Start at ${a} and jump ${b}.`, visual: numberLine(a - 1, a + 11, { points: [a], jumps: [{ from: a, to: a + b, label: `+${b}` }] }) },
          answer: a + b,
          explain: `${a} + ${b} = ${a + b}.`,
        });
      }
      case 5: {
        const a = int(rng, 12, 78);
        const b = int(rng, 11, 100 - a);
        const at = a - (a % 10);
        const bt = b - (b % 10);
        return numberQ({
          text: 'Add tens, then ones.',
          say: `What is ${a} plus ${b}?`,
          math: `${a} + ${b} = ?`,
          visual: baseTenRow([a, '+', b]),
          hint: { text: `Tens: ${at} + ${bt} = ${at + bt}. Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.` },
          answer: a + b,
          explain: `${at + bt} + ${(a % 10) + (b % 10)} = ${a + b}.`,
        });
      }
      default: {
        const x = int(rng, 1, 9);
        const y = 10 - x;
        const z = int(rng, 1, 9);
        const order = shuffle(rng, [x, y, z]);
        return numberQ({
          text: 'Add all three. Look for a 10!',
          say: `What is ${order.join(' plus ')}?`,
          math: `${order.join(' + ')} = ?`,
          visual: tenFrameSum(x, y, z),
          hint: { text: 'Find two numbers that make 10, then add the last one.' },
          answer: x + y + z,
          explain: `${x} + ${y} = 10, and 10 + ${z} = ${10 + z}.`,
        });
      }
    }
  },
};

// Fact pools (each unordered pair once) so the review scheduler can track them.
export const within10Facts = [];
for (let a = 1; a <= 9; a++) for (let b = a; a + b <= 10; b++) within10Facts.push({ a, b, key: addKey(a, b) });

export const bridgeFacts = [];
for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) if (a + b > 10) bridgeFacts.push({ a, b, key: addKey(a, b) });

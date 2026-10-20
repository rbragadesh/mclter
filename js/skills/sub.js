import { int, pick } from '../rng.js';
import { objects, tenFrames, numberBond, numberLine, baseTen } from '../visuals.js';
import { THINGS, numberQ } from './util.js';

export default {
  id: 'sub',
  title: 'Subtraction',
  color: 'orange',
  blurb: 'Take away, count back on the number line, and find the missing part.',
  levels: [
    { name: 'Take away within 10', grade: '1' },
    { name: 'Subtract within 20', grade: '1' },
    { name: 'Missing part', grade: '1' },
    { name: '2-digit − 1-digit', grade: '1–2' },
    { name: '2-digit − 2-digit', grade: '2' },
  ],
  generate(level, rng) {
    switch (level) {
      case 1: {
        const a = int(rng, 2, 10);
        const b = int(rng, 1, a);
        const t = pick(rng, THINGS);
        return numberQ({
          text: `Take away ${b}. How many are left?`,
          say: `There are ${a} ${t.many}. Take away ${b}. How many are left?`,
          math: `${a} − ${b} = ?`,
          visual: objects(a, t.e, { crossed: b }),
          hint: { text: 'Count the ones that are NOT crossed out.' },
          answer: a - b,
          explain: `${a} take away ${b} leaves ${a - b}.`,
        });
      }
      case 2: {
        const a = int(rng, 11, 20);
        const b = int(rng, 2, 9);
        const counters = [...Array(a - b).fill('orange'), ...Array(b).fill('x:orange')];
        return numberQ({
          text: 'Cross out and count what is left.',
          say: `What is ${a} minus ${b}?`,
          math: `${a} − ${b} = ?`,
          visual: tenFrames(counters),
          hint: { text: `Start at ${a} and jump back ${b}.`, visual: numberLine(0, 20, { points: [a], jumps: [{ from: a, to: a - b, label: `−${b}` }] }) },
          answer: a - b,
          explain: `${a} − ${b} = ${a - b}.`,
        });
      }
      case 3: {
        const c = int(rng, 6, 20);
        const b = int(rng, 1, c - 1);
        const addForm = rng() < 0.5;
        return numberQ({
          text: 'Find the missing number.',
          say: addForm ? `What plus ${b} makes ${c}?` : `${c} minus what equals ${b}?`,
          math: addForm ? `? + ${b} = ${c}` : `${c} − ? = ${b}`,
          visual: numberBond(c, b, null),
          hint: { text: `Count up from ${b} to ${c}.`, visual: numberLine(0, 20, { points: [b], jumps: [{ from: b, to: c, label: '?' }] }) },
          answer: c - b,
          explain: `${b} + ${c - b} = ${c}, so the missing number is ${c - b}.`,
        });
      }
      case 4: {
        const a = int(rng, 21, 99);
        const b = int(rng, 2, 9);
        return numberQ({
          text: 'Take away the ones.',
          say: `What is ${a} minus ${b}?`,
          math: `${a} − ${b} = ?`,
          visual: baseTen(a),
          hint: { text: `Start at ${a} and jump back ${b}.`, visual: numberLine(a - 11, a + 1, { points: [a], jumps: [{ from: a, to: a - b, label: `−${b}` }] }) },
          answer: a - b,
          explain: `${a} − ${b} = ${a - b}.`,
        });
      }
      default: {
        const a = int(rng, 31, 99);
        const b = int(rng, 11, a - 1);
        const bt = b - (b % 10);
        return numberQ({
          text: 'Take away tens, then ones.',
          say: `What is ${a} minus ${b}?`,
          math: `${a} − ${b} = ?`,
          visual: baseTen(a),
          hint: { text: b % 10 ? `First ${a} − ${bt} = ${a - bt}. Then take away ${b % 10} more.` : `Take away ${bt / 10} tens. The ones stay the same.` },
          answer: a - b,
          explain: b % 10 ? `${a} − ${bt} = ${a - bt}, then ${a - bt} − ${b % 10} = ${a - b}.` : `${a} − ${bt} = ${a - b}.`,
        });
      }
    }
  },
};

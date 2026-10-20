import { int, pick, chance } from '../rng.js';
import { groups, array, numberLine, chain } from '../visuals.js';
import { THINGS, numberQ } from './util.js';

export const multKey = (a, b) => `m:${Math.min(a, b)}x${Math.max(a, b)}`;

export function factPool(tables) {
  const out = [];
  for (const a of tables) for (let b = 1; b <= 10; b++) out.push({ a, b, key: multKey(a, b) });
  return out;
}

/** A thinking strategy for a × b, so a wrong answer teaches something. */
export function trick(a, b) {
  const [t, n] = [2, 5, 10, 9, 4, 3].includes(a) ? [a, b] : [b, a];
  switch (t) {
    case 2:
      return `× 2 is doubling: ${n} + ${n} = ${2 * n}.`;
    case 10:
      return `× 10: put a zero on the end. ${n} → ${10 * n}.`;
    case 5:
      return `× 5 is half of × 10: ${n} × 10 = ${10 * n}, half is ${5 * n}.`;
    case 9:
      return `× 9 is × 10 take away one group: ${10 * n} − ${n} = ${9 * n}.`;
    case 4:
      return `× 4 is double, then double again: ${n} → ${2 * n} → ${4 * n}.`;
    case 3:
      return `× 3 is double plus one more group: ${2 * n} + ${n} = ${3 * n}.`;
    default:
      if (n === 1 || t === 1) return `Anything × 1 stays the same.`;
      return `Split it: ${t} × ${n} = 5 × ${n} + ${t - 5} × ${n} = ${5 * n} + ${(t - 5) * n} = ${t * n}.`;
  }
}

export default {
  id: 'mult',
  title: 'Multiplication',
  color: 'blue',
  blurb: 'Equal groups, arrays, skip counting, then the times tables.',
  levels: [
    { name: 'Equal groups', grade: '1–2' },
    { name: 'Arrays (rows and columns)', grade: '2' },
    { name: 'Skip counting', grade: '2' },
    { name: 'Tables 2, 3, 4, 5, 10', grade: '2–3' },
    { name: 'All tables to 10', grade: '3' },
    { name: 'Missing factor', grade: '3' },
  ],
  generate(level, rng, ctx = {}) {
    const pickFact = (pool) => (ctx.pickFact ? ctx.pickFact(pool) : pick(rng, pool));
    switch (level) {
      case 1: {
        const g = int(rng, 2, 5);
        const per = pick(rng, [2, 3, 4, 5, 10]);
        const t = pick(rng, THINGS);
        const p = g * per;
        return numberQ({
          text: `How many ${t.many} in all?`,
          say: `There are ${g} plates with ${per} ${t.many} on each. How many ${t.many} in all?`,
          math: `${g} groups of ${per}`,
          visual: groups(g, per, { emoji: t.e }),
          hint: { text: `Count by ${per}s: ${Array.from({ length: g }, (_, i) => per * (i + 1)).join(', ')}.` },
          answer: p,
          explain: `${Array(g).fill(per).join(' + ')} = ${p}. We write ${g} × ${per} = ${p}.`,
        });
      }
      case 2: {
        const rows = int(rng, 2, 5);
        const cols = pick(rng, [2, 3, 4, 5, 6, 10]);
        const p = rows * cols;
        return numberQ({
          text: `${rows} rows of ${cols}. How many dots?`,
          say: `There are ${rows} rows with ${cols} dots in each row. How many dots?`,
          math: `${rows} × ${cols} = ?`,
          visual: array(rows, cols),
          hint: { text: `Count by ${cols}s, one row at a time.`, visual: array(rows, cols, { rowSums: true }) },
          answer: p,
          explain: `${rows} rows of ${cols} is ${p}. ${rows} × ${cols} = ${p}.`,
          fact: multKey(rows, cols),
        });
      }
      case 3: {
        const step = pick(rng, [2, 3, 4, 5, 10]);
        const k0 = int(rng, 1, 4);
        const seq = [0, 1, 2, 3, 4].map((i) => step * (k0 + i));
        const blank = int(rng, 1, 4);
        const shown = seq.map((v, i) => (i === blank ? null : v));
        return numberQ({
          text: `Count by ${step}s. What is missing?`,
          say: `Count by ${step}s. What number is missing?`,
          math: shown.map((v) => (v === null ? '?' : v)).join(', '),
          visual: chain(shown),
          hint: {
            text: `Jump ${step} each time.`,
            visual: numberLine(0, step * (k0 + 5), { labelEvery: step, jumps: seq.slice(0, 4).map((v) => ({ from: v, to: v + step, label: `+${step}` })), unknown: seq[blank] }),
          },
          answer: seq[blank],
          explain: `${seq.join(', ')} — each jump is ${step}.`,
        });
      }
      case 4:
      case 5: {
        const tables = ctx.table ? [ctx.table] : level === 4 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10];
        const f = pickFact(factPool(tables));
        const [a, b] = ctx.table || chance(rng, 0.5) ? [f.a, f.b] : [f.b, f.a];
        return numberQ({
          text: 'Times table',
          say: `What is ${a} times ${b}?`,
          math: `${a} × ${b} = ?`,
          hint: { text: trick(a, b), visual: array(Math.min(a, b), Math.max(a, b), { rowSums: true, size: 30 }) },
          answer: a * b,
          explain: `${a} × ${b} = ${a * b}. ${trick(a, b)}`,
          fact: multKey(a, b),
        });
      }
      default: {
        const f = pickFact(factPool(ctx.table ? [ctx.table] : [2, 3, 4, 5, 6, 7, 8, 9, 10]));
        const { a, b } = f;
        const p = a * b;
        const left = chance(rng, 0.5);
        return numberQ({
          text: 'Find the missing number.',
          say: left ? `What times ${b} equals ${p}?` : `${a} times what equals ${p}?`,
          math: left ? `? × ${b} = ${p}` : `${a} × ? = ${p}`,
          hint: { text: left ? `Count by ${b}s until you reach ${p}.` : `Count by ${a}s until you reach ${p}.`, visual: array(a, b, { size: 30 }) },
          answer: left ? a : b,
          explain: `${a} × ${b} = ${p}.`,
          fact: multKey(a, b),
        });
      }
    }
  },
};

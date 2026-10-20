import { int, pick, chance } from '../rng.js';
import { groups, array, objects } from '../visuals.js';
import { THINGS, numberQ } from './util.js';

export const divKey = (p, a) => `d:${p}/${a}`;

export function divPool(tables) {
  const out = [];
  for (const a of tables) for (let b = 1; b <= 10; b++) out.push({ a, b, key: divKey(a * b, a) });
  return out;
}

export default {
  id: 'div',
  title: 'Division',
  color: 'purple',
  blurb: 'Share equally, make groups, and use times tables backwards.',
  levels: [
    { name: 'Share equally', grade: '1–2' },
    { name: 'Make equal groups', grade: '2' },
    { name: 'Division from arrays', grade: '2–3' },
    { name: 'Divide by 2, 3, 4, 5, 10', grade: '3' },
    { name: 'Divide by any table', grade: '3' },
    { name: 'Left over (remainders)', grade: '3' },
  ],
  generate(level, rng, ctx = {}) {
    const t = pick(rng, THINGS);
    switch (level) {
      case 1: {
        const k = int(rng, 2, 4);
        const q = int(rng, 1, 5);
        const total = k * q;
        return numberQ({
          text: `Share ${total} equally ${k === 2 ? 'between' : 'among'} ${k} friends. How many each?`,
          say: `Share ${total} ${t.many} equally ${k === 2 ? 'between' : 'among'} ${k} friends. How many does each friend get?`,
          math: `${total} ÷ ${k} = ?`,
          visual: objects(total, t.e),
          hint: { text: 'Give one to each friend, again and again, until none are left.', visual: groups(k, q, { emoji: t.e }) },
          answer: q,
          explain: `Each friend gets ${q}. ${total} ÷ ${k} = ${q}.`,
        });
      }
      case 2: {
        const s = int(rng, 2, 5);
        const c = int(rng, 2, 5);
        const total = s * c;
        return numberQ({
          text: `${total} ${t.many}. Put ${s} in each bag. How many bags?`,
          say: `There are ${total} ${t.many}. Put ${s} in each bag. How many bags do you need?`,
          math: `${total} ÷ ${s} = ?`,
          visual: objects(total, t.e),
          hint: { text: `Circle groups of ${s}. Count the groups.`, visual: groups(c, s, { emoji: t.e }) },
          answer: c,
          explain: `${c} bags of ${s} make ${total}. ${total} ÷ ${s} = ${c}.`,
        });
      }
      case 3: {
        const r = int(rng, 2, 5);
        const c = int(rng, 2, 6);
        const total = r * c;
        return numberQ({
          text: `${total} dots in ${r} equal rows. How many in each row?`,
          say: `There are ${total} dots in ${r} equal rows. How many dots are in each row?`,
          math: `${total} ÷ ${r} = ?`,
          visual: array(r, c, { color: 'purple' }),
          hint: { text: `Count the dots in one row.` },
          answer: c,
          explain: `${r} rows of ${c} is ${total}, so ${total} ÷ ${r} = ${c}.`,
        });
      }
      case 4:
      case 5: {
        const tables = ctx.table ? [ctx.table] : level === 4 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10];
        const pool = divPool(tables);
        const f = ctx.pickFact ? ctx.pickFact(pool) : pick(rng, pool);
        const p = f.a * f.b;
        return numberQ({
          text: 'Division fact',
          say: `What is ${p} divided by ${f.a}?`,
          math: `${p} ÷ ${f.a} = ?`,
          hint: { text: `Think: ${f.a} × ? = ${p}`, visual: array(f.a, f.b, { color: 'purple', size: 30 }) },
          answer: f.b,
          explain: `${f.a} × ${f.b} = ${p}, so ${p} ÷ ${f.a} = ${f.b}.`,
          fact: f.key,
        });
      }
      default: {
        const k = int(rng, 2, 5);
        const q = int(rng, 1, 5);
        const rem = int(rng, 1, k - 1);
        const total = k * q + rem;
        const askLeft = chance(rng, 0.5);
        return numberQ({
          text: askLeft ? `Share ${total} among ${k} kids. How many are left over?` : `Share ${total} among ${k} kids. How many does each kid get?`,
          say: `Share ${total} ${t.many} equally among ${k} kids. ${askLeft ? 'How many are left over?' : 'How many does each kid get?'}`,
          visual: objects(total, t.e),
          hint: { text: `Deal them out one at a time. Stop when you can't give everyone one more.`, visual: groups(k, q, { emoji: t.e, leftover: rem }) },
          answer: askLeft ? rem : q,
          explain: `Each kid gets ${q} and ${rem} ${rem === 1 ? 'is' : 'are'} left over. ${k} × ${q} + ${rem} = ${total}.`,
        });
      }
    }
  },
};

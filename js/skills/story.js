import { int, pick } from '../rng.js';
import { objects, objectGroups, groups, barPartWhole, barCompare, queue, ribbon, numberLine } from '../visuals.js';
import { THINGS, twoNames, ordinal, numberQ } from './util.js';

export default {
  id: 'story',
  title: 'Story Problems',
  color: 'blue',
  olympiad: true,
  blurb: 'Word problems read aloud, solved with pictures and bar models. Includes Olympiad trick questions.',
  levels: [
    { name: 'Add & take away stories', grade: '1' },
    { name: 'Compare: how many more?', grade: '1' },
    { name: 'Groups & sharing stories', grade: '2' },
    { name: 'Two-step stories', grade: '2' },
    { name: 'Olympiad trick questions', grade: '2' },
  ],
  generate(level, rng) {
    const [A, B] = twoNames(rng);
    const t = pick(rng, THINGS);
    switch (level) {
      case 1: {
        if (rng() < 0.5) {
          const a = int(rng, 1, 6);
          const b = int(rng, 1, 10 - a);
          const s = `${A} has ${a} ${t.many}. ${B} gives ${A} ${b} more. How many ${t.many} does ${A} have now?`;
          return numberQ({ text: s, say: s, visual: objectGroups([a, b], t.e), hint: { text: '"More" means add.', visual: barPartWhole([{ v: a, label: a }, { v: b, label: b }], '?') }, answer: a + b, explain: `${a} + ${b} = ${a + b}.` });
        }
        const a = int(rng, 4, 10);
        const b = int(rng, 1, a - 1);
        const s = `${A} had ${a} ${t.many}. ${A} gave ${b} to ${B}. How many ${t.many} does ${A} have left?`;
        return numberQ({ text: s, say: s, visual: objects(a, t.e, { crossed: b }), hint: { text: '"Left" means take away.', visual: barPartWhole([{ v: b, label: b }, { v: a - b, label: '?' }], a) }, answer: a - b, explain: `${a} − ${b} = ${a - b}.` });
      }
      case 2: {
        const kind = pick(rng, ['more', 'fewer', 'together', 'found']);
        if (kind === 'together') {
          const a = int(rng, 5, 12);
          const b = int(rng, 3, 20 - a);
          const s = `${A} has ${a} ${t.many}. ${B} has ${b} ${t.many}. How many do they have altogether?`;
          return numberQ({ text: s, say: s, visual: barPartWhole([{ v: a, label: `${A} ${a}` }, { v: b, label: `${B} ${b}` }], '?'), hint: { text: '"Altogether" means add.' }, answer: a + b, explain: `${a} + ${b} = ${a + b}.` });
        }
        if (kind === 'found') {
          const a = int(rng, 3, 12);
          const c = int(rng, a + 2, 20);
          const s = `${A} had ${a} ${t.many}. Then ${A} found some more. Now ${A} has ${c}. How many did ${A} find?`;
          return numberQ({ text: s, say: s, visual: barPartWhole([{ v: a, label: a }, { v: c - a, label: '?' }], c), hint: { text: `Count up from ${a} to ${c}.` }, answer: c - a, explain: `${a} + ${c - a} = ${c}, so ${A} found ${c - a}.` });
        }
        const a = int(rng, 8, 20);
        const b = int(rng, 2, a - 1);
        const s = kind === 'more' ? `${A} has ${a} ${t.many}. ${B} has ${b} ${t.many}. How many more does ${A} have than ${B}?` : `${A} has ${a} ${t.many}. ${B} has ${b} ${t.many}. How many fewer does ${B} have?`;
        return numberQ({ text: s, say: s, visual: barCompare(a, b, { la: A, lb: B }), hint: { text: 'Line up the bars. The extra bit is the difference.' }, answer: a - b, explain: `${a} − ${b} = ${a - b}.` });
      }
      case 3: {
        const kind = pick(rng, ['boxes', 'share', 'wheels']);
        if (kind === 'boxes') {
          const g = int(rng, 2, 5);
          const per = pick(rng, [2, 3, 4, 5, 10]);
          const s = `There are ${g} boxes. Each box has ${per} ${t.many}. How many ${t.many} are there in all?`;
          return numberQ({ text: s, say: s, visual: groups(g, per, { emoji: t.e }), hint: { text: '"Each" often means equal groups: multiply.' }, answer: g * per, explain: `${g} × ${per} = ${g * per}.` });
        }
        if (kind === 'share') {
          const k = int(rng, 2, 5);
          const q = int(rng, 2, 5);
          const s = `${A} shares ${k * q} ${t.many} equally among ${k} friends. How many does each friend get?`;
          return numberQ({ text: s, say: s, visual: objects(k * q, t.e), hint: { text: '"Share equally" means divide.', visual: groups(k, q, { emoji: t.e }) }, answer: q, explain: `${k * q} ÷ ${k} = ${q}.` });
        }
        const [e, w, name] = pick(rng, [
          ['🚲', 2, 'bicycles'],
          ['🚗', 4, 'cars'],
          ['🛺', 3, 'auto rickshaws'],
        ]);
        const n = int(rng, 2, 5);
        const s = `How many wheels do ${n} ${name} have?`;
        return numberQ({ text: s, say: s, visual: objects(n, e), hint: { text: `Each one has ${w} wheels. Count by ${w}s.` }, answer: n * w, explain: `${n} × ${w} = ${n * w}.` });
      }
      case 4: {
        const kind = pick(rng, ['give-get', 'groups-plus', 'combine-compare']);
        if (kind === 'give-get') {
          const a = int(rng, 10, 20);
          const b = int(rng, 2, a - 5);
          const c = int(rng, 2, 9);
          const s = `${A} had ${a} ${t.many}. ${A} gave ${b} to ${B}. Then ${A} got ${c} more. How many does ${A} have now?`;
          return numberQ({ text: s, say: s, hint: { text: 'Do it one step at a time. First take away, then add.' }, answer: a - b + c, explain: `${a} − ${b} = ${a - b}. Then ${a - b} + ${c} = ${a - b + c}.` });
        }
        if (kind === 'groups-plus') {
          const g = int(rng, 2, 4);
          const per = int(rng, 2, 5);
          const extra = int(rng, 1, 5);
          const s = `There are ${g} bags with ${per} ${t.many} in each bag, and ${extra} more ${t.many} on the table. How many ${t.many} in all?`;
          return numberQ({ text: s, say: s, visual: groups(g, per, { emoji: t.e, leftover: extra }), hint: { text: 'First count the bags, then add the extra ones.' }, answer: g * per + extra, explain: `${g} × ${per} = ${g * per}. ${g * per} + ${extra} = ${g * per + extra}.` });
        }
        const r = int(rng, 3, 9);
        const bl = int(rng, 3, 9);
        const c = int(rng, 2, r + bl - 2);
        const s = `${A} has ${r} red and ${bl} blue balloons. ${B} has ${c} balloons. How many more balloons does ${A} have?`;
        return numberQ({ text: s, say: s, visual: barCompare(r + bl, c, { la: A, lb: B }), hint: { text: `First find how many ${A} has altogether.` }, answer: r + bl - c, explain: `${r} + ${bl} = ${r + bl}. ${r + bl} − ${c} = ${r + bl - c}.` });
      }
      default:
        return trick(rng, A, B);
    }
  },
};

function trick(rng, A, B) {
  const kind = pick(rng, ['back', 'between-kids', 'between-numbers', 'cuts', 'pieces', 'ages']);
  if (kind === 'back') {
    const n = int(rng, 5, 10);
    const p = int(rng, 2, n - 1);
    const s = `${A} is ${ordinal(p)} from the front in a line of ${n} children. What is ${A}'s place from the back?`;
    return numberQ({ text: s, say: s, visual: queue(n, [p - 1]), hint: { text: 'Count from the back of the line.', visual: queue(n, [p - 1], { numbers: 'back' }) }, answer: n - p + 1, explain: `There are ${n - p} children behind ${A}, so ${A} is ${ordinal(n - p + 1)} from the back. (${n} − ${p} + 1)` });
  }
  if (kind === 'between-kids') {
    const n = int(rng, 7, 10);
    const p = int(rng, 1, n - 3);
    const q = int(rng, p + 2, n);
    const s = `In a line, ${A} is ${ordinal(p)} and ${B} is ${ordinal(q)}. How many children are between them?`;
    return numberQ({ text: s, say: s, visual: queue(n, [p - 1, q - 1]), hint: { text: `Count only the children standing between ${A} and ${B}.`, visual: queue(n, [p - 1, q - 1], { numbers: 'front' }) }, answer: q - p - 1, explain: `Places ${p + 1} to ${q - 1} are between them: ${q - p - 1} children. (Not ${q - p}!)` });
  }
  if (kind === 'between-numbers') {
    const a = int(rng, 2, 10);
    const b = a + int(rng, 3, 9);
    const s = `How many whole numbers are between ${a} and ${b}?`;
    return numberQ({ text: s, say: s, visual: numberLine(a - 1, b + 1, { points: [a, b] }), hint: { text: `Don't count ${a} or ${b} themselves.` }, answer: b - a - 1, explain: `${a + 1} to ${b - 1} is ${b - a - 1} numbers.` });
  }
  if (kind === 'cuts') {
    const p = int(rng, 2, 8);
    const s = `A ribbon is cut into ${p} pieces. How many cuts were made?`;
    return numberQ({ text: s, say: s, hint: { text: 'Draw it! Count the cuts, not the pieces.', visual: ribbon(p) }, answer: p - 1, explain: `${p} pieces need ${p - 1} cut${p - 1 === 1 ? '' : 's'}.` });
  }
  if (kind === 'pieces') {
    const c = int(rng, 1, 7);
    const s = `${A} cuts a long stick ${c} time${c > 1 ? 's' : ''}. How many pieces are there?`;
    return numberQ({ text: s, say: s, hint: { text: 'Draw it and count the pieces.', visual: ribbon(c + 1) }, answer: c + 1, explain: `${c} cut${c > 1 ? 's' : ''} make ${c + 1} pieces.` });
  }
  const a = int(rng, 5, 8);
  const d = int(rng, 2, 5);
  const y = int(rng, 1, 4);
  const s = `${A} is ${a} years old. ${B} is ${d} years older than ${A}. How old will ${B} be in ${y} year${y > 1 ? 's' : ''}?`;
  return numberQ({ text: s, say: s, hint: { text: `First find ${B}'s age now.` }, answer: a + d + y, explain: `${B} is ${a} + ${d} = ${a + d} now. In ${y} year${y > 1 ? 's' : ''}: ${a + d + y}.` });
}

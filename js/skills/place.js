import { int, pick } from '../rng.js';
import { baseTen } from '../visuals.js';
import { numberQ } from './util.js';

const tensOnes = (n) => [Math.floor(n / 10), n % 10];

export default {
  id: 'place',
  title: 'Place Value',
  color: 'green',
  blurb: 'Tens and ones (and hundreds) with base-ten blocks.',
  levels: [
    { name: 'Tens and ones up to 50', grade: '1' },
    { name: 'Tens and ones up to 99', grade: '1' },
    { name: 'How many tens? How many ones?', grade: '1' },
    { name: 'Hundreds, tens and ones', grade: '2' },
    { name: 'Value of a digit', grade: '2' },
  ],
  generate(level, rng) {
    if (level <= 2) {
      const t = int(rng, 1, level === 1 ? 4 : 9);
      const o = int(rng, 0, 9);
      const n = t * 10 + o;
      return numberQ({
        text: 'What number do the blocks show?',
        say: 'What number do these blocks show?',
        visual: baseTen(n),
        hint: { text: `Count the tens: 10, 20, 30… Then count on the ones.` },
        answer: n,
        explain: `${t} ten${t === 1 ? '' : 's'} and ${o} one${o === 1 ? '' : 's'} make ${n}.`,
      });
    }
    if (level === 3) {
      const n = int(rng, 11, 99);
      const [t, o] = tensOnes(n);
      const kind = pick(rng, ['tens', 'ones', 'compose']);
      if (kind === 'compose') {
        return numberQ({
          text: `${t} tens and ${o} ones make what number?`,
          say: `${t} tens and ${o} ones. What number is that?`,
          hint: { text: 'Tens go first, then ones.', visual: baseTen(n) },
          answer: n,
          explain: `${t} tens is ${t * 10}. ${t * 10} and ${o} more is ${n}.`,
        });
      }
      return numberQ({
        text: `How many ${kind} are in ${n}?`,
        say: `How many ${kind} are in the number ${n}?`,
        hint: { text: `Look at the blocks: rods are tens, cubes are ones.`, visual: baseTen(n) },
        answer: kind === 'tens' ? t : o,
        explain: `${n} is ${t} tens and ${o} ones.`,
      });
    }
    if (level === 4) {
      const n = int(rng, 1, 5) * 100 + int(rng, 0, 9) * 10 + int(rng, 0, 9);
      return numberQ({
        text: 'What number do the blocks show?',
        say: 'What number do these blocks show? The big squares are hundreds.',
        visual: baseTen(n),
        hint: { text: 'Big squares are 100 each. Then count tens, then ones.' },
        answer: n,
        explain: `${Math.floor(n / 100)} hundreds, ${Math.floor((n % 100) / 10)} tens and ${n % 10} ones make ${n}.`,
      });
    }
    // level 5: digit value or expanded form, digits all different so the question is unambiguous
    let n;
    do n = int(rng, 102, 987);
    while (new Set(String(n)).size !== 3 || String(n).includes('0'));
    const digits = String(n).split('').map(Number);
    if (pick(rng, [true, false])) {
      const pos = int(rng, 0, 2);
      const value = digits[pos] * 10 ** (2 - pos);
      return numberQ({
        text: `What is the value of the ${digits[pos]} in ${n}?`,
        say: `In the number ${n}, what is the ${digits[pos]} worth?`,
        hint: { text: 'Is it in the hundreds, tens or ones place?', visual: baseTen(n) },
        answer: value,
        explain: `The ${digits[pos]} is in the ${['hundreds', 'tens', 'ones'][pos]} place, so it is worth ${value}.`,
      });
    }
    const parts = [digits[0] * 100, digits[1] * 10, digits[2]];
    return numberQ({
      text: 'Put the parts together.',
      say: `What is ${parts.join(' plus ')}?`,
      math: `${parts.join(' + ')} = ?`,
      hint: { text: 'Hundreds, then tens, then ones.', visual: baseTen(n) },
      answer: n,
      explain: `${parts.join(' + ')} = ${n}.`,
    });
  },
};

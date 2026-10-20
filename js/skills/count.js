import { int, pick, chance } from '../rng.js';
import { objects, tenFrames, numberLine, baseTen, baseTenRow, chain } from '../visuals.js';
import { THINGS, word, numberQ, choiceQ, numChoice } from './util.js';

export default {
  id: 'count',
  title: 'Counting',
  color: 'yellow',
  blurb: 'Count objects, read ten-frames, find one more and ten more, and skip count.',
  levels: [
    { name: 'Count up to 10', grade: 'K' },
    { name: 'Count to 20 with ten-frames', grade: '1' },
    { name: 'One more, one less, ten more', grade: '1' },
    { name: 'Which is bigger?', grade: '1' },
    { name: 'Skip counting by 2s, 5s, 10s', grade: '1–2' },
  ],
  generate(level, rng) {
    switch (level) {
      case 1: {
        const n = int(rng, 1, 10);
        const t = pick(rng, THINGS);
        return numberQ({
          text: `How many ${t.many}?`,
          say: `How many ${t.many} can you count?`,
          visual: objects(n, t.e),
          hint: { text: 'Touch each one as you count. A full row is 5.', visual: tenFrames(Array(n).fill('red')) },
          answer: n,
          explain: `There ${n === 1 ? 'is' : 'are'} ${n} ${word(n, t)}.`,
        });
      }
      case 2: {
        const n = int(rng, 11, 20);
        return numberQ({
          text: 'How many counters?',
          say: 'How many counters are in the ten frames?',
          visual: tenFrames(Array(n).fill('blue')),
          hint: { text: `A full ten-frame is 10. Count on from 10: 11, 12, 13…` },
          answer: n,
          explain: `One full frame is 10, and ${n - 10} more makes ${n}.`,
        });
      }
      case 3: {
        const kind = pick(rng, ['1more', '1less', '10more', '10less']);
        const d = { '1more': 1, '1less': -1, '10more': 10, '10less': -10 }[kind];
        const n = { '1more': int(rng, 5, 98), '1less': int(rng, 2, 99), '10more': int(rng, 1, 89), '10less': int(rng, 11, 99) }[kind];
        const ans = n + d;
        const phrase = `${Math.abs(d)} ${d > 0 ? 'more' : 'less'}`;
        const isTen = Math.abs(d) === 10;
        return numberQ({
          text: `What is ${phrase} than ${n}?`,
          say: `What number is ${phrase} than ${n}?`,
          visual: isTen ? baseTen(n) : numberLine(Math.max(0, n - 5), Math.max(0, n - 5) + 10, { points: [n] }),
          hint: isTen
            ? { text: `${d > 0 ? 'Add' : 'Take away'} one ten rod. The ones stay the same.`, visual: baseTen(ans) }
            : { text: `${d > 0 ? 'Step forward' : 'Step back'} one on the number line.`, visual: numberLine(Math.max(0, n - 5), Math.max(0, n - 5) + 10, { points: [n], jumps: [{ from: n, to: ans, label: d > 0 ? '+1' : '−1' }] }) },
          answer: ans,
          explain: `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} than ${n} is ${ans}.`,
        });
      }
      case 4: {
        const a = int(rng, 10, 99);
        let b = int(rng, 10, 99);
        const rev = (a % 10) * 10 + Math.floor(a / 10);
        if (chance(rng, 0.35) && a % 10 !== 0 && rev !== a) b = rev; // 47 vs 74: the classic mix-up
        while (b === a) b = int(rng, 10, 99);
        const askBig = chance(rng, 0.6);
        const ans = askBig ? Math.max(a, b) : Math.min(a, b);
        const word2 = askBig ? 'bigger' : 'smaller';
        return choiceQ(
          rng,
          {
            text: `Which number is ${word2}?`,
            say: `Which number is ${word2}, ${a} or ${b}?`,
            visual: baseTenRow([a, b], { labels: true }),
            hint: { text: 'Compare the tens first. More tens means a bigger number.' },
            explain: `${Math.max(a, b)} has more ${Math.floor(Math.max(a, b) / 10) === Math.floor(Math.min(a, b) / 10) ? 'ones' : 'tens'}, so ${Math.max(a, b)} is bigger than ${Math.min(a, b)}.`,
          },
          numChoice(ans),
          [numChoice(ans === a ? b : a)],
          { keepOrder: false },
        );
      }
      default: {
        const step = pick(rng, [2, 5, 10]);
        const start = step * int(rng, 0, step === 10 ? 4 : 5);
        const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
        const blank = int(rng, 1, 4);
        const ans = seq[blank];
        const shown = seq.map((v, i) => (i === blank ? null : v));
        return numberQ({
          text: 'What number is missing?',
          say: `Count by ${step}s. What number is missing?`,
          math: shown.map((v) => (v === null ? '?' : v)).join(', '),
          visual: chain(shown),
          hint: { text: `Each number is ${step} more than the one before.`, visual: chain(shown, { diffs: Array(4).fill(`+${step}`) }) },
          answer: ans,
          explain: `Counting by ${step}s: ${seq.join(', ')}.`,
        });
      }
    }
  },
};

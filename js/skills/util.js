import { pick, shuffle } from '../rng.js';

export const THINGS = [
  { e: '🍎', one: 'apple', many: 'apples' },
  { e: '⭐', one: 'star', many: 'stars' },
  { e: '🎈', one: 'balloon', many: 'balloons' },
  { e: '🍪', one: 'cookie', many: 'cookies' },
  { e: '🐟', one: 'fish', many: 'fish' },
  { e: '🌸', one: 'flower', many: 'flowers' },
  { e: '🚗', one: 'toy car', many: 'toy cars' },
  { e: '🐞', one: 'ladybug', many: 'ladybugs' },
  { e: '🍓', one: 'strawberry', many: 'strawberries' },
  { e: '⚽', one: 'ball', many: 'balls' },
  { e: '🧁', one: 'cupcake', many: 'cupcakes' },
  { e: '🐥', one: 'chick', many: 'chicks' },
  { e: '🍬', one: 'sweet', many: 'sweets' },
  { e: '🥭', one: 'mango', many: 'mangoes' },
];

export const NAMES = ['Ria', 'Arjun', 'Maya', 'Leo', 'Zara', 'Sam', 'Anya', 'Kabir', 'Mia', 'Noah', 'Isha', 'Ben', 'Tara', 'Omar'];

export const word = (n, t) => (n === 1 ? t.one : t.many);

export const twoNames = (rng) => {
  const a = pick(rng, NAMES);
  let b = pick(rng, NAMES);
  while (b === a) b = pick(rng, NAMES);
  return [a, b];
};

export function ordinal(n) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n}${s}`;
}

/** Plausible wrong numbers near `ans`: off-by-one, off-by-ten, plus any `extra` misconceptions first. */
export function nearMisses(rng, ans, { min = 0, max = 1e9, count = 3, extra = [] } = {}) {
  const out = [];
  const add = (v) => {
    if (Number.isInteger(v) && v !== ans && v >= min && v <= max && !out.includes(v)) out.push(v);
  };
  extra.forEach(add);
  let tries = 0;
  while (out.length < count && tries++ < 200) add(ans + pick(rng, [-2, -1, 1, 2, -10, 10, 3, -3, 5, -5]));
  return out.slice(0, count);
}

export const numberQ = (q) => ({ kind: 'number', ...q });

/** correct and distractors are {value, label, html?}. Duplicates (by value) are dropped. */
export function choiceQ(rng, q, correct, distractors, { keepOrder = false } = {}) {
  const seen = new Set([String(correct.value)]);
  const opts = [correct];
  for (const d of distractors) {
    const k = String(d.value);
    if (!seen.has(k)) {
      seen.add(k);
      opts.push(d);
    }
  }
  return { kind: 'choice', ...q, answer: correct.value, choices: keepOrder ? opts : shuffle(rng, opts) };
}

export const numChoice = (v) => ({ value: v, label: String(v) });

/** Words for a sum/expression so speech reads it naturally. */
export const speakMath = (s) =>
  String(s)
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ')
    .replace(/\?/g, ' what ')
    .replace(/\s+/g, ' ')
    .trim();

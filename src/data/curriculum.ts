/**
 * Grade 1 and Grade 2 Tamil, as units of short lessons.
 *
 * The order follows the usual Tamil Nadu (Samacheer Kalvi) / CBSE Tamil
 * progression for the first two years: pre-writing strokes → உயிர் → மெய் →
 * உயிர்மெய் row by row (அ, ஆ, இ/ஈ in Grade 1; உ/ஊ, எ/ஏ/ஐ, ஒ/ஓ/ஔ and grantha in
 * Grade 2) → words → sentences → stories, with ஆத்திசூடி, Thirukkural and songs.
 * Word lessons only use letters that have already been taught.
 */
import type { WriteMode } from '../lib/strokeMatch';
import { AYTHAM, CONSONANTS, GRANTHA, SHRI, VOWELS, splitLetters } from './alphabet';
import { POEMS } from './poems';
import { SENTENCES } from './sentences';
import { STORIES } from './stories';
import { CATEGORY_NAMES, WORDS, type WordCategory } from './words';

export type Activity =
  | { type: 'warmup'; shape: string }
  | { type: 'meet'; letter: string }
  | { type: 'watch'; letter: string }
  | { type: 'write'; letter: string; mode: WriteMode }
  | { type: 'listen-pick'; target: string; options: string[] }
  | { type: 'picture-pick'; word: string; letter: string; options: string[] }
  | { type: 'concept'; base: string; sign: string; result: string }
  | { type: 'read-word'; word: string }
  | { type: 'listen-word'; target: string; options: string[] }
  | { type: 'build-word'; word: string; extra: string[] }
  | { type: 'missing-letter'; word: string; index: number; options: string[] }
  | { type: 'write-word'; word: string; mode: WriteMode }
  | { type: 'read-sentence'; sentence: string }
  | { type: 'build-sentence'; sentence: string }
  | { type: 'write-sentence'; sentence: string }
  | { type: 'story'; id: string }
  | { type: 'poem'; id: string }
  | { type: 'dictation'; word: string }
  | { type: 'story-maker' }
  | { type: 'notebook' };

export interface Lesson {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  activities: Activity[];
}

export interface Unit {
  id: string;
  grade: 1 | 2;
  title: string;
  titleEn: string;
  icon: string;
  goal: string; // learning outcome, for the parent
  lessons: Lesson[];
}

// ------------------------------------------------------------- random helpers

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function seeded(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOthers(target: string, pool: string[], n: number, rnd: () => number): string[] {
  return shuffle(
    pool.filter((x) => x !== target),
    rnd,
  ).slice(0, n);
}

// ---------------------------------------------------------- lesson builders

const signsOf = (g: string) => g.replace(/^[^ா-்]+/, '');

function letterLesson(letter: string, known: string[], unitLetters: string[], example?: { word: string }): Lesson {
  const rnd = seeded('L' + letter);
  const pool = Array.from(new Set([...unitLetters, ...known])).filter((x) => x !== letter);
  const acts: Activity[] = [
    { type: 'meet', letter },
    { type: 'watch', letter },
    { type: 'write', letter, mode: 'trace' },
    { type: 'write', letter, mode: 'trace' },
    { type: 'listen-pick', target: letter, options: shuffle([letter, ...pickOthers(letter, pool, 2, rnd)], rnd) },
    { type: 'write', letter, mode: 'guided' },
    { type: 'write', letter, mode: 'memory' },
  ];
  if (example) {
    acts.push({
      type: 'picture-pick',
      word: example.word,
      letter,
      options: shuffle([letter, ...pickOthers(letter, pool, 2, rnd)], rnd),
    });
  }
  return { id: 'letter-' + letter, title: letter, titleEn: `Letter ${letter}`, icon: letter, activities: acts };
}

function reviewLesson(id: string, title: string, letters: string[], known: string[]): Lesson {
  const rnd = seeded(id);
  const pool = Array.from(new Set([...letters, ...known]));
  const acts: Activity[] = [];
  for (const l of shuffle(letters, rnd).slice(0, 4)) {
    acts.push({ type: 'listen-pick', target: l, options: shuffle([l, ...pickOthers(l, pool, 3, rnd)], rnd) });
  }
  for (const l of shuffle(letters, rnd).slice(0, 4)) acts.push({ type: 'write', letter: l, mode: 'memory' });
  return { id, title, titleEn: 'Review', icon: '⭐', activities: shuffle(acts, rnd) };
}

/** Words whose every letter is in `known`. */
function wordsUsing(known: Set<string>, exclude: Set<string> = new Set()): string[] {
  return WORDS.filter((w) => !exclude.has(w.ta) && splitLetters(w.ta).every((l) => known.has(l))).map((w) => w.ta);
}

function wordLesson(id: string, title: string, titleEn: string, icon: string, words: string[], known: string[]): Lesson {
  const rnd = seeded(id);
  const acts: Activity[] = [];
  const pick = words.slice(0, 6);
  for (const w of pick) acts.push({ type: 'read-word', word: w });
  for (const w of shuffle(pick, rnd).slice(0, 3)) {
    acts.push({ type: 'listen-word', target: w, options: shuffle([w, ...pickOthers(w, words, 2, rnd)], rnd) });
  }
  const lessonLetters = Array.from(new Set(pick.flatMap(splitLetters)));
  for (const w of shuffle(pick, rnd).slice(0, 2)) {
    const letters = splitLetters(w);
    const pool = lessonLetters.filter((x) => !letters.includes(x));
    acts.push({ type: 'build-word', word: w, extra: shuffle(pool, rnd).slice(0, Math.max(0, Math.min(2, 7 - letters.length))) });
  }
  const mw = shuffle(pick.filter((w) => splitLetters(w).length >= 2), rnd)[0];
  if (mw) {
    const letters = splitLetters(mw);
    const index = Math.floor(rnd() * letters.length);
    acts.push({ type: 'missing-letter', word: mw, index, options: shuffle([letters[index], ...pickOthers(letters[index], known, 2, rnd)], rnd) });
  }
  for (const w of shuffle(pick.filter((x) => splitLetters(x).length <= 4), rnd).slice(0, 2)) {
    acts.push({ type: 'write-word', word: w, mode: 'guided' });
  }
  return { id, title, titleEn, icon, activities: acts };
}

// ------------------------------------------------------------ the syllabus

function build(): Unit[] {
  const units: Unit[] = [];
  const known: string[] = [];
  const knownSet = () => new Set(known);
  const usedWords = new Set<string>();

  // ----- Grade 1 -----------------------------------------------------------
  units.push({
    id: 'g1-warmup',
    grade: 1,
    title: 'கோடுகளும் வளைவுகளும்',
    titleEn: 'Lines and curves',
    icon: '〰️',
    goal: 'Hold the pencil/finger steadily and draw the basic strokes every Tamil letter is made of, in the right direction.',
    lessons: [
      {
        id: 'warm-lines',
        title: 'கோடுகள்',
        titleEn: 'Straight lines',
        icon: '📏',
        activities: ['line-down', 'line-across', 'line-slant', 'line-l', 'line-u'].map((shape) => ({ type: 'warmup', shape }) as Activity),
      },
      {
        id: 'warm-curves',
        title: 'வளைவுகள்',
        titleEn: 'Curves and loops',
        icon: '➰',
        activities: ['curve-c', 'curve-hump', 'circle', 'loop', 'spiral'].map((shape) => ({ type: 'warmup', shape }) as Activity),
      },
    ],
  });

  const vowelGroups = [VOWELS.slice(0, 4), VOWELS.slice(4, 8), VOWELS.slice(8, 12)];
  vowelGroups.forEach((group, gi) => {
    const letters = group.map((v) => v.letter);
    const lessons: Lesson[] = [];
    for (const v of group) {
      lessons.push(letterLesson(v.letter, known, letters, { word: v.word }));
      known.push(v.letter);
    }
    if (gi === 2) {
      lessons.push(letterLesson(AYTHAM.letter, known, letters, undefined));
      known.push(AYTHAM.letter);
    }
    lessons.push(reviewLesson(`review-vowels-${gi + 1}`, 'மீள்பார்வை', gi === 2 ? [...letters, 'ஃ'] : letters, known));
    units.push({
      id: `g1-vowels-${gi + 1}`,
      grade: 1,
      title: `உயிர் எழுத்துகள் ${gi + 1}`,
      titleEn: `Vowels ${gi + 1}: ${letters.join(' ')}${gi === 2 ? ' ஃ' : ''}`,
      icon: letters[0],
      goal: 'Recognise, say and write the vowels (உயிர் எழுத்துகள்); know which are short (குறில்) and long (நெடில்).',
      lessons,
    });
  });
  units[units.length - 1].lessons.push({ id: 'poem-kural-1', title: 'அகர முதல', titleEn: 'Thirukkural 1', icon: '📜', activities: [{ type: 'poem', id: 'kural-1' }] });

  const meiGroups: [string, string, typeof CONSONANTS][] = [
    ['வல்லினம்', 'Hard consonants', CONSONANTS.filter((c) => c.group === 'vallinam')],
    ['மெல்லினம்', 'Soft consonants', CONSONANTS.filter((c) => c.group === 'mellinam')],
    ['இடையினம்', 'Medium consonants', CONSONANTS.filter((c) => c.group === 'idaiyinam')],
  ];
  meiGroups.forEach(([ta, en, group], gi) => {
    const letters = group.map((c) => c.mei);
    const lessons = group.map((c) => {
      const l = letterLesson(c.mei, known, letters);
      known.push(c.mei);
      return l;
    });
    lessons.push(reviewLesson(`review-mei-${gi + 1}`, 'மீள்பார்வை', letters, known));
    units.push({
      id: `g1-mei-${gi + 1}`,
      grade: 1,
      title: `மெய் எழுத்துகள் – ${ta}`,
      titleEn: `Consonants: ${en} (${letters.join(' ')})`,
      icon: letters[0],
      goal: 'Recognise and write the consonants with the dot (புள்ளி) and say them the way they are recited in school (இக், இங், இச்…).',
      lessons,
    });
  });

  // உயிர்மெய் rows
  const rowUnit = (signs: string[], id: string, grade: 1 | 2, title: string, titleEn: string, goal: string) => {
    const lessons: Lesson[] = [];
    for (const sign of signs) {
      const vowel = VOWELS.find((v) => v.sign === sign)!;
      const rowLetters = CONSONANTS.map((c) => c.base + sign);
      const conceptLetters = ['க', 'ம', 'ப'];
      lessons.push({
        id: `concept-${vowel.letter}`,
        title: `${CONSONANTS[0].mei} + ${vowel.letter} = ${rowLetters[0]}`,
        titleEn: `How ${vowel.letter} joins a consonant`,
        icon: rowLetters[0],
        activities: conceptLetters.map((b) => ({
          type: 'concept',
          base: b + '்',
          sign: vowel.letter,
          result: b + sign,
        })),
      });
      for (let i = 0; i < 18; i += 6) {
        const chunk = rowLetters.slice(i, i + 6);
        const rnd = seeded('row' + sign + i);
        const acts: Activity[] = [];
        for (const l of chunk) {
          acts.push({ type: 'meet', letter: l });
          acts.push({ type: 'write', letter: l, mode: 'trace' });
        }
        for (const l of shuffle(chunk, rnd).slice(0, 3)) {
          acts.push({ type: 'listen-pick', target: l, options: shuffle([l, ...pickOthers(l, chunk, 2, rnd)], rnd) });
        }
        for (const l of shuffle(chunk, rnd).slice(0, 3)) acts.push({ type: 'write', letter: l, mode: 'guided' });
        lessons.push({
          id: `row-${vowel.letter}-${i / 6 + 1}`,
          title: chunk.join(' '),
          titleEn: `${vowel.letter} row, part ${i / 6 + 1}`,
          icon: chunk[0],
          activities: acts,
        });
        known.push(...chunk);
      }
      const words = sign ? wordsUsing(knownSet(), usedWords).filter((w) => splitLetters(w).some((l) => signsOf(l) === sign)) : [];
      if (words.length >= 3) {
        words.slice(0, 6).forEach((w) => usedWords.add(w));
        lessons.push(wordLesson(`words-${vowel.letter}`, `${vowel.letter} சொற்கள்`, `Words with ${sign || vowel.letter}`, '🔤', words, known));
      }
    }
    units.push({ id, grade, title, titleEn, icon: CONSONANTS[0].base + signs[0], goal, lessons });
  };

  rowUnit([''], 'g1-row-a', 1, 'உயிர்மெய் – அகர வரிசை', 'Consonant + அ (க ங ச …)', 'Understand that a consonant + அ makes க, ங, ச…; read and write all 18.');
  // first words use only அ-row letters and pulli
  {
    const first = WORDS.filter((w) => w.cat === 'first' && splitLetters(w.ta).every((l) => known.includes(l))).map((w) => w.ta);
    first.forEach((w) => usedWords.add(w));
    const unit = units[units.length - 1];
    unit.lessons.push(wordLesson('first-words-1', 'முதல் சொற்கள்', 'First words', '🌳', first.slice(0, 6), known));
    unit.lessons.push(wordLesson('first-words-2', 'முதல் சொற்கள் 2', 'First words 2', '🌺', first.slice(6, 12), known));
    unit.lessons.push(wordLesson('first-words-3', 'முதல் சொற்கள் 3', 'First words 3', '🪔', first.slice(12), known));
  }
  rowUnit(['ா'], 'g1-row-aa', 1, 'உயிர்மெய் – ஆகார வரிசை', 'Consonant + ஆ (கா ஙா சா …)', 'Read and write the ா (கால்) sign with every consonant.');
  rowUnit(['ி', 'ீ'], 'g1-row-i', 1, 'உயிர்மெய் – இகர, ஈகார வரிசை', 'Consonant + இ / ஈ (கி கீ …)', 'Read and write the ி and ீ signs, including the special shapes of டி and டீ.');

  units.push({
    id: 'g1-sentences',
    grade: 1,
    title: 'சிறு வாக்கியங்கள்',
    titleEn: 'First sentences',
    icon: '💬',
    goal: 'Read and build simple sentences of two or three words.',
    lessons: chunk(SENTENCES.filter((s) => s.grade === 1), 5).map((group, i) => ({
      id: `sent-g1-${i + 1}`,
      title: `வாக்கியங்கள் ${i + 1}`,
      titleEn: `Sentences ${i + 1}`,
      icon: group[0].emoji,
      activities: group.flatMap((s) => [
        { type: 'read-sentence', sentence: s.ta } as Activity,
        { type: 'build-sentence', sentence: s.ta } as Activity,
      ]),
    })),
  });

  units.push({
    id: 'g1-stories',
    grade: 1,
    title: 'கதைகளும் பாடல்களும்',
    titleEn: 'Stories and songs',
    icon: '📚',
    goal: 'Listen to and read short stories and rhymes; answer simple questions about them.',
    lessons: [
      ...STORIES.filter((s) => s.grade === 1).map((s) => ({
        id: 'story-' + s.id,
        title: s.title,
        titleEn: s.titleEn,
        icon: s.cover,
        activities: [{ type: 'story', id: s.id } as Activity],
      })),
      { id: 'poem-nila', title: 'நிலா நிலா ஓடி வா', titleEn: 'Rhyme: Moon, moon', icon: '🌙', activities: [{ type: 'poem', id: 'nila-nila' }] },
    ],
  });

  // ----- Grade 2 -----------------------------------------------------------
  rowUnit(['ு', 'ூ'], 'g2-row-u', 2, 'உயிர்மெய் – உகர, ஊகார வரிசை', 'Consonant + உ / ஊ (கு கூ …)', 'Read and write the உ / ஊ forms — each consonant has its own shape, so these need extra practice.');
  rowUnit(['ெ', 'ே', 'ை'], 'g2-row-e', 2, 'உயிர்மெய் – எகர, ஏகார, ஐகார வரிசை', 'Consonant + எ / ஏ / ஐ (கெ கே கை …)', 'Write the கொம்பு signs (ெ ே ை) before the consonant.');
  rowUnit(['ொ', 'ோ', 'ௌ'], 'g2-row-o', 2, 'உயிர்மெய் – ஒகர, ஓகார, ஔகார வரிசை', 'Consonant + ஒ / ஓ / ஔ (கொ கோ கௌ …)', 'Write the two-part signs: கொம்பு before and கால் (or ள) after the consonant.');

  {
    const lessons: Lesson[] = GRANTHA.map((g) => {
      const l = letterLesson(g.base, known, GRANTHA.map((x) => x.base), { word: g.word });
      known.push(g.base, g.mei);
      for (const v of VOWELS) known.push(g.base + v.sign);
      return l;
    });
    lessons.push(letterLesson(SHRI.letter, known, GRANTHA.map((x) => x.base)));
    known.push(SHRI.letter);
    const gw = wordsUsing(knownSet(), usedWords).filter((w) => /[ஜஷஸஹ]/.test(w));
    gw.forEach((w) => usedWords.add(w));
    if (gw.length) lessons.push(wordLesson('words-grantha', 'கிரந்தச் சொற்கள்', 'Words with grantha letters', '🌹', gw, known));
    units.push({
      id: 'g2-grantha',
      grade: 2,
      title: 'கிரந்த எழுத்துகள்',
      titleEn: 'Grantha letters (ஜ ஷ ஸ ஹ க்ஷ ஸ்ரீ)',
      icon: 'ஜ',
      goal: 'Recognise and write the grantha letters used in borrowed words and names.',
      lessons,
    });
  }

  // vocabulary by theme
  const cats: WordCategory[] = ['animals', 'birds', 'insects', 'fruits', 'vegetables', 'food', 'body', 'nature', 'home', 'school', 'vehicles', 'family', 'colours', 'numbers', 'days', 'actions', 'describing'];
  const vocabLessons: Lesson[] = [];
  for (const c of cats) {
    const words = WORDS.filter((w) => w.cat === c).map((w) => w.ta);
    const parts = balancedChunks(words, 7);
    parts.forEach((p, i) =>
      vocabLessons.push(
        wordLesson(`vocab-${c}-${i + 1}`, CATEGORY_NAMES[c].ta + (parts.length > 1 ? ` ${i + 1}` : ''), CATEGORY_NAMES[c].en, CATEGORY_NAMES[c].emoji, p, known),
      ),
    );
  }
  units.push({
    id: 'g2-words',
    grade: 2,
    title: 'சொல் வளம்',
    titleEn: 'Words by theme',
    icon: '🐘',
    goal: 'Read, spell and write about 200 everyday words: animals, food, body, home, colours, numbers, days and actions.',
    lessons: vocabLessons,
  });

  units.push({
    id: 'g2-sentences',
    grade: 2,
    title: 'வாக்கியங்கள்',
    titleEn: 'Sentences',
    icon: '💬',
    goal: 'Read longer sentences, put words in the right order, and copy sentences neatly.',
    lessons: chunk(SENTENCES.filter((s) => s.grade === 2), 4).map((group, i) => ({
      id: `sent-g2-${i + 1}`,
      title: `வாக்கியங்கள் ${i + 1}`,
      titleEn: `Sentences ${i + 1}`,
      icon: group[0].emoji,
      activities: [
        ...group.flatMap((s) => [
          { type: 'read-sentence', sentence: s.ta } as Activity,
          { type: 'build-sentence', sentence: s.ta } as Activity,
        ]),
        { type: 'write-sentence', sentence: group[0].ta } as Activity,
      ],
    })),
  });

  units.push({
    id: 'g2-stories',
    grade: 2,
    title: 'கதைகள்',
    titleEn: 'Stories',
    icon: '📖',
    goal: 'Read short stories on her own and answer questions about them.',
    lessons: STORIES.filter((s) => s.grade === 2).map((s) => ({
      id: 'story-' + s.id,
      title: s.title,
      titleEn: s.titleEn,
      icon: s.cover,
      activities: [{ type: 'story', id: s.id } as Activity],
    })),
  });

  {
    const rnd = seeded('dictation');
    const dict = shuffle(WORDS.filter((w) => splitLetters(w.ta).length <= 3 && w.cat !== 'first'), rnd).map((w) => w.ta);
    units.push({
      id: 'g2-writing',
      grade: 2,
      title: 'எழுதுவோம்',
      titleEn: 'Let’s write: dictation and my own story',
      icon: '✍️',
      goal: 'Write words from dictation, copy sentences, and compose a short story of her own.',
      lessons: [
        ...chunk(dict.slice(0, 24), 6).map((g, i) => ({
          id: `dictation-${i + 1}`,
          title: `சொல்வதை எழுது ${i + 1}`,
          titleEn: `Dictation ${i + 1}`,
          icon: '👂',
          activities: g.map((w) => ({ type: 'dictation', word: w }) as Activity),
        })),
        {
          id: 'copy-sentences',
          title: 'பார்த்து எழுது',
          titleEn: 'Copy sentences',
          icon: '📝',
          activities: SENTENCES.filter((s) => s.grade === 1).slice(0, 4).map((s) => ({ type: 'write-sentence', sentence: s.ta }) as Activity),
        },
        { id: 'story-maker', title: 'என் கதை', titleEn: 'Make my own story', icon: '🧚', activities: [{ type: 'story-maker' }] },
        { id: 'notebook', title: 'என் நோட்டுப் புத்தகம்', titleEn: 'My notebook (free writing)', icon: '📒', activities: [{ type: 'notebook' }] },
      ],
    });
  }

  units.push({
    id: 'g2-poems',
    grade: 2,
    title: 'செய்யுளும் பாடலும்',
    titleEn: 'Verses and songs',
    icon: '🎶',
    goal: 'Read and recite ஆத்திசூடி, two Thirukkural couplets and a Bharathiyar song, and know what they mean.',
    lessons: POEMS.filter((p) => p.id !== 'nila-nila' && p.id !== 'kural-1').map((p) => ({
      id: 'poem-' + p.id,
      title: p.title,
      titleEn: p.titleEn,
      icon: p.cover,
      activities: [{ type: 'poem', id: p.id } as Activity],
    })),
  });

  return units;
}

/** Split into the fewest groups of at most `max`, with sizes as equal as possible. */
function balancedChunks<T>(arr: T[], max: number): T[][] {
  const groups = Math.ceil(arr.length / max);
  const size = Math.ceil(arr.length / groups);
  return chunk(arr, size);
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export const UNITS: Unit[] = build();

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string): { unit: Unit; lesson: Lesson; index: number } | null {
  for (const unit of UNITS) {
    const index = unit.lessons.findIndex((l) => l.id === id);
    if (index >= 0) return { unit, lesson: unit.lessons[index], index };
  }
  return null;
}

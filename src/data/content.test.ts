import { describe, expect, it } from 'vitest';
import { shapeFor } from '../lib/shapes';
import { CONSONANTS, GRANTHA, VOWELS, romanOf, splitLetters } from './alphabet';
import { ALL_LESSONS, UNITS } from './curriculum';
import { POEMS } from './poems';
import { SENTENCES, sentenceWords } from './sentences';
import { STORIES } from './stories';
import { WORDS } from './words';

const tamilOnly = (s: string) => s.replace(/[^஀-௿\s]/g, ' ');

describe('alphabet', () => {
  it('has 12 vowels and 18 consonants', () => {
    expect(VOWELS).toHaveLength(12);
    expect(CONSONANTS).toHaveLength(18);
  });

  it('splits words into letters', () => {
    expect(splitLetters('தமிழ்')).toEqual(['த', 'மி', 'ழ்']);
    expect(splitLetters('கொக்கு')).toEqual(['கொ', 'க்', 'கு']);
    expect(splitLetters('பக்ஷி')).toEqual(['ப', 'க்ஷி']);
    expect(splitLetters('ஸ்ரீ')).toEqual(['ஸ்ரீ']);
    expect(splitLetters('வௌவால்')).toEqual(['வௌ', 'வா', 'ல்']);
  });

  it('transliterates', () => {
    expect(romanOf('கா')).toBe('kaa');
    expect(romanOf('ழ்')).toBe('zh');
    expect(romanOf('ஔ')).toBe('au');
  });
});

describe('every letter used in the content can be written (has stroke data)', () => {
  const texts = [
    ...WORDS.map((w) => w.ta),
    ...SENTENCES.map((s) => s.ta),
    ...STORIES.flatMap((s) => [s.title, ...s.pages.map((p) => p.ta), ...s.questions.flatMap((q) => [q.q, ...q.options])]),
    ...POEMS.flatMap((p) => p.lines.map((l) => l.ta)),
    ...VOWELS.map((v) => v.word),
    ...[...CONSONANTS, ...GRANTHA].map((c) => c.word),
  ];
  it('all letters are known', () => {
    const missing = new Set<string>();
    for (const t of texts) for (const w of tamilOnly(t).split(/\s+/).filter(Boolean)) for (const l of splitLetters(w)) if (!shapeFor(l)) missing.add(`${l} (in ${w})`);
    expect([...missing]).toEqual([]);
  });
});

describe('content sanity', () => {
  it('no duplicate words', () => {
    const seen = new Set<string>();
    const dups = WORDS.filter((w) => (seen.has(w.ta) ? true : (seen.add(w.ta), false)));
    expect(dups).toEqual([]);
  });

  it('story questions have three distinct options', () => {
    for (const s of STORIES) for (const q of s.questions) expect(new Set(q.options).size, s.id).toBe(3);
  });

  it('sentences split into 2–6 words', () => {
    for (const s of SENTENCES) {
      const n = sentenceWords(s.ta).length;
      expect(n, s.ta).toBeGreaterThanOrEqual(2);
      expect(n, s.ta).toBeLessThanOrEqual(6);
    }
  });
});

describe('curriculum', () => {
  it('has Grade 1 and Grade 2 units', () => {
    expect(UNITS.some((u) => u.grade === 1)).toBe(true);
    expect(UNITS.some((u) => u.grade === 2)).toBe(true);
  });

  it('lesson ids are unique and every lesson has activities', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of ALL_LESSONS) expect(l.activities.length, l.id).toBeGreaterThan(0);
  });

  it('teaches all 247 letters and the grantha letters', () => {
    const taught = new Set<string>();
    for (const l of ALL_LESSONS) for (const a of l.activities) if (a.type === 'write' || a.type === 'meet') taught.add(a.letter);
    const expected = [
      ...VOWELS.map((v) => v.letter),
      'ஃ',
      ...CONSONANTS.map((c) => c.mei),
      ...CONSONANTS.flatMap((c) => VOWELS.map((v) => c.base + v.sign)),
      ...GRANTHA.map((g) => g.base),
      'ஸ்ரீ',
    ];
    expect(expected.filter((x) => !taught.has(x))).toEqual([]);
    expect(expected.length).toBe(12 + 1 + 18 + 216 + 5 + 1);
  });

  it('activities are well formed', () => {
    for (const l of ALL_LESSONS) {
      for (const a of l.activities) {
        if (a.type === 'listen-pick' || a.type === 'picture-pick' || a.type === 'listen-word') {
          const target = a.type === 'picture-pick' ? a.letter : a.target;
          expect(a.options, l.id).toContain(target);
          expect(new Set(a.options).size, l.id).toBe(a.options.length);
          expect(a.options.length, l.id).toBeGreaterThanOrEqual(2);
        }
        if (a.type === 'write' || a.type === 'watch') expect(shapeFor(a.letter), a.letter).not.toBeNull();
        if (a.type === 'warmup') expect(shapeFor(a.shape), a.shape).not.toBeNull();
        if (a.type === 'missing-letter') expect(a.options).toContain(splitLetters(a.word)[a.index]);
        if (a.type === 'story') expect(STORIES.some((s) => s.id === a.id)).toBe(true);
        if (a.type === 'poem') expect(POEMS.some((p) => p.id === a.id)).toBe(true);
      }
    }
  });

  it('word lessons in the letter units only use letters taught before them', () => {
    const known = new Set<string>();
    for (const u of UNITS) {
      if (u.id === 'g2-words') break; // themed vocabulary comes after all letters
      for (const l of u.lessons) {
        for (const a of l.activities) {
          if (a.type === 'write' || a.type === 'meet') known.add(a.letter);
          if (a.type === 'concept') known.add(a.result);
        }
        if (u.id === 'g2-grantha') for (const g of GRANTHA) for (const v of VOWELS) known.add(g.base + v.sign);
        for (const a of l.activities) {
          if (a.type === 'read-word' || a.type === 'write-word' || a.type === 'build-word') {
            const unknown = splitLetters(a.word).filter((x) => !known.has(x));
            expect(unknown, `${l.id}: ${a.word}`).toEqual([]);
          }
        }
      }
    }
  });
});

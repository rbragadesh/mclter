import { AYTHAM, CONSONANTS, GRANTHA, SHRI, VOWELS } from './alphabet';
import { WORDS } from './words';

export interface LetterInfo {
  letter: string;
  kind: 'vowel' | 'aytham' | 'mei' | 'uyirmei' | 'grantha' | 'shri';
  example?: { word: string; emoji: string; meaning: string };
  /** for uyirmei: the consonant (with pulli) and the vowel that make it */
  parts?: [string, string];
  note?: string;
}

const firstWordWith = (g: string) => WORDS.find((w) => w.ta.startsWith(g) && !w.ta.startsWith(g + '்'));

export function letterInfo(g: string): LetterInfo {
  const v = VOWELS.find((x) => x.letter === g);
  if (v) return { letter: g, kind: 'vowel', example: { word: v.word, emoji: v.emoji, meaning: v.meaning }, note: v.long ? 'நெடில் — long sound' : 'குறில் — short sound' };
  if (g === AYTHAM.letter) return { letter: g, kind: 'aytham', example: { word: AYTHAM.word, emoji: AYTHAM.emoji, meaning: AYTHAM.meaning }, note: 'ஆய்த எழுத்து — the special letter' };
  if (g === SHRI.letter) return { letter: g, kind: 'shri', example: { word: SHRI.word, emoji: SHRI.emoji, meaning: SHRI.meaning } };
  for (const c of [...CONSONANTS, ...GRANTHA]) {
    const ex = { word: c.word, emoji: c.emoji, meaning: c.meaning };
    if (g === c.mei) return { letter: g, kind: 'mei', example: ex, note: `மெய் எழுத்து — say “${c.say}”` };
    if (g === c.base) {
      if (c.group === 'grantha') return { letter: g, kind: 'grantha', example: ex, parts: [c.mei, 'அ'] };
      const w = firstWordWith(g);
      return { letter: g, kind: 'uyirmei', parts: [c.mei, 'அ'], example: w ? { word: w.ta, emoji: w.emoji, meaning: w.en } : ex };
    }
    if (g.startsWith(c.base)) {
      const sign = g.slice(c.base.length);
      const vowel = VOWELS.find((x) => x.sign === sign);
      if (vowel) {
        const w = firstWordWith(g);
        return { letter: g, kind: 'uyirmei', parts: [c.mei, vowel.letter], example: w ? { word: w.ta, emoji: w.emoji, meaning: w.en } : undefined };
      }
    }
  }
  return { letter: g, kind: 'uyirmei' };
}

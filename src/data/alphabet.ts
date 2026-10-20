/**
 * The Tamil alphabet: 12 vowels (உயிர்), ஆய்தம், 18 consonants (மெய்), the
 * 216 vowel-consonants (உயிர்மெய்) built from them, and the grantha letters.
 */

export interface VowelInfo {
  letter: string;
  sign: string; // the vowel sign used after a consonant ('' for அ)
  roman: string;
  long: boolean; // நெடில் (long) vs குறில் (short)
  word: string; // example word starting with the letter
  emoji: string;
  meaning: string;
}

export const VOWELS: VowelInfo[] = [
  { letter: 'அ', sign: '', roman: 'a', long: false, word: 'அணில்', emoji: '🐿️', meaning: 'squirrel' },
  { letter: 'ஆ', sign: 'ா', roman: 'aa', long: true, word: 'ஆடு', emoji: '🐐', meaning: 'goat' },
  { letter: 'இ', sign: 'ி', roman: 'i', long: false, word: 'இலை', emoji: '🍃', meaning: 'leaf' },
  { letter: 'ஈ', sign: 'ீ', roman: 'ee', long: true, word: 'ஈ', emoji: '🪰', meaning: 'housefly' },
  { letter: 'உ', sign: 'ு', roman: 'u', long: false, word: 'உப்பு', emoji: '🧂', meaning: 'salt' },
  { letter: 'ஊ', sign: 'ூ', roman: 'oo', long: true, word: 'ஊசி', emoji: '🪡', meaning: 'needle' },
  { letter: 'எ', sign: 'ெ', roman: 'e', long: false, word: 'எலி', emoji: '🐭', meaning: 'mouse' },
  { letter: 'ஏ', sign: 'ே', roman: 'ē', long: true, word: 'ஏணி', emoji: '🪜', meaning: 'ladder' },
  { letter: 'ஐ', sign: 'ை', roman: 'ai', long: true, word: 'ஐந்து', emoji: '🖐️', meaning: 'five' },
  { letter: 'ஒ', sign: 'ொ', roman: 'o', long: false, word: 'ஒட்டகம்', emoji: '🐫', meaning: 'camel' },
  { letter: 'ஓ', sign: 'ோ', roman: 'ō', long: true, word: 'ஓடம்', emoji: '⛵', meaning: 'boat' },
  { letter: 'ஔ', sign: 'ௌ', roman: 'au', long: true, word: 'ஔவையார்', emoji: '👵', meaning: 'Avvaiyar, the poet' },
];

export const AYTHAM = {
  letter: 'ஃ',
  roman: 'akh',
  name: 'அஃகேனம்',
  word: 'எஃகு',
  emoji: '🔩',
  meaning: 'steel',
};

export type ConsonantGroup = 'vallinam' | 'mellinam' | 'idaiyinam' | 'grantha';

export interface ConsonantInfo {
  base: string; // with inherent அ, e.g. க
  mei: string; // with pulli, e.g. க்
  roman: string; // consonant sound, e.g. 'k'
  say: string; // how the bare consonant is recited, e.g. இக்
  group: ConsonantGroup;
  word: string; // example word starting with the letter (or containing it)
  emoji: string;
  meaning: string;
}

export const CONSONANTS: ConsonantInfo[] = [
  { base: 'க', mei: 'க்', roman: 'k', say: 'இக்', group: 'vallinam', word: 'கப்பல்', emoji: '🚢', meaning: 'ship' },
  { base: 'ங', mei: 'ங்', roman: 'ṅ', say: 'இங்', group: 'mellinam', word: 'சங்கு', emoji: '🐚', meaning: 'conch' },
  { base: 'ச', mei: 'ச்', roman: 'ch', say: 'இச்', group: 'vallinam', word: 'சட்டை', emoji: '👕', meaning: 'shirt' },
  { base: 'ஞ', mei: 'ஞ்', roman: 'ñ', say: 'இஞ்', group: 'mellinam', word: 'ஞாயிறு', emoji: '☀️', meaning: 'sun / Sunday' },
  { base: 'ட', mei: 'ட்', roman: 'ṭ', say: 'இட்', group: 'vallinam', word: 'பட்டம்', emoji: '🪁', meaning: 'kite' },
  { base: 'ண', mei: 'ண்', roman: 'ṇ', say: 'இண்', group: 'mellinam', word: 'கண்', emoji: '👁️', meaning: 'eye' },
  { base: 'த', mei: 'த்', roman: 'th', say: 'இத்', group: 'vallinam', word: 'தக்காளி', emoji: '🍅', meaning: 'tomato' },
  { base: 'ந', mei: 'ந்', roman: 'n', say: 'இந்', group: 'mellinam', word: 'நண்டு', emoji: '🦀', meaning: 'crab' },
  { base: 'ப', mei: 'ப்', roman: 'p', say: 'இப்', group: 'vallinam', word: 'பசு', emoji: '🐄', meaning: 'cow' },
  { base: 'ம', mei: 'ம்', roman: 'm', say: 'இம்', group: 'mellinam', word: 'மயில்', emoji: '🦚', meaning: 'peacock' },
  { base: 'ய', mei: 'ய்', roman: 'y', say: 'இய்', group: 'idaiyinam', word: 'யானை', emoji: '🐘', meaning: 'elephant' },
  { base: 'ர', mei: 'ர்', roman: 'r', say: 'இர்', group: 'idaiyinam', word: 'ரயில்', emoji: '🚂', meaning: 'train' },
  { base: 'ல', mei: 'ல்', roman: 'l', say: 'இல்', group: 'idaiyinam', word: 'லட்டு', emoji: '🍬', meaning: 'laddu (a sweet)' },
  { base: 'வ', mei: 'வ்', roman: 'v', say: 'இவ்', group: 'idaiyinam', word: 'வாத்து', emoji: '🦆', meaning: 'duck' },
  { base: 'ழ', mei: 'ழ்', roman: 'zh', say: 'இழ்', group: 'idaiyinam', word: 'பழம்', emoji: '🍎', meaning: 'fruit' },
  { base: 'ள', mei: 'ள்', roman: 'ḷ', say: 'இள்', group: 'idaiyinam', word: 'வாள்', emoji: '🗡️', meaning: 'sword' },
  { base: 'ற', mei: 'ற்', roman: 'ṟ', say: 'இற்', group: 'vallinam', word: 'சுறா', emoji: '🦈', meaning: 'shark' },
  { base: 'ன', mei: 'ன்', roman: 'ṉ', say: 'இன்', group: 'mellinam', word: 'மான்', emoji: '🦌', meaning: 'deer' },
];

export const GRANTHA: ConsonantInfo[] = [
  { base: 'ஜ', mei: 'ஜ்', roman: 'j', say: 'இஜ்', group: 'grantha', word: 'ஜன்னல்', emoji: '🪟', meaning: 'window' },
  { base: 'ஷ', mei: 'ஷ்', roman: 'sh', say: 'இஷ்', group: 'grantha', word: 'புஷ்பம்', emoji: '🌼', meaning: 'flower' },
  { base: 'ஸ', mei: 'ஸ்', roman: 's', say: 'இஸ்', group: 'grantha', word: 'பஸ்', emoji: '🚌', meaning: 'bus' },
  { base: 'ஹ', mei: 'ஹ்', roman: 'h', say: 'இஹ்', group: 'grantha', word: 'ஹல்வா', emoji: '🍮', meaning: 'halwa (a sweet)' },
  { base: 'க்ஷ', mei: 'க்ஷ்', roman: 'ksh', say: 'இக்ஷ்', group: 'grantha', word: 'பக்ஷி', emoji: '🐦', meaning: 'bird' },
];

export const SHRI = { letter: 'ஸ்ரீ', roman: 'shrī', word: 'ஸ்ரீ', emoji: '🙏', meaning: 'Shri (a respectful title)' };

const VOWEL_ROMAN = Object.fromEntries(VOWELS.map((v) => [v.sign, v.roman]));

/** consonant + vowel sign, e.g. uyirmei('க', 'ா') = 'கா' */
export function uyirmei(base: string, sign: string): string {
  return base + sign;
}

/** The letter, transliterated, e.g. கா -> 'kaa' */
export function romanOf(g: string): string {
  const v = VOWELS.find((x) => x.letter === g);
  if (v) return v.roman;
  if (g === 'ஃ') return AYTHAM.roman;
  if (g === SHRI.letter) return SHRI.roman;
  for (const c of [...CONSONANTS, ...GRANTHA]) {
    if (g === c.mei) return c.roman;
    if (g.startsWith(c.base)) {
      const rest = g.slice(c.base.length);
      if (rest in VOWEL_ROMAN) return c.roman + VOWEL_ROMAN[rest];
    }
  }
  return g;
}

/** What to say aloud for a single letter (consonants are recited as இக், இங், ...). */
export function spokenName(g: string): string {
  if (g === 'ஃ') return AYTHAM.name;
  for (const c of [...CONSONANTS, ...GRANTHA]) if (g === c.mei) return c.say;
  return g;
}

/** Split Tamil text into letters (grapheme clusters): consonant + sign/pulli, vowels, ஃ. */
export function splitLetters(text: string): string[] {
  const out: string[] = [];
  const isSign = (ch: string) => /[ா-்ௗ]/.test(ch);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    // க்ஷ and ஸ்ரீ are single letters
    if (text.startsWith('க்ஷ', i)) {
      let g = 'க்ஷ';
      i += 2;
      while (i + 1 < text.length && isSign(text[i + 1])) g += text[++i];
      out.push(g);
      continue;
    }
    if (text.startsWith('ஸ்ரீ', i)) {
      out.push('ஸ்ரீ');
      i += 3;
      continue;
    }
    if (isSign(ch) && out.length) {
      out[out.length - 1] += ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

export const ALL_MEI = [...CONSONANTS, ...GRANTHA].map((c) => c.mei);
export const SIGN_ORDER = VOWELS.map((v) => v.sign);

export function isTamilLetter(g: string): boolean {
  return /^[஀-௿]+$/.test(g);
}

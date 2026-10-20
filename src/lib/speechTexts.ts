/** Every Tamil text the app may speak — used to pre-generate the audio files. */
import { AYTHAM, CONSONANTS, GRANTHA, SHRI, VOWELS, spokenName } from '../data/alphabet';
import { POEMS } from '../data/poems';
import { SENTENCES, sentenceWords } from '../data/sentences';
import { STORIES } from '../data/stories';
import { STORY_PROMPTS, STORY_WORDS } from '../data/storyWords';
import { WORDS } from '../data/words';
import { allShapeGraphemes } from './letters';
import { PRAISE_TA, PROMPTS, RIGHT_TA, TRY_AGAIN_TA } from './prompts';

export function tamilTexts(): string[] {
  const out = new Set<string>();
  const add = (t: string) => t.trim() && out.add(t.trim());
  for (const g of allShapeGraphemes()) add(spokenName(g));
  add(AYTHAM.word);
  add(SHRI.word);
  for (const v of VOWELS) add(v.word);
  for (const c of [...CONSONANTS, ...GRANTHA]) add(c.word);
  for (const w of WORDS) add(w.ta);
  for (const s of SENTENCES) {
    add(s.ta);
    for (const w of sentenceWords(s.ta)) add(w);
  }
  for (const s of STORIES) {
    add(s.title);
    for (const p of s.pages) {
      add(p.ta);
      for (const w of p.ta.replace(/["“”!?.,]/g, ' ').split(/\s+/)) add(w);
    }
    if (s.moral) add(s.moral.ta);
    for (const q of s.questions) {
      add(q.q);
      q.options.forEach(add);
    }
  }
  for (const p of POEMS) {
    add(p.title);
    for (const l of p.lines) {
      add(l.ta.replace(/[–-]/g, ' '));
      for (const w of l.ta.replace(/[–.\-]/g, ' ').split(/\s+/)) add(w);
    }
  }
  for (const g of STORY_WORDS) g.words.forEach(add);
  for (const p of STORY_PROMPTS) add(p.title);
  [...PRAISE_TA, RIGHT_TA, TRY_AGAIN_TA].forEach(add);
  return [...out];
}

export function englishTexts(): string[] {
  return Object.values(PROMPTS);
}

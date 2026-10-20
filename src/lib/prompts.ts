/** Spoken/written instructions. English for the child (she is learning Tamil), Tamil for praise. */
export const PROMPTS = {
  meet: 'Listen, and say it with me.',
  watch: 'Watch how to write it.',
  trace: 'Now you trace it. Start at the green dot.',
  guided: 'Now write it over the light letter.',
  memory: 'Now write it on your own.',
  warmup: 'Trace the line. Start at the green dot.',
  listenPick: 'Listen. Which letter is it?',
  picturePick: 'Which letter is in this word?',
  concept: 'See how the two letters join together.',
  readWord: 'Tap each letter, then read the whole word.',
  listenWord: 'Listen. Which word is it?',
  buildWord: 'Put the letters in the right order.',
  missing: 'Which letter is missing?',
  writeWord: 'Write the word, one letter in each box.',
  readSentence: 'Read the sentence. Tap a word to hear it.',
  buildSentence: 'Put the words in the right order.',
  writeSentence: 'Copy the sentence, one letter at a time.',
  dictation: 'Listen, and write the word.',
  story: 'Let us read a story.',
  poem: 'Let us read it and say it together.',
  wrongDirection: 'Oops, the other way! Follow the arrow.',
  wrongStart: 'Start from the green dot.',
  wrongOrder: 'Not that one yet. Draw the stroke with the green dot first.',
  wrongShape: 'Try again. Follow the shape of the letter.',
  lifted: 'Try it again without lifting your finger.',
  partial: 'Keep going!',
  needDot: 'Now just put a small dot.',
  watchAgain: 'Watch me, then try again.',
  looksLike: 'Hmm, that looks like a different letter. Let us look at it again.',
  notQuite: 'Not quite. Try again.',
  correct: 'That is right!',
  lessonDone: 'You finished the lesson! Well done!',
  readItYourself: 'Now you read it aloud.',
} as const;

export type PromptKey = keyof typeof PROMPTS;

export const PRAISE_TA = ['சபாஷ்!', 'அருமை!', 'மிக நன்று!', 'நன்றாக எழுதினாய்!'];
export const RIGHT_TA = 'சரியான விடை!';
export const TRY_AGAIN_TA = 'மீண்டும் முயற்சி செய்.';

/**
 * Verse for reading and reciting. Only public-domain texts: Avvaiyar's
 * ஆத்திசூடி, the Thirukkural, Subramania Bharati (works nationalised in 1949)
 * and a traditional nursery rhyme.
 */

export interface PoemLine {
  ta: string;
  en: string;
}

export interface Poem {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  cover: string;
  lines: PoemLine[];
}

export const POEMS: Poem[] = [
  {
    id: 'nila-nila',
    title: 'நிலா நிலா ஓடி வா',
    titleEn: 'Moon, moon, come running',
    author: 'நாட்டுப்புறப் பாடல் (traditional)',
    cover: '🌙',
    lines: [
      { ta: 'நிலா நிலா ஓடி வா', en: 'Moon, moon, come running' },
      { ta: 'நில்லாமல் ஓடி வா', en: 'Come running without stopping' },
      { ta: 'மலை மேலே ஏறி வா', en: 'Climb over the mountain and come' },
      { ta: 'மல்லிகைப் பூ கொண்டு வா', en: 'Bring jasmine flowers with you' },
    ],
  },
  {
    id: 'aathichoodi',
    title: 'ஆத்திசூடி',
    titleEn: 'Aathichoodi (first 13 lines)',
    author: 'ஔவையார் (Avvaiyar)',
    cover: '👵',
    lines: [
      { ta: 'அறம் செய விரும்பு', en: 'Love to do good.' },
      { ta: 'ஆறுவது சினம்', en: 'Anger should be cooled.' },
      { ta: 'இயல்வது கரவேல்', en: 'Do not hide what you are able to give.' },
      { ta: 'ஈவது விலக்கேல்', en: 'Do not stop anyone from giving.' },
      { ta: 'உடையது விளம்பேல்', en: 'Do not boast about what you have.' },
      { ta: 'ஊக்கமது கைவிடேல்', en: 'Never give up trying.' },
      { ta: 'எண் எழுத்து இகழேல்', en: 'Do not neglect numbers and letters.' },
      { ta: 'ஏற்பது இகழ்ச்சி', en: 'Begging brings shame.' },
      { ta: 'ஐயம் இட்டு உண்', en: 'Share your food with the needy.' },
      { ta: 'ஒப்புரவு ஒழுகு', en: 'Live in harmony with others.' },
      { ta: 'ஓதுவது ஒழியேல்', en: 'Never stop learning.' },
      { ta: 'ஔவியம் பேசேல்', en: 'Do not speak with jealousy.' },
      { ta: 'அஃகம் சுருக்கேல்', en: 'Do not cheat when measuring grain.' },
    ],
  },
  {
    id: 'kural-1',
    title: 'திருக்குறள் 1',
    titleEn: 'Thirukkural 1',
    author: 'திருவள்ளுவர் (Thiruvalluvar)',
    cover: '📜',
    lines: [
      { ta: 'அகர முதல எழுத்தெல்லாம் ஆதி', en: 'As the letter அ is the first of all letters,' },
      { ta: 'பகவன் முதற்றே உலகு.', en: 'so God is the first of the world.' },
    ],
  },
  {
    id: 'kural-392',
    title: 'திருக்குறள் 392',
    titleEn: 'Thirukkural 392',
    author: 'திருவள்ளுவர் (Thiruvalluvar)',
    cover: '👀',
    lines: [
      { ta: 'எண்ணென்ப ஏனை எழுத்தென்ப இவ்விரண்டும்', en: 'Numbers and letters — these two' },
      { ta: 'கண்ணென்ப வாழும் உயிர்க்கு.', en: 'are the two eyes of every living person.' },
    ],
  },
  {
    id: 'odi-vilaiyadu',
    title: 'ஓடி விளையாடு பாப்பா',
    titleEn: 'Run and play, little one',
    author: 'பாரதியார் (Subramania Bharati)',
    cover: '🧒',
    lines: [
      { ta: 'ஓடி விளையாடு பாப்பா – நீ', en: 'Run and play, little one —' },
      { ta: 'ஓய்ந்திருக்கலாகாது பாப்பா', en: 'you must not sit idle, little one.' },
      { ta: 'கூடி விளையாடு பாப்பா – ஒரு', en: 'Play together with others, little one —' },
      { ta: 'குழந்தையை வையாதே பாப்பா', en: 'never scold another child, little one.' },
    ],
  },
];

/** Extra words for "Make my own story": joining words, verbs in past tense, describing words. */
export const STORY_WORDS: { group: string; words: string[] }[] = [
  { group: 'Start', words: ['ஒரு', 'நாள்', 'ஒரு நாள்', 'அங்கே', 'இது', 'அது', 'என்', 'நான்', 'அவள்', 'அவன்', 'அவர்கள்'] },
  {
    group: 'Did',
    words: ['இருந்தது', 'இருந்தாள்', 'வந்தது', 'வந்தாள்', 'போனது', 'போனாள்', 'ஓடியது', 'பறந்தது', 'பாடியது', 'ஆடியது', 'சாப்பிட்டது', 'குடித்தது', 'தூங்கியது', 'விளையாடியது', 'சிரித்தாள்', 'பார்த்தாள்', 'பெய்தது'],
  },
  { group: 'How', words: ['பெரிய', 'சிறிய', 'அழகான', 'மிகவும்', 'நல்ல', 'வேகமாக', 'மெதுவாக', 'மகிழ்ச்சியாக'] },
  { group: 'Where', words: ['வீட்டில்', 'மரத்தில்', 'தண்ணீரில்', 'பள்ளியில்', 'காட்டில்', 'வானத்தில்', 'தோட்டத்தில்'] },
  { group: 'And', words: ['உடன்', 'மற்றும்', 'பிறகு', 'கடைசியில்'] },
];

export const STORY_PROMPTS: { scene: string; title: string; titleEn: string }[] = [
  { scene: '🐘🌳💧', title: 'யானையின் குளியல்', titleEn: 'The elephant’s bath' },
  { scene: '👧🐈🧶', title: 'என் பூனை', titleEn: 'My cat' },
  { scene: '🌧️⛵👦', title: 'மழை நாள்', titleEn: 'A rainy day' },
  { scene: '🦚💃🌸', title: 'ஆடும் மயில்', titleEn: 'The dancing peacock' },
  { scene: '🏫📚👭', title: 'என் பள்ளி', titleEn: 'My school' },
  { scene: '🐒🍌🌳', title: 'குரங்கும் வாழைப்பழமும்', titleEn: 'The monkey and the banana' },
];

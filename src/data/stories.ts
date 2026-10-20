/**
 * Short stories for Grade 1–2 reading. The fables are retold in our own
 * simple words; the last three are original. Each page is one or two short
 * sentences with a picture, and each story ends with three questions.
 */

export interface StoryPage {
  ta: string;
  en: string;
  scene: string; // emoji picture
}

export interface Question {
  q: string;
  qEn: string;
  options: string[]; // first option is the right answer (shuffled when shown)
}

export interface Story {
  id: string;
  title: string;
  titleEn: string;
  cover: string;
  grade: 1 | 2;
  pages: StoryPage[];
  moral?: { ta: string; en: string };
  questions: Question[];
}

const P = (ta: string, en: string, scene: string): StoryPage => ({ ta, en, scene });
const Q = (q: string, qEn: string, options: string[]): Question => ({ q, qEn, options });

export const STORIES: Story[] = [
  {
    id: 'thirsty-crow',
    title: 'தாகமுள்ள காகம்',
    titleEn: 'The Thirsty Crow',
    cover: '🐦‍⬛',
    grade: 1,
    pages: [
      P('ஒரு நாள் வெயில் அதிகமாக இருந்தது.', 'One day it was very hot.', '☀️🌵'),
      P('ஒரு காகத்துக்குத் தாகமாக இருந்தது.', 'A crow was thirsty.', '🐦‍⬛💭💧'),
      P('காகம் தண்ணீர் தேடிப் பறந்தது.', 'The crow flew looking for water.', '🐦‍⬛🌳🏠'),
      P('ஒரு பானையில் கொஞ்சம் தண்ணீர் இருந்தது.', 'There was a little water in a pot.', '🏺💧'),
      P('காகத்தின் அலகு தண்ணீரை எட்டவில்லை.', 'The crow’s beak could not reach the water.', '🐦‍⬛🏺😟'),
      P('காகம் சிறு கற்களைப் பொறுக்கியது.', 'The crow picked up small stones.', '🐦‍⬛🪨🪨'),
      P('ஒவ்வொரு கல்லாகப் பானையில் போட்டது.', 'It dropped them into the pot one by one.', '🪨⬇️🏺'),
      P('தண்ணீர் மேலே வந்தது. காகம் தண்ணீர் குடித்தது.', 'The water came up. The crow drank the water.', '🐦‍⬛💧😊'),
    ],
    moral: { ta: 'முயற்சி திருவினை ஆக்கும்.', en: 'Effort brings success.' },
    questions: [
      Q('காகத்துக்கு என்ன வேண்டும்?', 'What did the crow want?', ['தண்ணீர்', 'பழம்', 'பால்']),
      Q('பானையில் காகம் எதைப் போட்டது?', 'What did the crow drop into the pot?', ['கற்கள்', 'இலைகள்', 'பூக்கள்']),
      Q('கடைசியில் காகம் என்ன செய்தது?', 'What did the crow do in the end?', ['தண்ணீர் குடித்தது', 'தூங்கியது', 'பாடியது']),
    ],
  },
  {
    id: 'hare-tortoise',
    title: 'முயலும் ஆமையும்',
    titleEn: 'The Hare and the Tortoise',
    cover: '🐇🐢',
    grade: 1,
    pages: [
      P('ஒரு காட்டில் ஒரு முயலும் ஓர் ஆமையும் இருந்தன.', 'A hare and a tortoise lived in a forest.', '🌳🐇🐢🌳'),
      P('"நான்தான் வேகமாக ஓடுவேன்" என்றது முயல்.', '“I am the fastest runner,” said the hare.', '🐇💨'),
      P('"சரி, போட்டி வைப்போம்" என்றது ஆமை.', '“All right, let us have a race,” said the tortoise.', '🐢🏁'),
      P('போட்டி தொடங்கியது. முயல் வேகமாக ஓடியது.', 'The race began. The hare ran fast.', '🏁🐇💨'),
      P('வழியில் முயல் ஒரு மரத்தடியில் தூங்கியது.', 'On the way, the hare slept under a tree.', '🌳🐇😴'),
      P('ஆமை மெதுவாக, நிற்காமல் நடந்தது.', 'The tortoise walked slowly, without stopping.', '🐢➡️'),
      P('ஆமை முதலில் வந்து வென்றது!', 'The tortoise came first and won!', '🐢🏆🎉'),
    ],
    moral: { ta: 'மெதுவாக இருந்தாலும் தொடர்ந்து முயற்சி செய்.', en: 'Even if you are slow, keep trying.' },
    questions: [
      Q('யார் வேகமாக ஓடியது?', 'Who ran fast?', ['முயல்', 'ஆமை', 'யானை']),
      Q('வழியில் முயல் என்ன செய்தது?', 'What did the hare do on the way?', ['தூங்கியது', 'சாப்பிட்டது', 'பாடியது']),
      Q('போட்டியில் யார் வென்றது?', 'Who won the race?', ['ஆமை', 'முயல்', 'நரி']),
    ],
  },
  {
    id: 'lion-mouse',
    title: 'சிங்கமும் எலியும்',
    titleEn: 'The Lion and the Mouse',
    cover: '🦁🐭',
    grade: 2,
    pages: [
      P('ஒரு சிங்கம் மரத்தடியில் தூங்கிக்கொண்டிருந்தது.', 'A lion was sleeping under a tree.', '🌳🦁😴'),
      P('ஒரு சிறிய எலி சிங்கத்தின் மேல் ஓடியது.', 'A little mouse ran over the lion.', '🐭🦁'),
      P('சிங்கம் கோபமாக எலியைப் பிடித்தது.', 'The lion angrily caught the mouse.', '🦁😠🐭'),
      P('"என்னை விட்டுவிடு. நான் உனக்கு உதவுவேன்" என்றது எலி.', '“Let me go. I will help you,” said the mouse.', '🐭🙏'),
      P('சிங்கம் சிரித்து எலியை விட்டுவிட்டது.', 'The lion laughed and let the mouse go.', '🦁😄🐭'),
      P('ஒரு நாள் சிங்கம் ஒரு வலையில் மாட்டிக்கொண்டது.', 'One day the lion was caught in a net.', '🦁🕸️😟'),
      P('எலி ஓடி வந்து வலையைக் கடித்து அறுத்தது.', 'The mouse ran up and bit through the net.', '🐭✂️🕸️'),
      P('சிங்கம் தப்பியது. சிங்கமும் எலியும் நண்பர்கள் ஆயின.', 'The lion was free. The lion and the mouse became friends.', '🦁🤝🐭'),
    ],
    moral: { ta: 'சிறியவர்களையும் மதிக்க வேண்டும்.', en: 'Respect everyone, even the small.' },
    questions: [
      Q('சிங்கம் எங்கே தூங்கியது?', 'Where did the lion sleep?', ['மரத்தடியில்', 'வீட்டில்', 'கடலில்']),
      Q('சிங்கம் எதில் மாட்டிக்கொண்டது?', 'What was the lion caught in?', ['வலையில்', 'குழியில்', 'மரத்தில்']),
      Q('சிங்கத்துக்கு யார் உதவியது?', 'Who helped the lion?', ['எலி', 'புலி', 'யானை']),
    ],
  },
  {
    id: 'ant-dove',
    title: 'எறும்பும் புறாவும்',
    titleEn: 'The Ant and the Dove',
    cover: '🐜🕊️',
    grade: 2,
    pages: [
      P('ஓர் எறும்பு ஆற்றில் தண்ணீர் குடிக்க வந்தது.', 'An ant came to the river to drink water.', '🐜🏞️'),
      P('எறும்பு தண்ணீரில் விழுந்துவிட்டது.', 'The ant fell into the water.', '🐜💦😟'),
      P('மரத்தின் மேல் ஒரு புறா இருந்தது.', 'A dove was sitting on a tree.', '🌳🕊️'),
      P('புறா ஓர் இலையைப் பறித்துத் தண்ணீரில் போட்டது.', 'The dove plucked a leaf and dropped it into the water.', '🕊️🍃💧'),
      P('எறும்பு இலையின் மேல் ஏறிக் கரைக்கு வந்தது.', 'The ant climbed onto the leaf and reached the bank.', '🐜🍃😊'),
      P('ஒரு நாள் ஒரு வேடன் புறாவை நோக்கி அம்பு எய்யப் போனான்.', 'One day a hunter was about to shoot an arrow at the dove.', '🏹🕊️'),
      P('எறும்பு வேடனின் காலில் கடித்தது.', 'The ant bit the hunter’s foot.', '🐜🦶'),
      P('வேடன் "ஆ!" என்று கத்தினான். புறா பறந்து தப்பியது.', 'The hunter cried “Ah!” and the dove flew away safely.', '🕊️💨😊'),
    ],
    moral: { ta: 'உதவி செய்தால் உதவி கிடைக்கும்.', en: 'Help others and you will be helped.' },
    questions: [
      Q('எறும்பு எங்கே விழுந்தது?', 'Where did the ant fall?', ['தண்ணீரில்', 'மரத்தில்', 'வீட்டில்']),
      Q('புறா தண்ணீரில் எதைப் போட்டது?', 'What did the dove drop into the water?', ['இலை', 'கல்', 'பழம்']),
      Q('எறும்பு யாரைக் கடித்தது?', 'Whom did the ant bite?', ['வேடனை', 'புறாவை', 'பூனையை']),
    ],
  },
  {
    id: 'greedy-dog',
    title: 'பேராசை நாய்',
    titleEn: 'The Greedy Dog',
    cover: '🐕🦴',
    grade: 2,
    pages: [
      P('ஒரு நாய்க்கு ஓர் எலும்புத் துண்டு கிடைத்தது.', 'A dog found a piece of bone.', '🐕🦴'),
      P('நாய் அதைக் கவ்விக்கொண்டு பாலத்தின் மேல் நடந்தது.', 'Holding it in its mouth, the dog walked over a bridge.', '🐕🦴🌉'),
      P('கீழே தண்ணீரில் இன்னொரு நாய் தெரிந்தது.', 'It saw another dog in the water below.', '🌉💧🐕'),
      P('அது தன் நிழல் என்று நாய்க்குத் தெரியவில்லை.', 'The dog did not know it was its own reflection.', '🐕🤔'),
      P('"அந்த எலும்பும் எனக்கு வேண்டும்" என்று நாய் குரைத்தது.', '“I want that bone too!” barked the dog.', '🐕💬'),
      P('வாயிலிருந்த எலும்பு தண்ணீரில் விழுந்தது.', 'The bone in its mouth fell into the water.', '🦴💦'),
      P('நாய் வருத்தத்துடன் வீட்டுக்குப் போனது.', 'The dog went home, sad.', '🐕😢🏠'),
    ],
    moral: { ta: 'பேராசை பெரு நஷ்டம்.', en: 'Greed leads to great loss.' },
    questions: [
      Q('நாய்க்கு என்ன கிடைத்தது?', 'What did the dog find?', ['எலும்பு', 'பந்து', 'பழம்']),
      Q('தண்ணீரில் நாய் எதைப் பார்த்தது?', 'What did the dog see in the water?', ['தன் நிழலை', 'மீனை', 'பூனையை']),
      Q('எலும்பு எங்கே விழுந்தது?', 'Where did the bone fall?', ['தண்ணீரில்', 'வீட்டில்', 'மரத்தில்']),
    ],
  },
  {
    id: 'meenas-kitten',
    title: 'மீனாவின் பூனைக்குட்டி',
    titleEn: 'Meena’s Kitten',
    cover: '👧🐈',
    grade: 1,
    pages: [
      P('மீனாவிடம் ஒரு சிறிய பூனைக்குட்டி இருந்தது.', 'Meena had a little kitten.', '👧🐈'),
      P('அதன் பெயர் பஞ்சு. அது வெள்ளையாக இருந்தது.', 'Its name was Panju. It was white.', '🐈⚪'),
      P('பஞ்சுக்குப் பால் என்றால் மிகவும் பிடிக்கும்.', 'Panju loved milk.', '🐈🥛😋'),
      P('ஒரு நாள் பஞ்சுவைக் காணவில்லை.', 'One day Panju was missing.', '👧😟❓'),
      P('மீனா வீடு முழுவதும் தேடினாள்.', 'Meena searched the whole house.', '👧🔍🏠'),
      P('பஞ்சு கூடையில் நூல் பந்துடன் விளையாடிக்கொண்டிருந்தது!', 'Panju was playing with a ball of wool in the basket!', '🧺🧶🐈'),
      P('மீனா சிரித்தாள். பஞ்சுவைக் கட்டிப்பிடித்தாள்.', 'Meena laughed and hugged Panju.', '👧😄🐈'),
    ],
    questions: [
      Q('பூனைக்குட்டியின் பெயர் என்ன?', 'What was the kitten’s name?', ['பஞ்சு', 'மீனா', 'ராமு']),
      Q('பஞ்சுக்கு எது பிடிக்கும்?', 'What did Panju love?', ['பால்', 'கீரை', 'மிளகாய்']),
      Q('பஞ்சு எங்கே இருந்தது?', 'Where was Panju?', ['கூடையில்', 'மரத்தில்', 'பள்ளியில்']),
    ],
  },
  {
    id: 'rain-came',
    title: 'மழை வந்தது',
    titleEn: 'The Rain Came',
    cover: '🌧️⛵',
    grade: 1,
    pages: [
      P('வானத்தில் கருமேகங்கள் வந்தன.', 'Dark clouds came into the sky.', '☁️☁️'),
      P('குளிர்ந்த காற்று வீசியது.', 'A cool wind blew.', '🌬️🌳'),
      P('மழை பெய்யத் தொடங்கியது.', 'It began to rain.', '🌧️🌧️'),
      P('கவின் ஒரு காகிதக் கப்பல் செய்தான்.', 'Kavin made a paper boat.', '👦📄⛵'),
      P('தண்ணீரில் கப்பல் மிதந்து சென்றது.', 'The boat floated away on the water.', '💧⛵💧'),
      P('மழை நின்றதும் வானவில் தெரிந்தது.', 'When the rain stopped, a rainbow appeared.', '🌈'),
      P('"எவ்வளவு அழகு!" என்றான் கவின்.', '“How beautiful!” said Kavin.', '👦😍🌈'),
    ],
    questions: [
      Q('வானத்தில் என்ன வந்தது?', 'What came into the sky?', ['கருமேகங்கள்', 'பறவைகள்', 'விமானம்']),
      Q('கவின் என்ன செய்தான்?', 'What did Kavin make?', ['காகிதக் கப்பல்', 'பட்டம்', 'பொம்மை']),
      Q('மழை நின்றதும் என்ன தெரிந்தது?', 'What appeared when the rain stopped?', ['வானவில்', 'நிலா', 'நட்சத்திரம்']),
    ],
  },
  {
    id: 'grandmas-garden',
    title: 'பாட்டியின் தோட்டம்',
    titleEn: 'Grandma’s Garden',
    cover: '👵🌱',
    grade: 2,
    pages: [
      P('பாட்டி வீட்டின் பின்னால் ஒரு தோட்டம் இருந்தது.', 'There was a garden behind Grandma’s house.', '👵🏡🌱'),
      P('அங்கே தக்காளி, கத்தரிக்காய், மிளகாய் வளர்ந்தன.', 'Tomatoes, brinjals and chillies grew there.', '🍅🍆🌶️'),
      P('தினமும் பாட்டி செடிகளுக்குத் தண்ணீர் ஊற்றினார்.', 'Every day Grandma watered the plants.', '👵💧🌱'),
      P('நிலா பாட்டிக்கு உதவி செய்தாள்.', 'Nila helped Grandma.', '👧🤝👵'),
      P('ஒரு நாள் சிவப்புத் தக்காளிகள் பழுத்தன.', 'One day the red tomatoes were ripe.', '🍅🍅🍅'),
      P('பாட்டி தக்காளி ரசம் வைத்தார்.', 'Grandma made tomato rasam.', '👵🍲'),
      P('"நம் தோட்டத் தக்காளி! மிகவும் சுவை!" என்றாள் நிலா.', '“Tomatoes from our garden! So tasty!” said Nila.', '👧😋🍲'),
    ],
    questions: [
      Q('தோட்டம் எங்கே இருந்தது?', 'Where was the garden?', ['வீட்டின் பின்னால்', 'பள்ளியில்', 'கடலில்']),
      Q('செடிகளுக்கு யார் தண்ணீர் ஊற்றினார்?', 'Who watered the plants?', ['பாட்டி', 'தாத்தா', 'அப்பா']),
      Q('பாட்டி என்ன சமைத்தார்?', 'What did Grandma cook?', ['தக்காளி ரசம்', 'இட்லி', 'கேக்']),
    ],
  },
];

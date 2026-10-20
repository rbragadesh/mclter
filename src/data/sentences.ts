export interface Sentence {
  ta: string;
  en: string;
  emoji: string;
  grade: 1 | 2;
}

const S = (ta: string, en: string, emoji: string, grade: 1 | 2): Sentence => ({ ta, en, emoji, grade });

export const SENTENCES: Sentence[] = [
  S('இது மரம்.', 'This is a tree.', '🌳', 1),
  S('இது படம்.', 'This is a picture.', '🖼️', 1),
  S('அது கடல்.', 'That is the sea.', '🌊', 1),
  S('இது பசு.', 'This is a cow.', '🐄', 1),
  S('அது யானை.', 'That is an elephant.', '🐘', 1),
  S('இது என் வீடு.', 'This is my house.', '🏠', 1),
  S('இவர் என் அம்மா.', 'This is my mother.', '👩', 1),
  S('அவள் என் அக்கா.', 'She is my elder sister.', '👧', 1),
  S('அவன் என் தம்பி.', 'He is my younger brother.', '👦', 1),
  S('மயில் ஆடும்.', 'The peacock dances.', '🦚', 1),
  S('கிளி பேசும்.', 'The parrot talks.', '🦜', 1),
  S('நாய் குரைக்கும்.', 'The dog barks.', '🐕', 1),
  S('பூனை பால் குடிக்கும்.', 'The cat drinks milk.', '🐈', 1),
  S('மீன் நீந்தும்.', 'The fish swims.', '🐟', 1),
  S('பறவை பறக்கும்.', 'The bird flies.', '🐦', 1),
  S('மழை பெய்கிறது.', 'It is raining.', '🌧️', 1),
  S('யானை பெரியது.', 'The elephant is big.', '🐘', 1),
  S('எறும்பு சிறியது.', 'The ant is small.', '🐜', 1),
  S('பூ அழகாக இருக்கிறது.', 'The flower is beautiful.', '🌸', 1),
  S('வானத்தில் நிலா இருக்கிறது.', 'The moon is in the sky.', '🌙', 1),

  S('நான் பள்ளிக்குச் செல்கிறேன்.', 'I am going to school.', '🏫', 2),
  S('நான் தமிழ் படிக்கிறேன்.', 'I am learning Tamil.', '📖', 2),
  S('அம்மா சோறு சமைத்தார்.', 'Mother cooked rice.', '🍚', 2),
  S('அப்பா கடைக்குச் சென்றார்.', 'Father went to the shop.', '🏪', 2),
  S('தாத்தா கதை சொன்னார்.', 'Grandfather told a story.', '👴', 2),
  S('பாட்டி பாட்டுப் பாடினார்.', 'Grandmother sang a song.', '👵', 2),
  S('பசு பால் தரும்.', 'The cow gives milk.', '🐄', 2),
  S('தேனீ தேன் தரும்.', 'The bee gives honey.', '🐝', 2),
  S('கோழி முட்டை இடும்.', 'The hen lays eggs.', '🐔', 2),
  S('சூரியன் காலையில் உதிக்கும்.', 'The sun rises in the morning.', '🌅', 2),
  S('வானம் நீலமாக இருக்கிறது.', 'The sky is blue.', '🔵', 2),
  S('கிளியின் நிறம் பச்சை.', 'The parrot’s colour is green.', '🦜', 2),
  S('நான் பந்து விளையாடுகிறேன்.', 'I am playing with a ball.', '⚽', 2),
  S('குழந்தை தூங்குகிறது.', 'The baby is sleeping.', '👶', 2),
  S('நாங்கள் பூங்காவுக்குச் சென்றோம்.', 'We went to the park.', '🌳', 2),
  S('மரத்தில் குரங்கு இருக்கிறது.', 'There is a monkey in the tree.', '🐒', 2),
  S('குளத்தில் தவளை குதித்தது.', 'The frog jumped into the pond.', '🐸', 2),
  S('என் நண்பனின் பெயர் ராமு.', 'My friend’s name is Ramu.', '🧒', 2),
  S('நான் தினமும் பல் துலக்குவேன்.', 'I brush my teeth every day.', '🪥', 2),
  S('சாப்பிடும் முன் கை கழுவு.', 'Wash your hands before eating.', '🧼', 2),
  S('பெரியவர்களை மதிக்க வேண்டும்.', 'We must respect our elders.', '🙏', 2),
  S('மழையில் காகிதக் கப்பல் விட்டேன்.', 'I floated a paper boat in the rain.', '⛵', 2),
];

/** Split a sentence into words (keeping the final full stop with the last word). */
export function sentenceWords(ta: string): string[] {
  return ta.replace(/\.$/, '').split(/\s+/).filter(Boolean);
}

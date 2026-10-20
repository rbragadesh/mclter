// Read-aloud with the iPad's built-in voices (Web Speech API). Works offline.
let enabled = true;
let voice = null;

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

function chooseVoice() {
  const s = synth();
  if (!s) return;
  const voices = s.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  const prefer = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Rishi', 'Google US English'];
  voice = prefer.map((n) => voices.find((v) => v.name.startsWith(n))).find(Boolean) || voices.find((v) => v.localService) || voices[0] || null;
}

export function initSpeech(on) {
  enabled = on;
  const s = synth();
  if (!s) return;
  chooseVoice();
  s.addEventListener?.('voiceschanged', chooseVoice);
}

export const setSpeech = (on) => {
  enabled = on;
  if (!on) synth()?.cancel();
};

export const speechAvailable = () => Boolean(synth());

/** Speak text, replacing whatever was being said. */
export function say(text, { force = false, rate = 0.92 } = {}) {
  const s = synth();
  if (!s || (!enabled && !force) || !text) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(clean(text));
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else u.lang = 'en-US';
  u.rate = rate;
  u.pitch = 1.05;
  s.speak(u);
}

export const stopSpeech = () => synth()?.cancel();

/** Strip emoji and turn maths symbols into words. */
export function clean(text) {
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\d)\/(\d+)/g, '$1 over $2')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

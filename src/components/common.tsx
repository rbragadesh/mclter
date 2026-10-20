import { useEffect, useState, type ReactNode } from 'react';
import { romanOf, splitLetters, spokenName } from '../data/alphabet';
import { sfx, speak } from '../lib/audio';
import { PRAISE_TA, PROMPTS, type PromptKey } from '../lib/prompts';
import { useSettings } from '../lib/storage';

export function SpeakButton({ text, lang = 'ta', label, big }: { text: string; lang?: 'ta' | 'en'; label?: string; big?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      className={'speak-btn' + (big ? ' big' : '') + (on ? ' on' : '')}
      onClick={async () => {
        setOn(true);
        await speak(text, lang);
        setOn(false);
      }}
      aria-label={label ?? 'Listen'}
    >
      🔊{label ? <span>{label}</span> : null}
    </button>
  );
}

/** Instruction line: shown, and spoken once in English when the activity starts. */
export function Instruction({ k, children, silent }: { k: PromptKey; children?: ReactNode; silent?: boolean }) {
  const settings = useSettings();
  useEffect(() => {
    if (settings.englishPrompts && !silent) void speak(PROMPTS[k], 'en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  return (
    <p className="instruction">
      {PROMPTS[k]} {children}
    </p>
  );
}

export function Roman({ text }: { text: string }) {
  const s = useSettings();
  if (!s.showRoman) return null;
  return <span className="roman">{splitLetters(text).map(romanOf).join('')}</span>;
}

export function English({ text }: { text: string }) {
  const s = useSettings();
  if (!s.showEnglish) return null;
  return <span className="english">{text}</span>;
}

/** Tiles to choose from; calls onRight when the right one is tapped. */
export function Choices({
  options,
  right,
  render,
  onRight,
  onWrong,
  speakOption,
}: {
  options: string[];
  right: string;
  render?: (o: string) => ReactNode;
  onRight: (firstTry: boolean) => void;
  onWrong?: (o: string) => void;
  speakOption?: boolean;
}) {
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setWrong([]);
    setDone(false);
  }, [right, options.join('|')]);
  return (
    <div className="choices">
      {options.map((o) => (
        <button
          key={o}
          className={'choice' + (wrong.includes(o) ? ' wrong' : '') + (done && o === right ? ' right' : '')}
          disabled={done || wrong.includes(o)}
          onClick={() => {
            if (o === right) {
              setDone(true);
              sfx.good();
              void praise();
              setTimeout(() => onRight(wrong.length === 0), 900);
            } else {
              sfx.bad();
              setWrong((w) => [...w, o]);
              onWrong?.(o);
              if (speakOption) void speak(spokenName(o));
            }
          }}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  );
}

export async function praise() {
  await speak(PRAISE_TA[Math.floor(Math.random() * PRAISE_TA.length)]);
}

export function NextButton({ onClick, label = 'Next' }: { onClick: () => void; label?: string }) {
  return (
    <button className="btn next" onClick={onClick}>
      {label} ➜
    </button>
  );
}

export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${n} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

/** A word whose letters can be tapped to hear them. */
export function TappableWord({ word, big }: { word: string; big?: boolean }) {
  const letters = splitLetters(word);
  return (
    <span className={'tap-word' + (big ? ' big' : '')}>
      {letters.map((l, i) => (
        <button key={i} className="tap-letter" onClick={() => void speak(spokenName(l))}>
          {l}
        </button>
      ))}
    </span>
  );
}

/** Delay before an activity's own Tamil audio, so the spoken English instruction is heard first. */
export function useIntroDelay(): number {
  return useSettings().englishPrompts ? 1700 : 300;
}

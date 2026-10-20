import { useEffect, useMemo, useRef, useState } from 'react';
import { splitLetters, spokenName } from '../data/alphabet';
import { seeded, shuffle } from '../data/curriculum';
import { wordByTamil } from '../data/words';
import { WritingPad } from '../components/WritingPad';
import { Choices, English, Instruction, NextButton, Roman, SpeakButton, TappableWord, praise, useIntroDelay } from '../components/common';
import { sfx, speak } from '../lib/audio';
import { recordLetter, recordWord } from '../lib/storage';
import type { WriteMode } from '../lib/strokeMatch';

type Done = (score: number) => void;

const emojiOf = (w: string) => wordByTamil(w)?.emoji ?? '📝';
const meaningOf = (w: string) => wordByTamil(w)?.en ?? '';

export function ReadWord({ word, onDone }: { word: string; onDone: Done }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(false), [word]);
  return (
    <div className="act read-word">
      <Instruction k="readWord" />
      <div className="word-card">
        <span className="word-emoji">{emojiOf(word)}</span>
        <TappableWord word={word} big />
        <Roman text={word} />
      </div>
      <div className="row">
        <button
          className="btn ghost"
          onClick={() => {
            setRevealed(true);
            void speak(word);
          }}
        >
          🔊 Hear the word
        </button>
        {revealed && <English text={meaningOf(word)} />}
      </div>
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            recordWord(word, true);
            onDone(revealed ? 0.7 : 1);
          }}
        >
          ✅ I read it!
        </button>
      </div>
    </div>
  );
}

export function ListenWord({ target, options, onDone }: { target: string; options: string[]; onDone: Done }) {
  const delay = useIntroDelay();
  useEffect(() => {
    const t = setTimeout(() => void speak(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return (
    <div className="act pick">
      <Instruction k="listenWord" />
      <SpeakButton text={target} big label="Listen again" />
      <Choices
        options={options}
        right={target}
        onRight={(first) => {
          recordWord(target, first);
          onDone(first ? 1 : 0.5);
        }}
        render={(o) => <span className="choice-word">{o}</span>}
      />
    </div>
  );
}

/** Tap letter tiles into the slots in the right order. */
export function BuildWord({ word, extra, onDone }: { word: string; extra: string[]; onDone: Done }) {
  const letters = useMemo(() => splitLetters(word), [word]);
  const tiles = useMemo(() => shuffle([...letters, ...extra].map((l, i) => ({ l, id: i })), seeded(word)), [word, extra]);
  const [placed, setPlaced] = useState<{ l: string; id: number }[]>([]);
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  useEffect(() => {
    setPlaced([]);
    setWrong(0);
  }, [word]);
  const delay = useIntroDelay();
  useEffect(() => {
    const t = setTimeout(() => void speak(word), delay);
    return () => clearTimeout(t);
  }, [word, delay]);
  const done = placed.length === letters.length;
  return (
    <div className="act build">
      <Instruction k="buildWord" />
      <div className="picture">
        <span className="picture-emoji">{emojiOf(word)}</span>
        <SpeakButton text={word} big />
      </div>
      <div className="slots">
        {letters.map((_, i) => (
          <span key={i} className={'slot' + (placed[i] ? ' filled' : '') + (i === placed.length ? ' next' : '')}>
            {placed[i]?.l ?? ''}
          </span>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((t) => {
          const used = placed.some((p) => p.id === t.id);
          return (
            <button
              key={t.id}
              className={'tile' + (shake === t.id ? ' shake' : '')}
              disabled={used || done}
              onClick={() => {
                void speak(spokenName(t.l));
                if (t.l === letters[placed.length]) {
                  sfx.tap();
                  const next = [...placed, t];
                  setPlaced(next);
                  if (next.length === letters.length) {
                    sfx.good();
                    recordWord(word, wrong === 0);
                    setTimeout(() => void praise(), 500);
                    setTimeout(() => onDone(wrong === 0 ? 1 : wrong < 3 ? 0.6 : 0.3), 1700);
                  }
                } else {
                  sfx.bad();
                  setWrong((w) => w + 1);
                  setShake(t.id);
                  setTimeout(() => setShake(null), 500);
                }
              }}
            >
              {t.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MissingLetter({ word, index, options, onDone }: { word: string; index: number; options: string[]; onDone: Done }) {
  const letters = splitLetters(word);
  const [solved, setSolved] = useState(false);
  useEffect(() => setSolved(false), [word]);
  return (
    <div className="act missing">
      <Instruction k="missing" />
      <div className="picture">
        <span className="picture-emoji">{emojiOf(word)}</span>
        <SpeakButton text={word} big />
      </div>
      <div className="slots">
        {letters.map((l, i) => (
          <span key={i} className={'slot filled' + (i === index ? (solved ? ' solved' : ' blank') : '')}>
            {i === index && !solved ? '?' : l}
          </span>
        ))}
      </div>
      <Choices
        options={options}
        right={letters[index]}
        speakOption
        onRight={(first) => {
          setSolved(true);
          onDone(first ? 1 : 0.5);
        }}
      />
    </div>
  );
}

/** Write a word or sentence letter by letter, each letter checked stroke by stroke. */
export function WriteLetters({
  text,
  mode,
  onDone,
  dictation,
}: {
  text: string;
  mode: WriteMode;
  onDone: Done;
  dictation?: boolean;
}) {
  const words = text.replace(/[.!?,]/g, '').split(/\s+/).filter(Boolean);
  const cells = words.flatMap((w, wi) => splitLetters(w).map((l, li) => ({ l, wi, last: li === splitLetters(w).length - 1 })));
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const sent = useRef(false);
  const finish = (sc: number[]) => {
    if (sent.current) return;
    sent.current = true;
    onDone(sc.reduce((a, b) => a + b, 0) / Math.max(1, sc.length));
  };
  useEffect(() => {
    setI(0);
    setScores([]);
    sent.current = false;
  }, [text]);
  const delay = useIntroDelay();
  useEffect(() => {
    if (dictation) {
      const t = setTimeout(() => void speak(text), delay);
      return () => clearTimeout(t);
    }
  }, [text, dictation, delay]);
  const done = i >= cells.length;
  useEffect(() => {
    if (done && cells.length) {
      sfx.win();
      void speak(text);
      const t = setTimeout(() => finish(scores), 2600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  return (
    <div className="act write-word">
      <Instruction k={dictation ? 'dictation' : words.length > 1 ? 'writeSentence' : 'writeWord'} />
      <div className="row">
        {(!dictation || done) && <span className="word-emoji small">{words.length === 1 ? emojiOf(words[0]) : ''}</span>}
        {(!dictation || done) && <span className="target-text">{text}</span>}
        <SpeakButton text={text} big={dictation} label={dictation ? 'Listen' : undefined} />
      </div>
      <div className="cells">
        {cells.map((c, k) => (
          <span key={k} className={'cell' + (k < i ? ' done' : k === i ? ' current' : '') + (c.last ? ' word-end' : '')}>
            {k < i || (!dictation && mode !== 'memory') ? c.l : dictation ? '·' : c.l}
          </span>
        ))}
      </div>
      {!done && (
        <div className="cell-pad">
          <WritingPad
            key={i + text}
            letter={cells[i].l}
            mode={dictation ? 'memory' : mode}
            onDone={(r) => {
              recordLetter(cells[i].l, r.stars, r.mistakes);
              setScores((s) => [...s, r.stars / 3]);
              setI((n) => n + 1);
            }}
          />
        </div>
      )}
      {done && (
        <div className="row">
          <span className="big-done">🎉</span>
          <NextButton onClick={() => finish(scores)} />
        </div>
      )}
    </div>
  );
}

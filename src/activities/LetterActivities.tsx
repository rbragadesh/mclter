import { useEffect, useMemo, useState } from 'react';
import { romanOf, spokenName } from '../data/alphabet';
import { letterInfo } from '../data/letterInfo';
import { wordByTamil } from '../data/words';
import { WritingPad, type WriteResult } from '../components/WritingPad';
import { StrokeAnimation } from '../components/StrokeAnimation';
import { Choices, English, Instruction, NextButton, Roman, SpeakButton, TappableWord, useIntroDelay } from '../components/common';
import { speak, speakSequence } from '../lib/audio';
import { shapeFor, warmupName } from '../lib/shapes';
import { recordLetter } from '../lib/storage';
import type { WriteMode } from '../lib/strokeMatch';

type Done = (score: number) => void;

export function MeetLetter({ letter, onDone }: { letter: string; onDone: Done }) {
  const info = letterInfo(letter);
  useEffect(() => {
    const seq: { text: string; pause?: number }[] = [{ text: spokenName(letter), pause: 400 }];
    if (info.parts && info.parts[1] !== 'அ') seq.unshift({ text: spokenName(info.parts[0]), pause: 250 }, { text: info.parts[1], pause: 250 });
    if (info.example) seq.push({ text: info.example.word });
    void speakSequence(seq);
  }, [letter]);
  return (
    <div className="act meet">
      <Instruction k="meet" silent />
      <div className="meet-row">
        <button className="big-letter" onClick={() => void speak(spokenName(letter))} aria-label={`Hear ${letter}`}>
          {letter}
        </button>
        <div className="meet-side">
          <div className="meet-roman">
            <Roman text={letter} />
          </div>
          {info.parts && info.kind === 'uyirmei' && (
            <div className="equation small">
              <span>{info.parts[0]}</span>+<span>{info.parts[1]}</span>=<span className="eq-result">{letter}</span>
            </div>
          )}
          {info.note && <div className="meet-note">{info.note}</div>}
          <SpeakButton text={spokenName(letter)} big label="Listen" />
        </div>
      </div>
      {info.example && (
        <div className="example">
          <span className="example-emoji">{info.example.emoji}</span>
          <TappableWord word={info.example.word} big />
          <SpeakButton text={info.example.word} />
          <English text={info.example.meaning} />
        </div>
      )}
      <NextButton onClick={() => onDone(1)} />
    </div>
  );
}

export function WatchLetter({ letter, onDone }: { letter: string; onDone: Done }) {
  const shape = useMemo(() => shapeFor(letter)!, [letter]);
  const [replay, setReplay] = useState(0);
  const [ended, setEnded] = useState(false);
  const delay = useIntroDelay();
  useEffect(() => {
    const t = setTimeout(() => void speak(spokenName(letter)), delay);
    return () => clearTimeout(t);
  }, [letter, delay]);
  return (
    <div className="act watch">
      <Instruction k="watch" />
      <div className="watch-box">
        <StrokeAnimation shape={shape} replay={replay} onEnd={() => setEnded(true)} />
      </div>
      <p className="hint-text">
        {shape.strokes.length === 1 ? 'One stroke — try not to lift your finger.' : `${shape.strokes.length} strokes. Follow the numbers.`}
      </p>
      <div className="row">
        <button className="btn ghost" onClick={() => setReplay((r) => r + 1)}>
          ↺ Watch again
        </button>
        {ended && <NextButton onClick={() => onDone(1)} />}
      </div>
    </div>
  );
}

export function WriteLetter({ letter, mode, onDone, warmup }: { letter: string; mode: WriteMode; onDone: Done; warmup?: boolean }) {
  const name = warmup ? warmupName(letter) : null;
  const k = warmup ? 'warmup' : mode;
  return (
    <div className="act write">
      <Instruction k={k}>
        {!warmup && <SpeakButton text={spokenName(letter)} />}
      </Instruction>
      {name && (
        <p className="warmup-name">
          {name.name} · <span className="english">{name.nameEn}</span>
        </p>
      )}
      {mode === 'memory' && !warmup && (
        <div className="memory-target">
          Write: <Roman text={letter} /> <SpeakButton text={spokenName(letter)} />
        </div>
      )}
      <WritingPad
        key={letter + mode}
        letter={letter}
        mode={mode}
        onDone={(r: WriteResult) => {
          if (!warmup) recordLetter(letter, r.stars, r.mistakes);
          onDone(r.stars / 3);
        }}
      />
    </div>
  );
}

export function ListenPick({ target, options, onDone }: { target: string; options: string[]; onDone: Done }) {
  const delay = useIntroDelay();
  useEffect(() => {
    const t = setTimeout(() => void speak(spokenName(target)), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return (
    <div className="act pick">
      <Instruction k="listenPick" />
      <SpeakButton text={spokenName(target)} big label="Listen again" />
      <Choices options={options} right={target} onRight={(first) => onDone(first ? 1 : 0.5)} speakOption />
    </div>
  );
}

export function PicturePick({ word, letter, options, onDone }: { word: string; letter: string; options: string[]; onDone: Done }) {
  const info = letterInfo(letter);
  const emoji = wordByTamil(word)?.emoji ?? (info.example?.word === word ? info.example.emoji : '🖼️');
  const delay = useIntroDelay();
  useEffect(() => {
    const t = setTimeout(() => void speak(word), delay);
    return () => clearTimeout(t);
  }, [word, delay]);
  return (
    <div className="act pick">
      <Instruction k="picturePick" />
      <div className="picture">
        <span className="picture-emoji">{emoji}</span>
        <SpeakButton text={word} big />
      </div>
      <Choices options={options} right={letter} onRight={(first) => onDone(first ? 1 : 0.5)} speakOption />
    </div>
  );
}

export function Concept({ base, sign, result, onDone }: { base: string; sign: string; result: string; onDone: Done }) {
  const [step, setStep] = useState(0);
  const delay = useIntroDelay();
  useEffect(() => {
    setStep(0);
    const ts = [
      setTimeout(() => setStep(1), delay + 1300),
      setTimeout(() => setStep(2), delay + 2600),
      setTimeout(
        () =>
          void speakSequence([
            { text: spokenName(base), pause: 500 },
            { text: sign, pause: 500 },
            { text: result },
          ]),
        delay,
      ),
    ];
    return () => ts.forEach(clearTimeout);
  }, [result, delay]);
  return (
    <div className="act concept">
      <Instruction k="concept" />
      <div className="equation">
        <button className="eq-part" onClick={() => void speak(spokenName(base))}>
          {base}
        </button>
        <span className={step >= 1 ? 'eq-op show' : 'eq-op'}>+</span>
        <button className={step >= 1 ? 'eq-part show' : 'eq-part hidden'} onClick={() => void speak(sign)}>
          {sign}
        </button>
        <span className={step >= 2 ? 'eq-op show' : 'eq-op'}>=</span>
        <button className={step >= 2 ? 'eq-part eq-result show' : 'eq-part hidden'} onClick={() => void speak(result)}>
          {result}
        </button>
      </div>
      <p className="hint-text">
        {romanOf(base)} + {romanOf(sign)} = {romanOf(result)}
      </p>
      {step >= 2 && <NextButton onClick={() => onDone(1)} />}
    </div>
  );
}

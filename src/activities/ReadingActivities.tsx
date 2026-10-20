import { useEffect, useMemo, useState } from 'react';
import { seeded, shuffle } from '../data/curriculum';
import { POEMS } from '../data/poems';
import { SENTENCES, sentenceWords } from '../data/sentences';
import { STORIES } from '../data/stories';
import { Choices, English, Instruction, NextButton, SpeakButton, Stars, praise } from '../components/common';
import { hasClip, sfx, speak, speakSequence } from '../lib/audio';

type Done = (score: number) => void;

/** Text whose words can be tapped to hear them. */
export function TapText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <span className={'tap-text ' + (className ?? '')}>
      {parts.map((p, i) => {
        if (/^\s+$/.test(p)) return ' ';
        const bare = p.replace(/["“”!?.,–]/g, '');
        return (
          <button key={i} className="tap-text-word" onClick={() => hasClip(bare) && void speak(bare)} disabled={!bare}>
            {p}
          </button>
        );
      })}
    </span>
  );
}

export function ReadSentence({ sentence, onDone }: { sentence: string; onDone: Done }) {
  const s = SENTENCES.find((x) => x.ta === sentence);
  const [heard, setHeard] = useState(false);
  useEffect(() => setHeard(false), [sentence]);
  return (
    <div className="act read-sentence">
      <Instruction k="readSentence" />
      <div className="sentence-card">
        <span className="picture-emoji">{s?.emoji}</span>
        <TapText text={sentence} className="sentence" />
      </div>
      <div className="row">
        <button
          className="btn ghost"
          onClick={() => {
            setHeard(true);
            void speak(sentence);
          }}
        >
          🔊 Hear it
        </button>
        {heard && s && <English text={s.en} />}
      </div>
      <button className="btn" onClick={() => onDone(heard ? 0.7 : 1)}>
        ✅ I read it!
      </button>
    </div>
  );
}

export function BuildSentence({ sentence, onDone }: { sentence: string; onDone: Done }) {
  const s = SENTENCES.find((x) => x.ta === sentence);
  const words = useMemo(() => sentenceWords(sentence), [sentence]);
  const tiles = useMemo(() => {
    let t = shuffle(words.map((w, id) => ({ w, id })), seeded(sentence));
    if (t.every((x, i) => x.id === i) && t.length > 1) t = [...t.slice(1), t[0]];
    return t;
  }, [sentence, words]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  useEffect(() => {
    setPlaced([]);
    setWrong(0);
  }, [sentence]);
  const done = placed.length === words.length;
  return (
    <div className="act build">
      <Instruction k="buildSentence" />
      <div className="picture">
        <span className="picture-emoji">{s?.emoji}</span>
        <SpeakButton text={sentence} big />
        {s && <English text={s.en} />}
      </div>
      <div className="sentence-slots">
        {words.map((_, i) => (
          <span key={i} className={'wslot' + (placed[i] !== undefined ? ' filled' : '') + (i === placed.length ? ' next' : '')}>
            {placed[i] !== undefined ? words[placed[i]] : ''}
          </span>
        ))}
        <span className="full-stop">.</span>
      </div>
      <div className="tiles">
        {tiles.map((t) => (
          <button
            key={t.id}
            className={'tile word' + (shake === t.id ? ' shake' : '')}
            disabled={placed.includes(t.id) || done}
            onClick={() => {
              void speak(t.w);
              // the same word may occur twice; accept any tile with the right text
              if (t.w === words[placed.length]) {
                sfx.tap();
                const next = [...placed, t.id];
                setPlaced(next);
                if (next.length === words.length) {
                  sfx.good();
                  setTimeout(() => void speak(sentence), 400);
                  setTimeout(() => onDone(wrong === 0 ? 1 : wrong < 3 ? 0.6 : 0.3), 2600);
                }
              } else {
                sfx.bad();
                setWrong((w) => w + 1);
                setShake(t.id);
                setTimeout(() => setShake(null), 500);
              }
            }}
          >
            {t.w}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StoryReader({ id, onDone }: { id: string; onDone: Done }) {
  const story = STORIES.find((s) => s.id === id)!;
  const [page, setPage] = useState(-1); // -1 = cover
  const [q, setQ] = useState(-1); // -1 = not in the quiz yet
  const [right, setRight] = useState(0);
  const questions = useMemo(
    () => story.questions.map((x, i) => ({ ...x, shuffled: shuffle(x.options, seeded(story.id + i)) })),
    [story],
  );
  useEffect(() => {
    if (page === -1) void speak(story.title);
    else if (page < story.pages.length) void speak(story.pages[page].ta);
    else if (story.moral) void speak(story.moral.ta);
  }, [page, story]);
  useEffect(() => {
    if (q >= 0 && q < questions.length) void speak(questions[q].q);
  }, [q, questions]);

  if (q >= 0) {
    if (q >= questions.length) {
      const score = right / questions.length;
      return (
        <div className="act story-end">
          <div className="big-done">🎉</div>
          <p className="instruction">
            You answered {right} of {questions.length} questions on the first try!
          </p>
          <Stars n={score > 0.9 ? 3 : score > 0.5 ? 2 : 1} />
          <NextButton onClick={() => onDone(score)} />
        </div>
      );
    }
    const item = questions[q];
    return (
      <div className="act story-quiz">
        <p className="quiz-count">
          Question {q + 1} / {questions.length}
        </p>
        <div className="question">
          <TapText text={item.q} className="question-text" />
          <SpeakButton text={item.q} />
        </div>
        <English text={item.qEn} />
        <Choices
          options={item.shuffled}
          right={item.options[0]}
          render={(o) => <span className="choice-word">{o}</span>}
          onRight={(first) => {
            if (first) setRight((r) => r + 1);
            setQ(q + 1);
          }}
          onWrong={(o) => void speak(o)}
        />
      </div>
    );
  }

  if (page === -1) {
    return (
      <div className="act story-cover">
        <Instruction k="story" />
        <div className="cover-art">{story.cover}</div>
        <h2 className="story-title">
          <TapText text={story.title} />
        </h2>
        <English text={story.titleEn} />
        <NextButton label="Start" onClick={() => setPage(0)} />
      </div>
    );
  }
  if (page >= story.pages.length) {
    return (
      <div className="act story-page">
        {story.moral && (
          <>
            <p className="moral-label">நீதி · Moral</p>
            <div className="story-text">
              <TapText text={story.moral.ta} />
            </div>
            <English text={story.moral.en} />
          </>
        )}
        <div className="row">
          <button className="btn ghost" onClick={() => setPage(page - 1)}>
            ◀ Back
          </button>
          <NextButton label="Questions" onClick={() => setQ(0)} />
        </div>
      </div>
    );
  }
  const p = story.pages[page];
  return (
    <div className="act story-page">
      <p className="quiz-count">
        {page + 1} / {story.pages.length}
      </p>
      <div className="scene">{p.scene}</div>
      <div className="story-text">
        <TapText text={p.ta} />
      </div>
      <English text={p.en} />
      <div className="row">
        <button className="btn ghost" onClick={() => setPage(page - 1)}>
          ◀
        </button>
        <SpeakButton text={p.ta} big label="Read to me" />
        <NextButton onClick={() => setPage(page + 1)} />
      </div>
    </div>
  );
}

export function PoemReader({ id, onDone }: { id: string; onDone: Done }) {
  const poem = POEMS.find((p) => p.id === id)!;
  const [line, setLine] = useState<number | null>(null);
  const readAll = async () => {
    for (let i = 0; i < poem.lines.length; i++) {
      setLine(i);
      await speak(poem.lines[i].ta.replace(/[–-]/g, ' '));
      await new Promise((r) => setTimeout(r, 350));
    }
    setLine(null);
  };
  useEffect(() => {
    void speakSequence([{ text: poem.title, pause: 400 }]);
  }, [poem]);
  return (
    <div className="act poem">
      <Instruction k="poem" />
      <h2 className="poem-title">
        {poem.cover} {poem.title}
      </h2>
      <p className="poem-author">{poem.author}</p>
      <ol className="poem-lines">
        {poem.lines.map((l, i) => (
          <li key={i} className={line === i ? 'on' : ''}>
            <button className="poem-line" onClick={() => void speak(l.ta.replace(/[–-]/g, ' '))}>
              {l.ta}
            </button>
            <English text={l.en} />
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="btn ghost" onClick={() => void readAll()}>
          🔊 Read it all
        </button>
        <button
          className="btn"
          onClick={() => {
            void praise();
            onDone(1);
          }}
        >
          ✅ I said it!
        </button>
      </div>
    </div>
  );
}

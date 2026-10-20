import { useEffect, useRef, useState } from 'react';
import { CONSONANTS, VOWELS } from '../data/alphabet';
import { STORY_PROMPTS, STORY_WORDS } from '../data/storyWords';
import { CATEGORY_NAMES, WORDS, type WordCategory } from '../data/words';
import { English, NextButton } from '../components/common';
import { speak } from '../lib/audio';
import { update, useProgress } from '../lib/storage';

type Done = (score: number) => void;

/** On-screen Tamil keyboard: tap a consonant, then a vowel sign. */
function TamilKeyboard({ onType }: { onType: (s: string) => void }) {
  const [base, setBase] = useState<string | null>(null);
  return (
    <div className="kbd">
      <div className="kbd-row">
        {VOWELS.map((v) => (
          <button key={v.letter} className="key" onClick={() => onType(v.letter)}>
            {v.letter}
          </button>
        ))}
      </div>
      <div className="kbd-row">
        {CONSONANTS.map((c) => (
          <button key={c.base} className={'key' + (base === c.base ? ' on' : '')} onClick={() => setBase(base === c.base ? null : c.base)}>
            {c.base}
          </button>
        ))}
      </div>
      {base && (
        <div className="kbd-row signs">
          <button className="key" onClick={() => (onType(base + '்'), setBase(null))}>
            {base}்
          </button>
          {VOWELS.map((v) => (
            <button key={v.letter} className="key" onClick={() => (onType(base + v.sign), setBase(null))}>
              {base + v.sign}
            </button>
          ))}
        </div>
      )}
      <div className="kbd-row">
        <button className="key wide" onClick={() => onType(' ')}>
          space
        </button>
        <button className="key wide" onClick={() => onType('⌫')}>
          ⌫
        </button>
      </div>
    </div>
  );
}

export function StoryMaker({ onDone }: { onDone: Done }) {
  const progress = useProgress();
  const [prompt, setPrompt] = useState<number | null>(null);
  const [sentences, setSentences] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [tab, setTab] = useState<string>('Start');
  const [typing, setTyping] = useState(false);

  const add = (w: string) => {
    void speak(w);
    setCurrent((c) => (c ? c + ' ' + w : w));
  };
  const endSentence = () => {
    if (!current.trim()) return;
    setSentences((s) => [...s, current.trim() + '.']);
    setCurrent('');
  };
  const readAll = async () => {
    for (const s of sentences) {
      for (const w of s.replace('.', '').split(' ')) await speak(w);
    }
  };
  const save = () => {
    const all = current.trim() ? [...sentences, current.trim() + '.'] : sentences;
    if (!all.length) return;
    update((p) => {
      p.myStories.unshift({ id: String(Date.now()), created: Date.now(), picture: STORY_PROMPTS[prompt ?? 0].scene, sentences: all });
    });
    onDone(1);
  };

  if (prompt === null) {
    return (
      <div className="act story-maker">
        <p className="instruction">Choose a picture and tell its story in Tamil.</p>
        <div className="prompt-grid">
          {STORY_PROMPTS.map((p, i) => (
            <button key={i} className="prompt-card" onClick={() => setPrompt(i)}>
              <span className="prompt-scene">{p.scene}</span>
              <span>{p.title}</span>
              <English text={p.titleEn} />
            </button>
          ))}
        </div>
        {progress.myStories.length > 0 && (
          <div className="my-stories">
            <h3>My stories</h3>
            {progress.myStories.slice(0, 5).map((s) => (
              <div key={s.id} className="my-story">
                <span className="prompt-scene">{s.picture}</span>
                <p>{s.sentences.join(' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const groups: { name: string; words: string[] }[] = [
    ...STORY_WORDS.map((g) => ({ name: g.group, words: g.words })),
    ...(['animals', 'birds', 'family', 'nature', 'food', 'home'] as WordCategory[]).map((c) => ({
      name: CATEGORY_NAMES[c].emoji,
      words: WORDS.filter((w) => w.cat === c).map((w) => w.ta),
    })),
  ];

  return (
    <div className="act story-maker">
      <div className="maker-head">
        <span className="prompt-scene">{STORY_PROMPTS[prompt].scene}</span>
        <strong>{STORY_PROMPTS[prompt].title}</strong>
      </div>
      <div className="my-story-text" aria-live="polite">
        {sentences.map((s, i) => (
          <span key={i} className="done-sentence">
            {s}{' '}
          </span>
        ))}
        <span className="current-sentence">{current}</span>
        <span className="caret">|</span>
      </div>
      <div className="row">
        <button className="btn small" onClick={endSentence}>
          . End sentence
        </button>
        <button className="btn small ghost" onClick={() => setCurrent((c) => c.split(' ').slice(0, -1).join(' '))}>
          ⌫ Remove word
        </button>
        <button className="btn small ghost" onClick={() => setTyping((t) => !t)}>
          ⌨️ Type a word
        </button>
        <button className="btn small ghost" onClick={() => void readAll()}>
          🔊 Read my story
        </button>
      </div>
      {typing ? (
        <TamilKeyboard
          onType={(s) =>
            setCurrent((c) => {
              if (s === '⌫') return [...c].slice(0, -1).join('');
              return c + s;
            })
          }
        />
      ) : (
        <>
          <div className="word-tabs">
            {groups.map((g) => (
              <button key={g.name} className={'tab' + (tab === g.name ? ' on' : '')} onClick={() => setTab(g.name)}>
                {g.name}
              </button>
            ))}
          </div>
          <div className="word-bank">
            {groups
              .find((g) => g.name === tab)!
              .words.map((w) => (
                <button key={w} className="tile word small" onClick={() => add(w)}>
                  {w}
                </button>
              ))}
          </div>
        </>
      )}
      <NextButton label="Save my story" onClick={save} />
    </div>
  );
}

/** Free writing on ruled pages; saved pages are kept for the parent to look at. */
export function Notebook({ onDone }: { onDone: Done }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ id: number; last: [number, number] } | null>(null);
  const [color, setColor] = useState('#1d3f8f');
  const [erase, setErase] = useState(false);
  const progress = useProgress();

  const ruled = () => {
    const el = canvas.current!;
    const g = el.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#fffdf7';
    g.fillRect(0, 0, el.width, el.height);
    const band = el.height / 4;
    for (let b = 0; b < 4; b++) {
      const top = b * band;
      const ys = [0.12, 0.36, 0.66, 0.92].map((f) => top + f * band);
      ys.forEach((y, i) => {
        g.strokeStyle = i === 2 ? '#e2848a' : '#9db7e0';
        g.lineWidth = i === 2 ? 2 : 1.2;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(el.width, y);
        g.stroke();
      });
    }
  };

  useEffect(() => {
    const el = canvas.current!;
    const r = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.round(r.width * dpr);
    el.height = Math.round(r.height * dpr);
    ruled();
  }, []);

  const pos = (e: React.PointerEvent): [number, number] => {
    const el = canvas.current!;
    const r = el.getBoundingClientRect();
    return [((e.clientX - r.left) * el.width) / r.width, ((e.clientY - r.top) * el.height) / r.height];
  };

  return (
    <div className="act notebook">
      <p className="instruction">Write anything you like — words, your name, a sentence or a little story.</p>
      <div className="row">
        {['#1d3f8f', '#111111', '#c0392b', '#1e8449'].map((c) => (
          <button key={c} className={'swatch' + (color === c && !erase ? ' on' : '')} style={{ background: c }} onClick={() => (setColor(c), setErase(false))} aria-label="pen colour" />
        ))}
        <button className={'btn small ghost' + (erase ? ' on' : '')} onClick={() => setErase((x) => !x)}>
          🧽 Eraser
        </button>
        <button className="btn small ghost" onClick={ruled}>
          🗑️ Clear
        </button>
      </div>
      <canvas
        ref={canvas}
        className="notebook-canvas"
        onPointerDown={(e) => {
          if (drawing.current) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = { id: e.pointerId, last: pos(e) };
        }}
        onPointerMove={(e) => {
          const d = drawing.current;
          if (!d || d.id !== e.pointerId) return;
          const g = canvas.current!.getContext('2d')!;
          const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
          for (const ev of evs.length ? evs : [e.nativeEvent]) {
            const p = pos({ clientX: ev.clientX, clientY: ev.clientY } as React.PointerEvent);
            g.strokeStyle = erase ? '#fffdf7' : color;
            g.lineWidth = (erase ? 26 : 5) * (window.devicePixelRatio || 1);
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(d.last[0], d.last[1]);
            g.lineTo(p[0], p[1]);
            g.stroke();
            d.last = p;
          }
        }}
        onPointerUp={() => (drawing.current = null)}
        onPointerCancel={() => (drawing.current = null)}
      />
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            const img = canvas.current!.toDataURL('image/png');
            update((p) => {
              p.notebook.unshift({ id: String(Date.now()), created: Date.now(), image: img });
              p.notebook = p.notebook.slice(0, 20);
            });
            ruled();
          }}
        >
          💾 Save page
        </button>
        <NextButton label="Done" onClick={() => onDone(1)} />
      </div>
      {progress.notebook.length > 0 && (
        <div className="thumbs">
          {progress.notebook.slice(0, 6).map((p) => (
            <img key={p.id} src={p.image} alt="saved notebook page" />
          ))}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sfx, speak } from '../lib/audio';
import type { Pt } from '../lib/geometry';
import { PROMPTS, type PromptKey } from '../lib/prompts';
import { shapeFor } from '../lib/shapes';
import { useSettings } from '../lib/storage';
import { LetterChecker, type Verdict, type WriteMode } from '../lib/strokeMatch';
import { FRAME_H, NotebookLines, arrowsAlong, frameFor, toPath } from './LetterGuide';
import { StrokeAnimation } from './StrokeAnimation';

export interface WriteResult {
  stars: 1 | 2 | 3;
  mistakes: number;
  confusedWith: string | null;
}

interface Props {
  letter: string;
  mode: WriteMode;
  onDone: (r: WriteResult) => void;
  /** speak instructions and feedback aloud */
  voice?: boolean;
  compact?: boolean;
}

type Msg = { text: string; kind: 'info' | 'good' | 'bad' } | null;

const VERDICT_PROMPT: Partial<Record<Verdict['kind'], PromptKey>> = {
  'wrong-direction': 'wrongDirection',
  'wrong-start': 'wrongStart',
  'wrong-order': 'wrongOrder',
  'wrong-shape': 'wrongShape',
  lifted: 'lifted',
  partial: 'partial',
  'need-dot': 'needDot',
};

let penSeen = false;

export function WritingPad({ letter, mode, onDone, voice = true, compact = false }: Props) {
  const settings = useSettings();
  const shape = useMemo(() => shapeFor(letter)!, [letter]);
  const [fx, fw] = useMemo(() => frameFor(shape), [shape]);
  const [attempt, setAttempt] = useState(0);
  const checker = useMemo(() => new LetterChecker(shape, mode, settings.strictness), [shape, mode, settings.strictness, attempt]);

  const [inks, setInks] = useState<{ pts: Pt[]; partial?: boolean }[]>([]);
  const [badInk, setBadInk] = useState<Pt[] | null>(null);
  const [, force] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const [hint, setHint] = useState<number | null>(null);
  const [finished, setFinished] = useState<WriteResult | null>(null);
  const [showModel, setShowModel] = useState(false);

  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<{ id: number; pts: Pt[] } | null>(null);
  const lastSpoken = useRef(0);

  useEffect(() => {
    setInks([]);
    setBadInk(null);
    setMsg(null);
    setHint(null);
    setFinished(null);
    setShowModel(false);
  }, [checker]);

  const say = useCallback(
    (key: PromptKey, force = false) => {
      const now = Date.now();
      if (!voice || !settings.englishPrompts) return;
      if (!force && now - lastSpoken.current < 2500) return;
      lastSpoken.current = now;
      void speak(PROMPTS[key], 'en');
    },
    [voice, settings.englishPrompts],
  );

  // map between screen pixels and letter units
  const transform = useCallback(() => {
    const el = canvas.current!;
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / fw, r.height / FRAME_H);
    const ox = (r.width - fw * s) / 2;
    const oy = (r.height - FRAME_H * s) / 2;
    return { r, s, ox, oy };
  }, [fw]);

  const toLetter = useCallback(
    (clientX: number, clientY: number): Pt => {
      const { r, s, ox, oy } = transform();
      return [fx + (clientX - r.left - ox) / s, (clientY - r.top - oy) / s];
    },
    [fx, transform],
  );

  // keep the canvas pixel size in sync with its CSS size
  useEffect(() => {
    const el = canvas.current!;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drawLive = () => {
    const el = canvas.current;
    const cur = live.current;
    if (!el || !cur) return;
    const g = el.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const { s, ox, oy } = transform();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, el.width, el.height);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = '#1d3f8f';
    g.lineWidth = Math.max(4, 11 * s);
    g.beginPath();
    cur.pts.forEach(([x, y], i) => {
      const px = ox + (x - fx) * s;
      const py = oy + y * s;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    if (cur.pts.length === 1) g.lineTo(ox + (cur.pts[0][0] - fx) * s + 0.1, oy + cur.pts[0][1] * s);
    g.stroke();
  };

  const clearLive = () => {
    const el = canvas.current;
    if (el) el.getContext('2d')!.clearRect(0, 0, el.width, el.height);
  };

  const accepts = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') penSeen = true;
    if (e.pointerType === 'touch' && (settings.pencilOnly || penSeen)) return false;
    return true;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (finished || live.current || !accepts(e)) return;
    e.preventDefault();
    canvas.current!.setPointerCapture(e.pointerId);
    live.current = { id: e.pointerId, pts: [toLetter(e.clientX, e.clientY)] };
    setBadInk(null);
    drawLive();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cur = live.current;
    if (!cur || cur.id !== e.pointerId) return;
    e.preventDefault();
    const evs = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of evs.length ? evs : [e.nativeEvent]) cur.pts.push(toLetter(ev.clientX, ev.clientY));
    drawLive();
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cur = live.current;
    if (!cur || cur.id !== e.pointerId) return;
    live.current = null;
    clearLive();
    handleStroke(cur.pts);
  };

  const handleStroke = (pts: Pt[]) => {
    const v = checker.check(pts);
    if (v.kind === 'too-small') return;
    if (v.kind === 'ok') {
      sfx.stroke();
      setInks((x) => [...x.filter((i) => !i.partial), { pts }]);
      setHint(null);
      setMsg(null);
      if (v.done) finish();
      else force((n) => n + 1);
      return;
    }
    if (v.kind === 'partial') {
      setInks((x) => [...x, { pts, partial: true }]);
      setMsg({ text: PROMPTS.partial, kind: 'info' });
      say('partial');
      force((n) => n + 1);
      return;
    }
    // a mistake
    sfx.bad();
    setBadInk(pts);
    setTimeout(() => setBadInk(null), 900);
    setInks((x) => x.filter((i) => !i.partial));
    checker.progress = 0;
    const key = VERDICT_PROMPT[v.kind] ?? 'wrongShape';
    setMsg({ text: PROMPTS[key], kind: 'bad' });
    say(key, true);
    if (checker.mistakesOnCurrent >= 2) {
      // show how this stroke goes
      setHint(checker.strictness === 'flexible' ? checker.completed.indexOf(false) : checker.next);
    }
    force((n) => n + 1);
  };

  const finish = () => {
    const confusedWith = mode === 'memory' ? checker.confusedWith() : null;
    const r: WriteResult = { stars: confusedWith ? 1 : checker.stars, mistakes: checker.mistakes + (confusedWith ? 1 : 0), confusedWith };
    setFinished(r);
    if (confusedWith) {
      sfx.bad();
      setShowModel(true);
      setMsg({ text: PROMPTS.looksLike, kind: 'bad' });
      say('looksLike', true);
      return;
    }
    sfx.good();
    setMsg({ text: '★'.repeat(r.stars), kind: 'good' });
    setTimeout(() => onDone(r), 900);
  };

  const showMe = () => {
    // after several tries: draw the stroke for her and move on
    checker.skipCurrent();
    setHint(null);
    setMsg(null);
    if (checker.done) finish();
    else force((n) => n + 1);
  };

  const k = checker.next;
  const current = checker.strictness === 'flexible' ? -1 : k;
  const showGuide = mode === 'trace' || mode === 'guided' || hint !== null || showModel;

  return (
    <div className={'pad' + (compact ? ' pad-compact' : '')} ref={wrap}>
      <div className="pad-surface">
        <svg className="pad-svg" viewBox={`${fx} 0 ${fw} ${FRAME_H}`} preserveAspectRatio="xMidYMid meet">
          <NotebookLines x={fx} w={fw} />
          {showGuide &&
            shape.strokes.map((s, i) => {
              const done = checker.completed[i];
              const cls = mode === 'trace' ? (done ? 'guide-done' : i === current ? 'guide-current' : 'guide') : 'guide-faint';
              return s.dot ? (
                <circle key={'g' + i} cx={s.pts[0][0]} cy={s.pts[0][1]} r={13} className={cls} />
              ) : (
                <path key={'g' + i} d={toPath(s.pts)} className={cls} />
              );
            })}
          {mode === 'trace' && current >= 0 && current < shape.strokes.length && !finished && (
            <g className="direction">
              {!shape.strokes[current].dot &&
                arrowsAlong(checker.progress > 0 ? shape.strokes[current].pts.slice(Math.floor(checker.progress * shape.strokes[current].pts.length)) : shape.strokes[current].pts).map((a, i) => (
                  <path key={i} d="M-6 -6 L2 0 L-6 6" transform={`translate(${a.p[0]} ${a.p[1]}) rotate(${a.angle})`} className="arrow" />
                ))}
            </g>
          )}
          {inks.map((ink, i) => (
            <path key={'i' + i} d={toPath(ink.pts)} className={ink.partial ? 'ink ink-partial' : 'ink'} />
          ))}
          {badInk && <path d={toPath(badInk)} className="ink ink-bad" />}
          {(mode === 'trace' || hint !== null) && current >= 0 && current < shape.strokes.length && !finished && (() => {
            const s = shape.strokes[current];
            const p = checker.progress > 0 && !s.dot ? s.pts[Math.min(s.pts.length - 1, Math.floor(checker.progress * s.pts.length))] : s.pts[0];
            return (
              <g className="start-marker">
                <circle cx={p[0]} cy={p[1]} r={11} className="start-dot pulse" />
                <text x={p[0]} y={p[1] + 4.5} className="start-num">
                  {current + 1}
                </text>
              </g>
            );
          })()}
        </svg>
        {hint !== null && !finished && (
          <div className="pad-hint" aria-hidden>
            <StrokeAnimation shape={shape} only={hint} replay={checker.mistakes} />
          </div>
        )}
        <canvas
          ref={canvas}
          className="pad-canvas"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onContextMenu={(e) => e.preventDefault()}
          data-testid="pad-canvas"
        />
      </div>
      {!compact && (
        <div className={'pad-msg ' + (msg?.kind ?? '')} role="status">
          {msg?.text ?? ' '}
        </div>
      )}
      {compact && msg?.kind === 'bad' && <div className="pad-msg-mini bad">{msg.text}</div>}
      <div className="pad-tools">
        {!finished && checker.mistakesOnCurrent >= 3 && (
          <button className="btn small ghost" onClick={showMe}>
            Show me 👀
          </button>
        )}
        {!finished && (
          <button
            className="btn small ghost"
            onClick={() => setAttempt((a) => a + 1)}
            aria-label="Start this letter again"
          >
            ↺ Again
          </button>
        )}
        {finished?.confusedWith && (
          <>
            <button className="btn small" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>
            <button className="btn small ghost" onClick={() => onDone(finished)}>
              Next ➜
            </button>
          </>
        )}
      </div>
    </div>
  );
}

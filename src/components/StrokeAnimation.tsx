import { useEffect, useState } from 'react';
import type { LetterShape } from '../lib/letters';
import { FRAME_H, NotebookLines, frameFor, toPath } from './LetterGuide';

/** Draws the letter stroke by stroke, with numbered start points. */
export function StrokeAnimation({
  shape,
  replay = 0,
  only,
  speed = 1,
  onEnd,
}: {
  shape: LetterShape;
  replay?: number;
  /** animate just this stroke (used as a hint) */
  only?: number;
  speed?: number;
  onEnd?: () => void;
}) {
  const [x, w] = frameFor(shape);
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [replay, only, shape.grapheme]);

  // timing: ~280 letter units per second, with a short pause between strokes
  const times: { delay: number; dur: number }[] = [];
  let t = 0.25;
  shape.strokes.forEach((s, i) => {
    const dur = s.dot ? 0.25 : Math.max(0.45, s.length / 280) / speed;
    if (only === undefined || only === i) {
      times.push({ delay: t, dur });
      t += dur + 0.35 / speed;
    } else times.push({ delay: 0, dur: 0 });
  });

  useEffect(() => {
    if (!onEnd) return;
    const id = setTimeout(onEnd, t * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <svg className="stroke-anim" viewBox={`${x} 0 ${w} ${FRAME_H}`} key={key}>
      <NotebookLines x={x} w={w} />
      {shape.strokes.map((s, i) =>
        s.dot ? (
          <circle key={'g' + i} cx={s.pts[0][0]} cy={s.pts[0][1]} r={12} className="guide-faint" />
        ) : (
          <path key={'g' + i} d={toPath(s.pts)} className="guide-faint" />
        ),
      )}
      {shape.strokes.map((s, i) => {
        if (only !== undefined && only !== i) return null;
        const style = { animationDelay: `${times[i].delay}s`, animationDuration: `${times[i].dur}s` } as React.CSSProperties;
        return (
          <g key={i}>
            {s.dot ? (
              <circle cx={s.pts[0][0]} cy={s.pts[0][1]} r={11} className="anim-dot" style={style} />
            ) : (
              <path d={toPath(s.pts)} pathLength={1} className="anim-stroke" style={style} />
            )}
            <g className="anim-num" style={{ animationDelay: `${times[i].delay}s` }}>
              <circle cx={s.pts[0][0]} cy={s.pts[0][1]} r={9} className="start-dot" />
              <text x={s.pts[0][0]} y={s.pts[0][1] + 4} className="start-num">
                {i + 1}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

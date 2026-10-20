import type { Pt } from '../lib/geometry';
import type { LetterShape } from '../lib/letters';

export const FRAME_H = 250;
export const LINES = { top: 10, mid: 70, base: 166, bottom: 236 };

/** Horizontal frame (letter units) that comfortably fits the letter. */
export function frameFor(shape: LetterShape, minWidth = 190): [number, number] {
  const [x0, , x1] = shape.box;
  const w = Math.max(x1 - x0 + 80, minWidth);
  const cx = (x0 + x1) / 2;
  return [cx - w / 2, w];
}

export const toPath = (pts: Pt[]) =>
  pts.length === 1
    ? `M${pts[0][0]} ${pts[0][1]}h0.01`
    : 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');

/** Points every `step` units along a polyline, with the direction there. */
export function arrowsAlong(pts: Pt[], step = 62, skipStart = 26): { p: Pt; angle: number }[] {
  const out: { p: Pt; angle: number }[] = [];
  let acc = -skipStart;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    let t = 0;
    while (d > 0 && acc + d * (1 - t) >= step) {
      const need = step - acc;
      t += need / d;
      acc = 0;
      out.push({ p: [ax + (bx - ax) * t, ay + (by - ay) * t], angle: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI });
    }
    acc += d * (1 - t);
  }
  return out;
}

export function NotebookLines({ x, w }: { x: number; w: number }) {
  return (
    <g className="nb-lines">
      <line x1={x} x2={x + w} y1={LINES.top} y2={LINES.top} className="nb-outer" />
      <line x1={x} x2={x + w} y1={LINES.mid} y2={LINES.mid} className="nb-mid" />
      <line x1={x} x2={x + w} y1={LINES.base} y2={LINES.base} className="nb-base" />
      <line x1={x} x2={x + w} y1={LINES.bottom} y2={LINES.bottom} className="nb-outer" />
    </g>
  );
}

/** A static picture of a letter drawn from its strokes (the handwriting model). */
export function LetterPicture({ shape, className, width = 26 }: { shape: LetterShape; className?: string; width?: number }) {
  const [x, w] = frameFor(shape, 150);
  return (
    <svg className={className} viewBox={`${x} 0 ${w} ${FRAME_H}`} aria-label={shape.grapheme}>
      {shape.strokes.map((s, i) =>
        s.dot ? (
          <circle key={i} cx={s.pts[0][0]} cy={s.pts[0][1]} r={width * 0.55} className="lp-ink" />
        ) : (
          <path key={i} d={toPath(s.pts)} className="lp-ink" strokeWidth={width} />
        ),
      )}
    </svg>
  );
}

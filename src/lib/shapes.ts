/**
 * Shapes the app can ask the child to write: every Tamil letter (from the
 * stroke data) plus the pre-writing warm-up strokes.
 */
import type { Pt } from './geometry';
import { letterShape, type LetterShape } from './letters';

function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

const deg = Math.PI / 180;

/** Warm-up strokes, in the same coordinate system as letters (x-height ≈ 70..166). */
const WARMUPS: Record<string, { name: string; nameEn: string; strokes: Pt[][] }> = {
  'line-down': { name: 'நிற்கும் கோடு', nameEn: 'Standing line', strokes: [[[60, 60], [60, 170]], [[110, 60], [110, 170]]] },
  'line-across': { name: 'படுக்கும் கோடு', nameEn: 'Sleeping line', strokes: [[[20, 90], [150, 90]], [[20, 150], [150, 150]]] },
  'line-slant': { name: 'சாய்ந்த கோடு', nameEn: 'Slanting lines', strokes: [[[30, 70], [100, 170]], [[160, 70], [90, 170]]] },
  'line-l': { name: 'ட வடிவம்', nameEn: 'Down and across (like ட)', strokes: [[[30, 70], [30, 166], [140, 166]]] },
  'line-u': { name: 'ப வடிவம்', nameEn: 'Down, across, up (like ப)', strokes: [[[30, 70], [30, 166], [130, 166], [130, 70]]] },
  'curve-c': { name: 'வளைவு', nameEn: 'Curve', strokes: [arc(100, 118, 55, 50, -60 * deg, -300 * deg)] },
  'curve-hump': { name: 'மேடு', nameEn: 'Hump (like ஈ’s top)', strokes: [[[30, 166], ...arc(85, 120, 55, 50, 180 * deg, 360 * deg), [140, 166]]] },
  circle: { name: 'வட்டம்', nameEn: 'Circle', strokes: [arc(90, 118, 50, 48, -90 * deg, -450 * deg)] },
  loop: { name: 'சுழி', nameEn: 'Small loop (சுழி) then a line', strokes: [[...arc(60, 140, 26, 26, -90 * deg, 270 * deg, 36), [60, 114], [150, 114]]] },
  spiral: {
    name: 'சுருள்',
    nameEn: 'Loop that opens out (like the start of அ)',
    strokes: [[...arc(70, 110, 22, 22, -60 * deg, 300 * deg, 30), ...arc(90, 120, 55, 52, -80 * deg, 60 * deg, 24)]],
  },
};

export function isWarmup(id: string): boolean {
  return id in WARMUPS;
}

export function warmupName(id: string): { name: string; nameEn: string } {
  return WARMUPS[id];
}

export function shapeFor(id: string): LetterShape | null {
  const w = WARMUPS[id];
  if (w) {
    const strokes = w.strokes.map((pts) => ({ pts, dot: false, length: 0 }));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of strokes) {
      let L = 0;
      for (let i = 1; i < s.pts.length; i++) L += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
      s.length = L;
      for (const [x, y] of s.pts) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    return { grapheme: id, strokes, box: [x0, y0, x1, y1], advance: x1 + 20 };
  }
  return letterShape(id);
}

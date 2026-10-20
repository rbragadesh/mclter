import strokeData from '../data/strokes.json';
import { bbox, pathLength, type Pt } from './geometry';

export interface RefStroke {
  pts: Pt[];
  dot: boolean;
  length: number;
}

export interface LetterShape {
  grapheme: string;
  strokes: RefStroke[];
  /** ink bounding box in letter units (200 per em, y down from ascent) */
  box: [number, number, number, number];
  advance: number;
}

interface RawStroke {
  p: number[][];
  dot?: boolean;
}
interface RawGlyph {
  adv: number;
  strokes: RawStroke[];
}
interface RawData {
  baseline: number;
  descent: number;
  glyphs: Record<string, RawGlyph>;
  graphemes: Record<string, [string, number][]>;
}

const data = strokeData as unknown as RawData;
const cache = new Map<string, LetterShape>();

export const BASELINE = data.baseline;
export const DESCENT = data.descent;

export function hasShape(grapheme: string): boolean {
  return grapheme in data.graphemes;
}

export function allShapeGraphemes(): string[] {
  return Object.keys(data.graphemes);
}

/** Stroke model for one grapheme (letter), composed from its font glyphs. */
export function letterShape(grapheme: string): LetterShape | null {
  const hit = cache.get(grapheme);
  if (hit) return hit;
  const parts = data.graphemes[grapheme];
  if (!parts) return null;
  const strokes: RefStroke[] = [];
  let advance = 0;
  for (const [name, x0] of parts) {
    const g = data.glyphs[name];
    advance = Math.max(advance, x0 + g.adv);
    for (const s of g.strokes) {
      const pts = s.p.map(([x, y]) => [x + x0, y] as Pt);
      strokes.push({ pts, dot: !!s.dot, length: s.dot ? 0 : pathLength(pts) });
    }
  }
  const all = strokes.flatMap((s) => s.pts);
  const shape: LetterShape = { grapheme, strokes, box: bbox(all), advance };
  cache.set(grapheme, shape);
  return shape;
}

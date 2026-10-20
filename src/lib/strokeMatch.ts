/**
 * Stroke-by-stroke handwriting checker.
 *
 * The child's finger/pencil path for one stroke is compared with the expected
 * reference stroke using dynamic time warping (so a loop drawn a little bigger
 * or a line drawn a little slower still matches), plus explicit checks for the
 * start point, direction and stroke order, which are the things a teacher
 * corrects. All coordinates are letter units (200 per em, see letters.ts).
 */
import {
  centroid,
  directedHausdorff,
  dist,
  dtw,
  dtwTail,
  pathLength,
  resample,
  subPath,
  translate,
  type Pt,
} from './geometry';
import { allShapeGraphemes, letterShape, type LetterShape, type RefStroke } from './letters';

/** trace: full letter shown; guided: faint outline; memory: empty box */
export type WriteMode = 'trace' | 'guided' | 'memory';
/** strict: no lifting mid-stroke; normal: forgiving; flexible: any order/direction */
export type Strictness = 'strict' | 'normal' | 'flexible';

export type Verdict =
  | { kind: 'ok'; strokes: number[]; quality: number; done: boolean }
  | { kind: 'partial'; stroke: number; progress: number }
  | { kind: 'too-small' }
  | { kind: 'lifted'; stroke: number }
  | { kind: 'wrong-start'; stroke: number }
  | { kind: 'wrong-direction'; stroke: number }
  | { kind: 'wrong-order'; stroke: number; drew: number }
  | { kind: 'need-dot'; stroke: number }
  | { kind: 'wrong-shape'; stroke: number };

const N = 40;

const TOL: Record<WriteMode, number> = { trace: 20, guided: 25, memory: 31 };

interface Fit {
  mean: number;
  start: number;
  end: number;
  cover: number;
  stray: number;
}

function fit(user: Pt[], ref: Pt[]): Fit {
  const u = resample(user, N);
  const r = resample(ref, N);
  return {
    mean: dtw(u, r).mean,
    start: dist(u[0], r[0]),
    end: dist(u[N - 1], r[N - 1]),
    cover: directedHausdorff(r, u),
    stray: directedHausdorff(u, r),
  };
}

export class LetterChecker {
  readonly shape: LetterShape;
  readonly mode: WriteMode;
  readonly strictness: Strictness;
  readonly tol: number;
  /** index of the next stroke to draw (strict / normal) */
  next = 0;
  /** fraction of stroke `next` already drawn when the child lifted early */
  progress = 0;
  /** strokes completed (flexible mode completes them in any order) */
  readonly completed: boolean[];
  mistakes = 0;
  mistakesOnCurrent = 0;
  qualities: number[] = [];
  /** accepted strokes as drawn (raw coordinates), for the whole-letter check */
  readonly drawn: Pt[][] = [];
  private offsets: Pt[] = [];

  constructor(shape: LetterShape, mode: WriteMode = 'trace', strictness: Strictness = 'normal') {
    this.shape = shape;
    this.mode = mode;
    this.strictness = strictness;
    this.tol = TOL[mode] * (strictness === 'flexible' ? 1.1 : 1);
    this.completed = shape.strokes.map(() => false);
  }

  get done(): boolean {
    return this.completed.every(Boolean);
  }

  /** Stars for the finished letter: 3 = no mistakes and neat, 1 = many mistakes. */
  get stars(): 1 | 2 | 3 {
    const q = this.qualities.length ? this.qualities.reduce((a, b) => a + b, 0) / this.qualities.length : 0;
    if (this.mistakes === 0 && q >= 0.35) return 3;
    if (this.mistakes <= 2) return 2;
    return 1;
  }

  /** Translation applied to the child's strokes (memory mode: wherever she wrote it). */
  get offset(): Pt {
    if (!this.offsets.length) return [0, 0];
    return centroid(this.offsets);
  }

  /** Mark the current stroke as done without the child drawing it (after repeated failures). */
  skipCurrent(): void {
    if (this.strictness === 'flexible') {
      const i = this.completed.indexOf(false);
      if (i >= 0) this.completed[i] = true;
    } else if (this.next < this.shape.strokes.length) {
      this.completed[this.next] = true;
      this.next++;
    }
    this.progress = 0;
    this.mistakesOnCurrent = 0;
  }

  check(raw: Pt[]): Verdict {
    if (this.done) return { kind: 'ok', strokes: [], quality: 1, done: true };
    const user = translate(raw, -this.offset[0], -this.offset[1]);
    const v = this.strictness === 'flexible' ? this.checkFlexible(user, raw) : this.checkOrdered(user, raw);
    if (v.kind === 'ok') {
      this.mistakesOnCurrent = 0;
      this.qualities.push(v.quality);
      if (!this.shape.strokes[v.strokes[0]]?.dot) this.drawn.push(raw);
    } else if (v.kind !== 'too-small' && v.kind !== 'partial') {
      this.mistakes++;
      this.mistakesOnCurrent++;
    }
    return v;
  }

  /**
   * After the letter is finished: if her drawing as a whole looks clearly more
   * like a different letter (e.g. வ instead of ல), return that letter.
   * Used for writing from memory, where there is no guide to keep her on track.
   */
  confusedWith(): string | null {
    if (!this.done || this.drawn.length === 0) return null;
    const mine = normalisedPath(this.drawn);
    const ownPath = letterPath(this.shape.grapheme);
    const own = dtwTail(mine, ownPath);
    let best: { g: string; d: number } | null = null;
    for (const g of allShapeGraphemes()) {
      const lines = letterShape(g)!.strokes.filter((st) => !st.dot).length;
      if (lines === 0 || Math.abs(lines - this.drawn.length) > 1) continue;
      if (sameStrokes(this.shape.grapheme, g)) continue; // differs only by a dot (க / க்)
      const d = dtwTail(mine, letterPath(g));
      if (!best || d < best.d) best = { g, d };
    }
    // Calibrated on synthetic handwriting: correct letters never scored below
    // 1.1, clear confusions (வ written as ல) around 0.7. Err on the side of not
    // telling a child her correct letter is wrong.
    if (!best || best.d >= own * 0.85) return null;
    return best.g.endsWith('\u0BCD') ? best.g.slice(0, -1) : best.g;
  }

  // ------------------------------------------------------------------ helpers

  private isSmall(user: Pt[]): boolean {
    return pathLength(user) < 9;
  }

  private dotHit(user: Pt[], s: RefStroke): boolean {
    return pathLength(user) < 45 && dist(centroid(user), s.pts[0]) < this.tol * 1.6;
  }

  /** Accept if the shape fits within tolerance. In memory mode with no anchor yet, compare shapes only. */
  private accepts(f: Fit): boolean {
    const T = this.tol;
    return f.mean <= T && f.start <= T * 1.9 && f.end <= T * 2.2 && f.cover <= T * 2.1 && f.stray <= T * 2.1;
  }

  private fitFree(user: Pt[], raw: Pt[], ref: Pt[]): { f: Fit; shift: Pt } {
    if (this.mode !== 'memory') return { f: fit(user, ref), shift: [0, 0] };
    // Memory mode: the child writes wherever she likes inside the box. The
    // first accepted stroke anchors the letter (centroid alignment, limited to
    // the writing box); later strokes are compared relative to that anchor.
    const cu = centroid(resample(raw, N));
    const cr = centroid(resample(ref, N));
    const shift: Pt = [cu[0] - cr[0], cu[1] - cr[1]];
    if (this.offsets.length === 0 && Math.hypot(shift[0], shift[1]) < 80) {
      return { f: fit(translate(raw, -shift[0], -shift[1]), ref), shift };
    }
    return { f: fit(user, ref), shift };
  }

  private remember(shift: Pt): void {
    if (this.mode === 'memory') this.offsets.push(shift);
  }

  private quality(f: Fit): number {
    return Math.max(0, Math.min(1, 1 - f.mean / this.tol));
  }

  // ------------------------------------------------------------ ordered modes

  private checkOrdered(user: Pt[], raw: Pt[]): Verdict {
    const strokes = this.shape.strokes;
    const k = this.next;
    const cur = strokes[k];

    if (cur.dot) {
      // consecutive dots (ஃ, ஈ) may be drawn in any order
      const run: number[] = [];
      for (let j = k; j < strokes.length && strokes[j].dot; j++) if (!this.completed[j]) run.push(j);
      const hit = run.find((j) => this.dotHit(user, strokes[j]));
      if (hit !== undefined) {
        this.completed[hit] = true;
        while (this.next < strokes.length && this.completed[this.next]) this.next++;
        return { kind: 'ok', strokes: [hit], quality: 1, done: this.done };
      }
      if (this.isSmall(user)) return { kind: 'need-dot', stroke: k };
      return { kind: 'need-dot', stroke: k };
    }

    if (this.isSmall(user)) {
      // a tap: maybe a dot that comes later
      const laterDot = strokes.findIndex((s, j) => j > k && s.dot && !this.completed[j] && this.dotHit(user, s));
      if (laterDot >= 0) return { kind: 'wrong-order', stroke: k, drew: laterDot };
      return { kind: 'too-small' };
    }

    const refK = this.progress > 0 ? subPath(cur.pts, this.progress, 1) : cur.pts;

    // 1. whole stroke, possibly running on into the following stroke(s)
    let best: { upto: number; f: Fit; shift: Pt } | null = null;
    let joined = refK;
    for (let j = k; j < strokes.length && j <= k + 2; j++) {
      if (j > k) {
        const s = strokes[j];
        if (s.dot || dist(joined[joined.length - 1], s.pts[0]) > this.tol * 2.2) break;
        joined = joined.concat(s.pts);
      }
      const { f, shift } = this.fitFree(user, raw, joined);
      if (this.accepts(f) && (!best || f.mean <= best.f.mean * 1.15)) best = { upto: j, f, shift };
    }
    if (best) {
      const done: number[] = [];
      for (let j = k; j <= best.upto; j++) {
        this.completed[j] = true;
        done.push(j);
      }
      this.next = best.upto + 1;
      this.progress = 0;
      this.remember(best.shift);
      return { kind: 'ok', strokes: done, quality: this.quality(best.f), done: this.done };
    }

    // 2. started right but lifted part-way
    if (this.mode !== 'memory' || this.offsets.length) {
      const u = resample(user, N);
      const r = resample(refK, N);
      const open = dtw(u, r, true);
      if (open.mean <= this.tol && dist(u[0], r[0]) <= this.tol * 1.9 && open.refEnd < 0.92) {
        if (this.strictness === 'strict') return { kind: 'lifted', stroke: k };
        const frac = this.progress + (1 - this.progress) * open.refEnd;
        if (frac > 0.2) {
          this.progress = frac;
          return { kind: 'partial', stroke: k, progress: frac };
        }
      }
    }

    // 3. diagnose the mistake
    const rev = this.fitFree(user, raw, [...refK].reverse());
    if (this.accepts(rev.f)) return { kind: 'wrong-direction', stroke: k };
    for (let j = k + 1; j < strokes.length; j++) {
      const s = strokes[j];
      if (s.dot) continue;
      const fw = this.fitFree(user, raw, s.pts).f;
      const bw = this.fitFree(user, raw, [...s.pts].reverse()).f;
      if (this.accepts(fw) || this.accepts(bw)) return { kind: 'wrong-order', stroke: k, drew: j };
    }
    const f = this.fitFree(user, raw, refK).f;
    if (f.start > this.tol * 1.9 && f.mean <= this.tol * 1.6) return { kind: 'wrong-start', stroke: k };
    return { kind: 'wrong-shape', stroke: k };
  }

  // ------------------------------------------------------------- flexible mode

  private checkFlexible(user: Pt[], raw: Pt[]): Verdict {
    const strokes = this.shape.strokes;
    const open = strokes.map((_, j) => j).filter((j) => !this.completed[j]);
    for (const j of open) {
      if (strokes[j].dot && this.dotHit(user, strokes[j])) {
        this.completed[j] = true;
        return { kind: 'ok', strokes: [j], quality: 1, done: this.done };
      }
    }
    if (this.isSmall(user)) return { kind: 'too-small' };
    let best: { j: number; f: Fit; shift: Pt } | null = null;
    for (const j of open) {
      if (strokes[j].dot) continue;
      for (const pts of [strokes[j].pts, [...strokes[j].pts].reverse()]) {
        const { f, shift } = this.fitFree(user, raw, pts);
        if (this.accepts(f) && (!best || f.mean < best.f.mean)) best = { j, f, shift };
      }
    }
    if (!best) return { kind: 'wrong-shape', stroke: open[0] };
    this.completed[best.j] = true;
    this.remember(best.shift);
    return { kind: 'ok', strokes: [best.j], quality: this.quality(best.f), done: this.done };
  }
}

// Whole-letter paths (strokes joined in writing order, centred) for confusedWith().
const M = 96;
const pathCache = new Map<string, Pt[]>();

function normalisedPath(strokes: Pt[][]): Pt[] {
  const total = strokes.reduce((a, s) => a + Math.max(pathLength(s), 1), 0);
  const pts: Pt[] = [];
  for (const s of strokes) {
    const n = Math.max(2, Math.round((M * Math.max(pathLength(s), 1)) / total));
    pts.push(...resample(s, n));
  }
  const all = resample(pts, M);
  const c = centroid(all);
  return translate(all, -c[0], -c[1]);
}

const sameCache = new Map<string, boolean>();
function sameStrokes(a: string, b: string): boolean {
  const key = a < b ? a + '|' + b : b + '|' + a;
  let v = sameCache.get(key);
  if (v === undefined) {
    v = dtwTail(letterPath(a), letterPath(b)) < 4;
    sameCache.set(key, v);
  }
  return v;
}

function letterPath(g: string): Pt[] {
  let p = pathCache.get(g);
  if (!p) {
    p = normalisedPath(letterShape(g)!.strokes.filter((s) => !s.dot).map((s) => s.pts));
    pathCache.set(g, p);
  }
  return p;
}

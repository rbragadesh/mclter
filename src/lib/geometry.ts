export type Pt = [number, number];

export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(pts: Pt[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}

/** Resample a polyline to n points evenly spaced along its length. */
export function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt);
  const L = pathLength(pts);
  if (L === 0) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt);
  const step = L / (n - 1);
  const out: Pt[] = [[pts[0][0], pts[0][1]]];
  let acc = 0;
  let i = 1;
  let prev: Pt = pts[0];
  while (out.length < n - 1 && i < pts.length) {
    const d = dist(prev, pts[i]);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      const q: Pt = [prev[0] + t * (pts[i][0] - prev[0]), prev[1] + t * (pts[i][1] - prev[1])];
      out.push(q);
      prev = q;
      acc = 0;
    } else {
      acc += d;
      prev = pts[i];
      i++;
    }
  }
  while (out.length < n) out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  return out;
}

/** Sub-path between arc-length fractions t0..t1 (0..1). */
export function subPath(pts: Pt[], t0: number, t1: number): Pt[] {
  const L = pathLength(pts);
  const a = Math.max(0, Math.min(1, t0)) * L;
  const b = Math.max(0, Math.min(1, t1)) * L;
  const out: Pt[] = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const d = dist(p, q);
    const s0 = acc;
    const s1 = acc + d;
    const lerp = (s: number): Pt => {
      const t = d === 0 ? 0 : (s - s0) / d;
      return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
    };
    if (s1 >= a && s0 <= b) {
      if (out.length === 0) out.push(lerp(Math.max(a, s0)));
      out.push(lerp(Math.min(b, s1)));
    }
    acc = s1;
  }
  if (out.length === 0) out.push(pts[pts.length - 1]);
  return out;
}

export interface DtwResult {
  /** mean distance along the optimal alignment */
  mean: number;
  /** for open-end alignment: fraction (0..1) of the reference that was covered */
  refEnd: number;
}

/**
 * Dynamic time warping between two equally-resampled sequences.
 * `openEnd` lets the user sequence end anywhere along the reference (used to
 * detect "you lifted your finger half way").
 */
export function dtw(user: Pt[], ref: Pt[], openEnd = false): DtwResult {
  const n = user.length;
  const m = ref.length;
  const INF = 1e12;
  const D = new Float64Array(n * m).fill(INF);
  const C = new Int32Array(n * m); // path length
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const c = dist(user[i], ref[j]);
      if (i === 0 && j === 0) {
        D[0] = c;
        C[0] = 1;
        continue;
      }
      let best = INF;
      let bl = 0;
      if (i > 0 && D[(i - 1) * m + j] < best) { best = D[(i - 1) * m + j]; bl = C[(i - 1) * m + j]; }
      if (j > 0 && D[i * m + j - 1] < best) { best = D[i * m + j - 1]; bl = C[i * m + j - 1]; }
      if (i > 0 && j > 0 && D[(i - 1) * m + j - 1] <= best) {
        best = D[(i - 1) * m + j - 1];
        bl = C[(i - 1) * m + j - 1];
      }
      D[i * m + j] = best + c;
      C[i * m + j] = bl + 1;
    }
  }
  if (!openEnd) {
    return { mean: D[n * m - 1] / C[n * m - 1], refEnd: 1 };
  }
  let bestJ = m - 1;
  let bestV = INF;
  for (let j = Math.floor(m * 0.15); j < m; j++) {
    const v = D[(n - 1) * m + j] / C[(n - 1) * m + j];
    if (v < bestV - 1e-9) {
      bestV = v;
      bestJ = j;
    }
  }
  return { mean: bestV, refEnd: bestJ / (m - 1) };
}

/** Max over points of `a` of the distance to the polyline `b`. */
export function directedHausdorff(a: Pt[], b: Pt[]): number {
  let worst = 0;
  for (const p of a) {
    let best = Infinity;
    for (let i = 1; i < b.length; i++) best = Math.min(best, distToSegment(p, b[i - 1], b[i]));
    if (b.length === 1) best = dist(p, b[0]);
    worst = Math.max(worst, best);
  }
  return worst;
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy;
  if (L2 === 0) return dist(p, a);
  let t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}

export function centroid(pts: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
}

export function bbox(pts: Pt[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

export const translate = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map(([x, y]) => [x + dx, y + dy]);

/**
 * Mean of the worst `frac` of per-point costs along the optimal DTW alignment.
 * Sensitive to local shape differences (a corner instead of a curve) that the
 * plain mean averages away.
 */
export function dtwTail(user: Pt[], ref: Pt[], frac = 0.25): number {
  const n = user.length;
  const m = ref.length;
  const D = new Float64Array(n * m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const c = dist(user[i], ref[j]);
      if (i === 0 && j === 0) D[0] = c;
      else {
        let best = Infinity;
        if (i > 0) best = Math.min(best, D[(i - 1) * m + j]);
        if (j > 0) best = Math.min(best, D[i * m + j - 1]);
        if (i > 0 && j > 0) best = Math.min(best, D[(i - 1) * m + j - 1]);
        D[i * m + j] = best + c;
      }
    }
  }
  // backtrack
  const costs: number[] = [];
  let i = n - 1;
  let j = m - 1;
  while (true) {
    costs.push(dist(user[i], ref[j]));
    if (i === 0 && j === 0) break;
    const cands: [number, number, number][] = [];
    if (i > 0 && j > 0) cands.push([D[(i - 1) * m + j - 1], i - 1, j - 1]);
    if (i > 0) cands.push([D[(i - 1) * m + j], i - 1, j]);
    if (j > 0) cands.push([D[i * m + j - 1], i, j - 1]);
    cands.sort((a, b) => a[0] - b[0]);
    [, i, j] = cands[0];
  }
  costs.sort((a, b) => b - a);
  const k = Math.max(1, Math.round(costs.length * frac));
  return costs.slice(0, k).reduce((a, b) => a + b, 0) / k;
}

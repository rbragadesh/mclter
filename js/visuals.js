// SVG builders for the classroom manipulatives: ten-frames, base-ten blocks, arrays,
// number lines, fraction shapes, clocks, balances, bar models.
// Every function is pure and returns markup, so it runs in Node tests and in the browser.
// Internal `_name` builders return { b, w, h } parts that compose with hstack/vstack.

const R = (n) => Math.round(n * 10) / 10;

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function svg(w, h, body, { cls = '', label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  // --vw lets CSS cap the drawing near its natural size so small pictures don't balloon
  return `<svg class="viz ${cls}" viewBox="0 0 ${R(w)} ${R(h)}" style="--vw:${R(w)}" ${a11y} xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

const wrap = (p, opts) => svg(p.w, p.h, p.b, opts);

function txt(x, y, s, { cls = 't', size = 20, anchor = 'middle' } = {}) {
  return `<text x="${R(x)}" y="${R(y)}" dy=".35em" font-size="${R(size)}" text-anchor="${anchor}" class="${cls}">${esc(s)}</text>`;
}

const emo = (x, y, e, size) => txt(x, y, e, { cls: 'emo', size });

function cross(cx, cy, r) {
  const d = r * 0.9;
  return `<path d="M${R(cx - d)} ${R(cy - d)}L${R(cx + d)} ${R(cy + d)}M${R(cx + d)} ${R(cy - d)}L${R(cx - d)} ${R(cy + d)}" class="xmark"/>`;
}

function hstack(parts, gap = 16) {
  const h = Math.max(...parts.map((p) => p.h));
  let x = 0;
  let b = '';
  parts.forEach((p, i) => {
    b += `<g transform="translate(${R(x)} ${R((h - p.h) / 2)})">${p.b}</g>`;
    x += p.w + (i < parts.length - 1 ? gap : 0);
  });
  return { b, w: x, h };
}

function vstack(parts, gap = 8) {
  const w = Math.max(...parts.map((p) => p.w));
  let y = 0;
  let b = '';
  parts.forEach((p, i) => {
    b += `<g transform="translate(${R((w - p.w) / 2)} ${R(y)})">${p.b}</g>`;
    y += p.h + (i < parts.length - 1 ? gap : 0);
  });
  return { b, w, h: y };
}

const signPart = (s, size = 44) => ({ b: txt(size / 2, size / 2, s, { size: size * 0.85, cls: 't sign' }), w: size, h: size });
const labelPart = (s, size = 22) => ({ b: txt(Math.max(40, s.length * size * 0.32), size * 0.6, s, { size }), w: Math.max(80, s.length * size * 0.64), h: size * 1.2 });

/** Fraction as stacked HTML (used inside buttons and prompts, not SVG). */
export const fracHTML = (n, d) => `<span class="frac" aria-label="${n} over ${d}"><span>${n}</span><span>${d}</span></span>`;

// ---------------------------------------------------------------- ten-frames

function counter(cx, cy, r, c) {
  const crossed = c.startsWith('x:');
  const col = crossed ? c.slice(2) : c;
  return `<circle cx="${R(cx)}" cy="${R(cy)}" r="${R(r)}" class="f-${col}${crossed ? ' faded' : ''}"/>${crossed ? cross(cx, cy, r) : ''}`;
}

/** counters: array of colour names; prefix 'x:' to cross one out. */
export function tenFrames(counters, { frames = 0, cell = 44 } = {}) {
  const n = Math.max(frames, Math.ceil(counters.length / 10), 1);
  const fw = cell * 5;
  const fh = cell * 2;
  const gap = cell * 0.4;
  const m = 4;
  const perRow = Math.min(n, 2);
  const rows = Math.ceil(n / perRow);
  let b = '';
  for (let f = 0; f < n; f++) {
    const ox = m + (f % perRow) * (fw + gap);
    const oy = m + Math.floor(f / perRow) * (fh + gap);
    for (let i = 0; i < 10; i++) {
      const x = ox + (i % 5) * cell;
      const y = oy + Math.floor(i / 5) * cell;
      b += `<rect x="${R(x)}" y="${R(y)}" width="${cell}" height="${cell}" class="cell"/>`;
      const c = counters[f * 10 + i];
      if (c) b += counter(x + cell / 2, y + cell / 2, cell * 0.36, c);
    }
    b += `<rect x="${R(ox)}" y="${R(oy)}" width="${fw}" height="${fh}" rx="4" class="frame"/>`;
  }
  const W = perRow * fw + (perRow - 1) * gap + 2 * m;
  const H = rows * fh + (rows - 1) * gap + 2 * m;
  return svg(W, H, b, { label: `ten frame with ${counters.filter(Boolean).length} counters` });
}

/** Convenience: a red counters then b blue counters (then c green). */
export const tenFrameSum = (a, b, c = 0) => tenFrames([...Array(a).fill('red'), ...Array(b).fill('blue'), ...Array(c).fill('green')]);

// ---------------------------------------------------------------- objects

function _objects(n, emoji, { perRow = 5, crossed = 0, size = 48 } = {}) {
  const cols = Math.max(1, Math.min(perRow, n));
  const rows = Math.max(1, Math.ceil(n / perRow));
  const m = 4;
  let b = '';
  for (let i = 0; i < n; i++) {
    const cx = m + ((i % perRow) + 0.5) * size;
    const cy = m + (Math.floor(i / perRow) + 0.5) * size;
    const e = Array.isArray(emoji) ? emoji[i] : emoji;
    const isX = i >= n - crossed;
    b += isX ? `<g class="faded">${emo(cx, cy, e, size * 0.74)}</g>${cross(cx, cy, size * 0.36)}` : emo(cx, cy, e, size * 0.74);
  }
  return { b, w: cols * size + 2 * m, h: rows * size + 2 * m };
}

/** n emoji in rows of 5; the last `crossed` are crossed out. emoji may be an array. */
export const objects = (n, emoji, opts) => wrap(_objects(n, emoji, opts), { label: `${n} pictures` });

/** Groups of the same emoji joined by a sign: [3, 4] → 🍎🍎🍎 + 🍎🍎🍎🍎 */
export function objectGroups(counts, emoji, { sign = '+' } = {}) {
  const parts = [];
  counts.forEach((c, i) => {
    if (i) parts.push(signPart(sign));
    parts.push(_objects(c, emoji));
  });
  return wrap(hstack(parts, 6));
}

// ---------------------------------------------------------------- number line

export function numberLine(min, max, { jumps = [], points = [], unknown = null, labelEvery = 0, width = 640 } = {}) {
  const range = Math.max(1, max - min);
  const pad = 26;
  const lift = jumps.length ? 78 : 18;
  const y0 = lift + 16;
  const W = width;
  const H = y0 + 46;
  const x = (v) => pad + ((v - min) / range) * (W - 2 * pad);
  const le = labelEvery || (range <= 20 ? 1 : range <= 50 ? 5 : 10);
  const te = range <= 40 ? 1 : range <= 120 ? 5 : 10;
  let b = `<line x1="${R(x(min) - 12)}" y1="${y0}" x2="${R(x(max) + 12)}" y2="${y0}" class="axis"/>`;
  const firstTick = Math.ceil(min / te) * te;
  for (let v = firstTick; v <= max; v += te) {
    const labelled = v % le === 0 || v === min || v === max;
    b += `<line x1="${R(x(v))}" y1="${y0 - (labelled ? 10 : 6)}" x2="${R(x(v))}" y2="${y0 + (labelled ? 10 : 6)}" class="tick"/>`;
    if (labelled && v !== unknown && (unknown === null || Math.abs(x(v) - x(unknown)) > 22)) {
      b += txt(x(v), y0 + 26, v, { size: range > 50 ? 15 : 18, cls: 't-sm' });
    }
  }
  if (unknown !== null) {
    b += `<circle cx="${R(x(unknown))}" cy="${y0 + 26}" r="14" class="q-bg"/>${txt(x(unknown), y0 + 26, '?', { size: 20, cls: 't q' })}`;
  }
  for (const j of jumps) {
    const x1 = x(j.from);
    const x2 = x(j.to);
    const h = Math.min(lift - 22, 14 + Math.abs(x2 - x1) * 0.35);
    const ya = y0 - 4;
    b += `<path d="M${R(x1)} ${ya}Q${R((x1 + x2) / 2)} ${R(ya - 2 * h)} ${R(x2)} ${ya}" class="jump"/>`;
    const dir = x2 > x1 ? -1 : 1;
    b += `<path d="M${R(x2 + dir * 7)} ${ya - 9}L${R(x2)} ${ya}L${R(x2 + dir * 1)} ${ya - 12}" class="jump"/>`;
    if (j.label) b += txt((x1 + x2) / 2, ya - h - 12, j.label, { size: 16, cls: 't-sm jump-label' });
  }
  for (const p of points) b += `<circle cx="${R(x(p))}" cy="${y0}" r="8" class="f-red"/>`;
  return svg(W, H, b, { label: `number line from ${min} to ${max}` });
}

// ---------------------------------------------------------------- arrays & groups

export function array(rows, cols, { color = 'blue', rowSums = false, size = 40, split = 0 } = {}) {
  const s = size;
  const m = 6;
  const lw = rowSums ? 64 : 0;
  let b = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = split && r >= split ? 'orange' : color;
      b += `<circle cx="${R(m + (c + 0.5) * s)}" cy="${R(m + (r + 0.5) * s)}" r="${R(s * 0.35)}" class="f-${col}"/>`;
    }
    if (rowSums) b += txt(m + cols * s + lw / 2, m + (r + 0.5) * s, (r + 1) * cols, { size: s * 0.5, cls: 't-sm count' });
  }
  return svg(cols * s + 2 * m + lw, rows * s + 2 * m, b, { label: `${rows} rows of ${cols}` });
}

function _groups(g, per, { emoji = '', color = 'red', perRow = 5, highlight = 0, leftover = 0 } = {}) {
  const ic = per <= 4 ? 2 : per <= 9 ? 3 : 4;
  const ir = Math.max(1, Math.ceil(per / ic));
  const is = 28;
  const R0 = Math.max(44, Math.hypot(ic * is, ir * is) / 2 + 8);
  const D = 2 * R0 + 12;
  const cols = Math.max(1, Math.min(g, perRow));
  const rows = Math.max(1, Math.ceil(g / perRow));
  let b = '';
  const item = (x, y) => (emoji ? emo(x, y, emoji, is * 0.85) : `<circle cx="${R(x)}" cy="${R(y)}" r="${R(is * 0.36)}" class="f-${color}"/>`);
  for (let i = 0; i < g; i++) {
    const cx = (i % perRow) * D + D / 2;
    const cy = Math.floor(i / perRow) * D + D / 2;
    b += `<circle cx="${R(cx)}" cy="${R(cy)}" r="${R(R0)}" class="plate${i < highlight ? ' hl' : ''}"/>`;
    const n = per;
    const rowsUsed = Math.ceil(n / ic);
    for (let k = 0; k < n; k++) {
      const inRow = Math.min(ic, n - Math.floor(k / ic) * ic);
      const x = cx + ((k % ic) - (inRow - 1) / 2) * is;
      const y = cy + (Math.floor(k / ic) - (rowsUsed - 1) / 2) * is;
      b += item(x, y);
    }
  }
  let w = cols * D;
  let h = rows * D;
  if (leftover) {
    const lx = w + 16;
    b += `<rect x="${R(lx)}" y="6" width="${R(is * 1.6)}" height="${R(Math.max(D - 12, leftover * is + 16))}" rx="10" class="leftover"/>`;
    for (let k = 0; k < leftover; k++) b += item(lx + is * 0.8, 6 + 8 + (k + 0.5) * is);
    w = lx + is * 1.6 + 4;
    h = Math.max(h, leftover * is + 28);
  }
  return { b, w, h };
}

/** g plates with `per` items each. `highlight` tints the first plates; `leftover` items sit in a side tray. */
export const groups = (g, per, opts) => wrap(_groups(g, per, opts), { label: `${g} groups of ${per}` });

// ---------------------------------------------------------------- base-ten blocks

function _baseTen(n) {
  const hN = Math.floor(n / 100);
  const tN = Math.floor((n % 100) / 10);
  const oN = n % 10;
  const u = 11;
  const m = 4;
  const H = 10 * u + 2 * m;
  let x = m;
  let b = '';
  for (let i = 0; i < hN; i++) {
    let grid = '';
    for (let k = 1; k < 10; k++) grid += `M${R(x + k * u)} ${m}v${10 * u}M${R(x)} ${m + k * u}h${10 * u}`;
    b += `<rect x="${R(x)}" y="${m}" width="${10 * u}" height="${10 * u}" class="f-green blk"/><path d="${grid}" class="blk-line"/>`;
    x += 10 * u + u;
  }
  if (hN && (tN || oN)) x += u;
  for (let i = 0; i < tN; i++) {
    let lines = '';
    for (let k = 1; k < 10; k++) lines += `M${R(x)} ${m + k * u}h${u}`;
    b += `<rect x="${R(x)}" y="${m}" width="${u}" height="${10 * u}" class="f-blue blk"/><path d="${lines}" class="blk-line"/>`;
    x += u * 1.6;
  }
  if (tN && oN) x += u;
  const colsO = Math.ceil(oN / 5);
  for (let i = 0; i < oN; i++) {
    const cx = x + Math.floor(i / 5) * (u * 1.5);
    const cy = m + 10 * u - ((i % 5) + 1) * (u * 1.5) + u * 0.5;
    b += `<rect x="${R(cx)}" y="${R(cy)}" width="${u}" height="${u}" class="f-orange blk"/>`;
  }
  x += colsO * u * 1.5;
  return { b, w: Math.max(x + m, 2 * m + u), h: H };
}

export const baseTen = (n) => wrap(_baseTen(n), { label: `base ten blocks showing ${n}` });

/** Several numbers as blocks with optional signs between: baseTenRow([34, '+', 25]) */
export function baseTenRow(items, { labels = false } = {}) {
  const parts = items.map((it) => {
    if (typeof it === 'string') return signPart(it);
    const p = _baseTen(it);
    return labels ? vstack([p, labelPart(String(it), 24)], 6) : p;
  });
  return wrap(hstack(parts, 18));
}

// ---------------------------------------------------------------- fractions

function wedge(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${R(cx)} ${R(cy)}L${R(x0)} ${R(y0)}A${R(r)} ${R(r)} 0 ${large} 1 ${R(x1)} ${R(y1)}Z`;
}

function _fractionShape({ shape = 'circle', d, shaded = [], weights = null, size = 160, color = 'blue' }) {
  const ws = weights || Array(d).fill(1);
  const total = ws.reduce((a, b) => a + b, 0);
  const on = new Set(shaded);
  const cls = (i) => (on.has(i) ? `shade f-${color}` : 'part');
  let b = '';
  if (shape === 'circle') {
    const c = size / 2;
    const r = c - 4;
    if (d === 1) return { b: `<circle cx="${c}" cy="${c}" r="${r}" class="${cls(0)}"/>`, w: size, h: size };
    let a = -Math.PI / 2;
    ws.forEach((w, i) => {
      const a1 = a + (w / total) * Math.PI * 2;
      b += `<path d="${wedge(c, c, r, a, a1)}" class="${cls(i)}"/>`;
      a = a1;
    });
    return { b, w: size, h: size };
  }
  if (shape === 'grid') {
    const cols = { 4: 2, 6: 3, 8: 4, 9: 3, 10: 5, 12: 4 }[d] || d;
    const rows = d / cols;
    const s = (size * 1.2) / Math.max(cols, rows);
    for (let i = 0; i < d; i++) {
      b += `<rect x="${R(4 + (i % cols) * s)}" y="${R(4 + Math.floor(i / cols) * s)}" width="${R(s)}" height="${R(s)}" class="${cls(i)}"/>`;
    }
    return { b, w: cols * s + 8, h: rows * s + 8 };
  }
  if (shape === 'diag') {
    // square cut along both diagonals: 4 equal triangles
    const s = size - 8;
    const o = 4;
    const c = o + s / 2;
    const pts = [
      [o, o, o + s, o],
      [o + s, o, o + s, o + s],
      [o + s, o + s, o, o + s],
      [o, o + s, o, o],
    ];
    pts.forEach(([x1, y1, x2, y2], i) => {
      b += `<path d="M${c} ${c}L${x1} ${y1}L${x2} ${y2}Z" class="${cls(i)}"/>`;
    });
    return { b, w: size, h: size };
  }
  // rect: vertical strips
  const W = size * 1.5;
  const H = size * 0.75;
  let x = 4;
  ws.forEach((w, i) => {
    const sw = (w / total) * (W - 8);
    b += `<rect x="${R(x)}" y="4" width="${R(sw)}" height="${R(H - 8)}" class="${cls(i)}"/>`;
    x += sw;
  });
  return { b, w: W, h: H };
}

export const fractionShape = (o) => wrap(_fractionShape(o), { label: `shape cut into ${o.d} parts, ${o.shaded?.length || 0} shaded` });

function _fracBar(d, n, { width = 480, height = 52, label = true, color = 'blue', hiFrom = -1 } = {}) {
  const pw = width / d;
  let b = '';
  for (let i = 0; i < d; i++) {
    const shaded = i < n || i === hiFrom;
    b += `<rect x="${R(i * pw + 2)}" y="2" width="${R(pw)}" height="${height}" class="${shaded ? `shade f-${color}` : 'part'}"/>`;
    if (label && pw >= 36) b += txt(i * pw + 2 + pw / 2, 2 + height / 2, d === 1 ? '1' : `1/${d}`, { size: Math.min(18, pw * 0.36), cls: `t-sm${shaded ? ' on-shade' : ''}` });
  }
  return { b, w: width + 4, h: height + 4 };
}

export const fractionBar = (d, n, opts) => wrap(_fracBar(d, n, opts), { label: `bar with ${n} of ${d} parts shaded` });

/** Bars stacked so sizes can be compared: rows = [{d, n, color}] */
export function fractionBars(rows, { width = 480 } = {}) {
  return wrap(vstack(rows.map((r) => _fracBar(r.d, r.n, { width, color: r.color || 'blue', label: true })), 10));
}

/** Fraction wall used in the Learn screen. Pieces carry data-d/data-i for tapping. */
export function fractionWall(dens = [1, 2, 3, 4, 5, 6, 8, 10], { width = 560, selected = null } = {}) {
  const rh = 44;
  let b = '';
  dens.forEach((d, r) => {
    const pw = width / d;
    for (let i = 0; i < d; i++) {
      const on = selected && selected.d === d && i <= selected.i;
      b += `<g data-d="${d}" data-i="${i}" class="tap"><rect x="${R(i * pw + 2)}" y="${R(r * (rh + 6) + 2)}" width="${R(pw)}" height="${rh}" class="${on ? 'shade f-blue' : `wall w${d}`}"/>`;
      b += txt(i * pw + 2 + pw / 2, r * (rh + 6) + 2 + rh / 2, d === 1 ? '1 whole' : `1/${d}`, { size: Math.min(18, pw * 0.34), cls: `t-sm${on ? ' on-shade' : ''}` });
      b += '</g>';
    }
  });
  return svg(width + 4, dens.length * (rh + 6), b, { cls: 'wall-svg' });
}

// ---------------------------------------------------------------- clock

export function clock(h, m, { size = 240 } = {}) {
  const c = size / 2;
  const r = c - 6;
  let b = `<circle cx="${c}" cy="${c}" r="${r}" class="clock-face"/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const r1 = i % 5 ? r - 7 : r - 14;
    b += `<line x1="${R(c + r1 * Math.sin(a))}" y1="${R(c - r1 * Math.cos(a))}" x2="${R(c + (r - 2) * Math.sin(a))}" y2="${R(c - (r - 2) * Math.cos(a))}" class="${i % 5 ? 'tick' : 'tick5'}"/>`;
  }
  const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180;
  const ma = (m * 6 * Math.PI) / 180;
  b += `<line x1="${c}" y1="${c}" x2="${R(c + r * 0.5 * Math.sin(ha))}" y2="${R(c - r * 0.5 * Math.cos(ha))}" class="hand-h"/>`;
  b += `<line x1="${c}" y1="${c}" x2="${R(c + r * 0.8 * Math.sin(ma))}" y2="${R(c - r * 0.8 * Math.cos(ma))}" class="hand-m"/>`;
  // numerals go on top with a halo so a hand passing over them never hides them
  for (let n = 1; n <= 12; n++) {
    const a = (n * 30 * Math.PI) / 180;
    b += txt(c + (r - 32) * Math.sin(a), c - (r - 32) * Math.cos(a), n, { size: size * 0.1, cls: 't clock-num' });
  }
  b += `<circle cx="${c}" cy="${c}" r="7" class="hub"/>`;
  return svg(size, size, b, { label: 'clock' });
}

// ---------------------------------------------------------------- balance scale

function panItems(items, cx, baseY) {
  const s = 36;
  const per = 3;
  let b = '';
  items.forEach((it, i) => {
    const row = Math.floor(i / per);
    const inRow = Math.min(per, items.length - row * per);
    const x = cx + ((i % per) - (inRow - 1) / 2) * s;
    const y = baseY - (row + 0.5) * s;
    if (typeof it === 'number' || /^\d+$/.test(it)) {
      b += `<rect x="${R(x - s * 0.45)}" y="${R(y - s * 0.4)}" width="${R(s * 0.9)}" height="${R(s * 0.8)}" rx="6" class="weight"/>${txt(x, y, it, { size: 18, cls: 't on-weight' })}`;
    } else b += emo(x, y, it, s * 0.85);
  });
  return b;
}

export function balance(left, right, { tilt = 0 } = {}) {
  const W = 460;
  const rows = Math.max(1, Math.ceil(Math.max(left.length, right.length) / 3));
  const top = rows * 36 + 30;
  const cx = W / 2;
  const by = top + 10;
  const dy = tilt * 14;
  const lx = 90;
  const rx = W - 90;
  const ly = by + dy;
  const ry = by - dy;
  // top-pan balance: dishes sit on the beam ends and items stack on the dishes
  let b = `<path d="M${cx - 44} ${by + 80}L${cx + 44} ${by + 80}L${cx} ${by + 6}Z" class="stand"/>`;
  b += `<line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" class="beam"/>`;
  b += `<circle cx="${cx}" cy="${by}" r="7" class="hub"/>`;
  const pan = (x, y) => `<path d="M${x - 70} ${y - 12}h140l-16 10h-108z" class="pan"/>`;
  b += pan(lx, ly) + pan(rx, ry);
  b += panItems(left, lx, ly - 12) + panItems(right, rx, ry - 12);
  return svg(W, by + 86, b, { label: 'balance scale' });
}

// ---------------------------------------------------------------- shapes & patterns

export const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'];
export const COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

function shapeAt(kind, color, cx, cy, s) {
  const c = `class="f-${color} shape"`;
  const pts = (arr) => arr.map(([x, y]) => `${R(x)},${R(y)}`).join(' ');
  switch (kind) {
    case 'circle':
      return `<circle cx="${R(cx)}" cy="${R(cy)}" r="${R(s * 0.42)}" ${c}/>`;
    case 'square':
      return `<rect x="${R(cx - s * 0.38)}" y="${R(cy - s * 0.38)}" width="${R(s * 0.76)}" height="${R(s * 0.76)}" ${c}/>`;
    case 'triangle':
      return `<polygon points="${pts([[cx, cy - s * 0.44], [cx - s * 0.48, cy + s * 0.38], [cx + s * 0.48, cy + s * 0.38]])}" ${c}/>`;
    case 'diamond':
      return `<polygon points="${pts([[cx, cy - s * 0.48], [cx + s * 0.36, cy], [cx, cy + s * 0.48], [cx - s * 0.36, cy]])}" ${c}/>`;
    case 'hexagon': {
      const p = [];
      for (let i = 0; i < 6; i++) p.push([cx + s * 0.45 * Math.cos((Math.PI / 3) * i), cy + s * 0.45 * Math.sin((Math.PI / 3) * i)]);
      return `<polygon points="${pts(p)}" ${c}/>`;
    }
    case 'star': {
      const p = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.2 : s * 0.48;
        const a = -Math.PI / 2 + (Math.PI / 5) * i;
        p.push([cx + r * Math.cos(a), cy + r * Math.sin(a) + s * 0.04]);
      }
      return `<polygon points="${pts(p)}" ${c}/>`;
    }
    default:
      return '';
  }
}

/** items: [{k, c}] — a trailing '?' box is drawn when `ask` is true. */
export function shapePattern(items, { ask = true, size = 64 } = {}) {
  const n = items.length + (ask ? 1 : 0);
  let b = '';
  items.forEach((it, i) => {
    b += shapeAt(it.k, it.c, (i + 0.5) * size, size / 2, size * 0.86);
  });
  if (ask) {
    const x = items.length * size;
    b += `<rect x="${R(x + 6)}" y="6" width="${size - 12}" height="${size - 12}" rx="10" class="q-box"/>${txt(x + size / 2, size / 2, '?', { size: size * 0.5, cls: 't q' })}`;
  }
  return svg(n * size, size, b, { label: 'shape pattern' });
}

export const shapeIcon = (it, size = 72) => svg(size, size, shapeAt(it.k, it.c, size / 2, size / 2, size * 0.9));

// ---------------------------------------------------------------- puzzles

/** rows top→bottom, e.g. [[null], [7, 5], [3, 4, 1]] — null renders as '?'. */
export function pyramid(rows) {
  const bw = 84;
  const bh = 52;
  const n = rows.length;
  let b = '';
  rows.forEach((row, i) => {
    const ox = ((n - row.length) * bw) / 2;
    row.forEach((v, j) => {
      const x = ox + j * bw + 2;
      const y = i * bh + 2;
      b += `<rect x="${R(x)}" y="${y}" width="${bw - 4}" height="${bh - 4}" rx="6" class="brick${v === null ? ' q-box' : ''}"/>`;
      b += txt(x + (bw - 4) / 2, y + (bh - 4) / 2, v === null ? '?' : v, { size: 24, cls: v === null ? 't q' : 't' });
    });
  });
  return svg(n * bw + 4, n * bh + 4, b, { label: 'number pyramid' });
}

export function numberBond(whole, a, b) {
  const node = (x, y, v, big) => {
    const r = big ? 44 : 38;
    return `<circle cx="${x}" cy="${y}" r="${r}" class="bond${v === null ? ' q-box' : ''}"/>${txt(x, y, v === null ? '?' : v, { size: 28, cls: v === null ? 't q' : 't' })}`;
  };
  const s = `<line x1="140" y1="56" x2="66" y2="162" class="bond-line"/><line x1="140" y1="56" x2="214" y2="162" class="bond-line"/>`;
  return svg(280, 214, s + node(140, 52, whole, true) + node(66, 168, a) + node(214, 168, b), { label: 'number bond' });
}

/** Beads joined by arcs; diffs labels the arcs (e.g. '+2'). null shows '?'. */
export function chain(nums, { diffs = null } = {}) {
  const sp = 88;
  const r = 30;
  const top = diffs ? 44 : 6;
  let b = '';
  nums.forEach((v, i) => {
    const cx = i * sp + sp / 2;
    const cy = top + r + 4;
    if (i && diffs) {
      const px = (i - 1) * sp + sp / 2;
      b += `<path d="M${px + 10} ${cy - r}Q${(px + cx) / 2} ${cy - r - 34} ${cx - 10} ${cy - r}" class="jump"/>`;
      b += txt((px + cx) / 2, cy - r - 26, diffs[i - 1] ?? '?', { size: 16, cls: 't-sm jump-label' });
    }
    b += `<circle cx="${cx}" cy="${cy}" r="${r}" class="bead${v === null ? ' q-box' : ''}"/>`;
    b += txt(cx, cy, v === null ? '?' : v, { size: String(v).length > 2 ? 20 : 24, cls: v === null ? 't q' : 't' });
  });
  return svg(nums.length * sp, top + 2 * r + 10, b, { label: 'number pattern' });
}

/** Singapore bar model, part–whole. parts: [{v, label}], total shown above with a bracket. */
export function barPartWhole(parts, totalLabel, { width = 480 } = {}) {
  const sum = parts.reduce((s, p) => s + p.v, 0);
  const h = 54;
  const y = 44;
  let x = 4;
  let b = `<path d="M6 30v-10h${width - 4}v10" class="bracket"/>${txt(width / 2 + 4, 12, totalLabel, { size: 20, cls: totalLabel === '?' ? 't q' : 't' })}`;
  parts.forEach((p, i) => {
    const w = (p.v / sum) * width;
    b += `<rect x="${R(x)}" y="${y}" width="${R(w)}" height="${h}" class="${p.label === '?' ? 'q-box' : `bar b${i % 3}`}"/>`;
    b += txt(x + w / 2, y + h / 2, p.label, { size: 20, cls: p.label === '?' ? 't q' : 't' });
    x += w;
  });
  return svg(width + 8, y + h + 6, b, { label: 'bar model' });
}

/** Bar model, comparison: a longer bar on top, b below with the difference box dashed. */
export function barCompare(a, b, { la = 'A', lb = 'B', diff = '?', width = 420 } = {}) {
  const lw = 90;
  const h = 46;
  const sc = width / Math.max(a, b);
  const bigFirst = a >= b;
  const [top, bot] = bigFirst ? [a, b] : [b, a];
  const [lt, lbb] = bigFirst ? [la, lb] : [lb, la];
  let s = '';
  s += txt(lw - 10, 4 + h / 2, lt, { size: 18, anchor: 'end' });
  s += `<rect x="${lw}" y="4" width="${R(top * sc)}" height="${h}" class="bar b0"/>${txt(lw + (top * sc) / 2, 4 + h / 2, top, { size: 20 })}`;
  const y2 = h + 18;
  s += txt(lw - 10, y2 + h / 2, lbb, { size: 18, anchor: 'end' });
  s += `<rect x="${lw}" y="${y2}" width="${R(bot * sc)}" height="${h}" class="bar b1"/>${txt(lw + (bot * sc) / 2, y2 + h / 2, bot, { size: 20 })}`;
  s += `<rect x="${R(lw + bot * sc)}" y="${y2}" width="${R((top - bot) * sc)}" height="${h}" class="q-box dashed"/>${txt(lw + bot * sc + ((top - bot) * sc) / 2, y2 + h / 2, diff, { size: 20, cls: diff === '?' ? 't q' : 't' })}`;
  return svg(lw + width + 8, y2 + h + 6, s, { label: 'comparison bar model' });
}

/** A line of children, front at the left. marks: indices to ring. numbers: 'front' | 'back' | null */
export function queue(n, marks = [], { numbers = null, emoji = '🧒' } = {}) {
  const s = 52;
  const lw = 70;
  let b = txt(30, s / 2 + 4, 'front', { size: 15, cls: 't-sm' }) + `<path d="M50 ${s / 2 + 4}h14m-6-6l6 6l-6 6" class="ln"/>`;
  for (let i = 0; i < n; i++) {
    const cx = lw + (i + 0.5) * s;
    if (marks.includes(i)) b += `<circle cx="${R(cx)}" cy="${s / 2 + 4}" r="${s * 0.46}" class="ring"/>`;
    b += emo(cx, s / 2 + 4, emoji, s * 0.7);
    if (numbers) b += txt(cx, s + 18, numbers === 'front' ? i + 1 : n - i, { size: 16, cls: 't-sm' });
  }
  return svg(lw + n * s + 8, s + (numbers ? 34 : 10), b, { label: `line of ${n} children` });
}

/** A ribbon cut into equal pieces; scissors mark each cut. */
export function ribbon(pieces, { width = 480 } = {}) {
  const pw = width / pieces;
  let b = `<rect x="4" y="40" width="${width}" height="36" rx="6" class="ribbon"/>`;
  for (let i = 1; i < pieces; i++) {
    const x = 4 + i * pw;
    b += `<line x1="${R(x)}" y1="34" x2="${R(x)}" y2="82" class="cut"/>${emo(x, 18, '✂️', 24)}`;
  }
  return svg(width + 8, 88, b, { label: `ribbon in ${pieces} pieces` });
}

/** 1–100 chart; hi(n) highlights, cells carry data-n for tapping. */
export function hundredChart({ hi = () => false, ring = null, cell = 46 } = {}) {
  let b = '';
  for (let n = 1; n <= 100; n++) {
    const x = ((n - 1) % 10) * cell + 2;
    const y = Math.floor((n - 1) / 10) * cell + 2;
    b += `<g data-n="${n}" class="tap"><rect x="${x}" y="${y}" width="${cell}" height="${cell}" class="hc${hi(n) ? ' hc-hi' : ''}${ring === n ? ' hc-ring' : ''}"/>`;
    b += txt(x + cell / 2, y + cell / 2, n, { size: cell * 0.38, cls: hi(n) ? 't on-shade' : 't-sm' }) + '</g>';
  }
  return svg(10 * cell + 4, 10 * cell + 4, b, { cls: 'hundred', label: 'hundred chart' });
}

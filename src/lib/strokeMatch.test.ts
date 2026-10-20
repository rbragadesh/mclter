import { describe, expect, it } from 'vitest';
import { resample, subPath, type Pt } from './geometry';
import { allShapeGraphemes, letterShape } from './letters';
import { LetterChecker, type Verdict } from './strokeMatch';

// deterministic pseudo-random numbers
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Imitate a child's stroke: smooth wobble, slight scale/shift, uneven sampling. */
function humanize(pts: Pt[], seed: number, wobble = 5, shift: Pt = [0, 0], scale = 1): Pt[] {
  const r = rng(seed);
  const n = Math.max(12, Math.round(pts.length * 3));
  const res = resample(pts, n);
  const ph1 = r() * 6.28, ph2 = r() * 6.28, f1 = 1 + r() * 2, f2 = 1 + r() * 2;
  const cx = res.reduce((a, p) => a + p[0], 0) / n;
  const cy = res.reduce((a, p) => a + p[1], 0) / n;
  return res.map(([x, y], i) => {
    const t = i / n;
    return [
      cx + (x - cx) * scale + shift[0] + wobble * Math.sin(6.28 * f1 * t + ph1) + (r() - 0.5) * 2,
      cy + (y - cy) * scale + shift[1] + wobble * Math.sin(6.28 * f2 * t + ph2) + (r() - 0.5) * 2,
    ] as Pt;
  });
}

function drawAll(g: string, mode: 'trace' | 'guided' | 'memory' = 'trace', shift: Pt = [0, 0]) {
  const shape = letterShape(g)!;
  const c = new LetterChecker(shape, mode);
  const verdicts: Verdict[] = [];
  shape.strokes.forEach((s, i) => {
    const pts = s.dot ? [s.pts[0], [s.pts[0][0] + 2, s.pts[0][1] + 1] as Pt] : humanize(s.pts, i + g.length * 7, 5, shift);
    verdicts.push(c.check(s.dot ? pts.map(([x, y]) => [x + shift[0], y + shift[1]] as Pt) : pts));
  });
  return { c, verdicts };
}

describe('letter shapes', () => {
  it('covers all 247 letters plus grantha', () => {
    const all = allShapeGraphemes();
    expect(all.length).toBeGreaterThanOrEqual(313);
    for (const g of all) {
      const s = letterShape(g)!;
      expect(s.strokes.length, g).toBeGreaterThan(0);
      for (const st of s.strokes) if (!st.dot) expect(st.length, g).toBeGreaterThan(5);
    }
  });
});

describe('LetterChecker accepts a correctly written letter', () => {
  const sample = ['அ', 'ஆ', 'இ', 'ஈ', 'ஐ', 'ஔ', 'ஃ', 'க', 'க்', 'ஞ', 'ண', 'கொ', 'ணை', 'டூ', 'ஷ', 'ஸ்ரீ', 'கௌ', 'மூ'];
  for (const g of sample) {
    it(g, () => {
      const { c, verdicts } = drawAll(g);
      expect(verdicts.map((v) => v.kind)).toEqual(verdicts.map(() => 'ok'));
      expect(c.done).toBe(true);
      expect(c.mistakes).toBe(0);
    });
  }

  it('every letter, traced neatly, is accepted', () => {
    const failed: string[] = [];
    for (const g of allShapeGraphemes()) {
      const { c } = drawAll(g);
      if (!c.done || c.mistakes) failed.push(g);
    }
    expect(failed).toEqual([]);
  });
});

describe('LetterChecker catches mistakes', () => {
  it('wrong direction', () => {
    const shape = letterShape('ட')!;
    const c = new LetterChecker(shape);
    const v = c.check(humanize([...shape.strokes[0].pts].reverse(), 3));
    expect(v.kind).toBe('wrong-direction');
    expect(c.done).toBe(false);
  });

  it('wrong order: drawing the stem of அ first', () => {
    const shape = letterShape('அ')!;
    const c = new LetterChecker(shape);
    const v = c.check(humanize(shape.strokes[1].pts, 4));
    expect(v).toMatchObject({ kind: 'wrong-order', stroke: 0, drew: 1 });
  });

  it('scribble is a wrong shape', () => {
    const shape = letterShape('க')!;
    const c = new LetterChecker(shape);
    const r = rng(9);
    const scribble: Pt[] = Array.from({ length: 30 }, () => [20 + r() * 120, 70 + r() * 100] as Pt);
    expect(c.check(scribble).kind).toBe('wrong-shape');
  });

  it('a line drawn in the wrong place is not accepted', () => {
    const shape = letterShape('ப')!;
    const c = new LetterChecker(shape);
    const v = c.check(humanize(shape.strokes[0].pts, 5, 3, [90, 60]));
    expect(v.kind).not.toBe('ok');
  });

  it('a stray tap is ignored', () => {
    const c = new LetterChecker(letterShape('க')!);
    expect(c.check([[50, 50], [51, 51]]).kind).toBe('too-small');
    expect(c.mistakes).toBe(0);
  });
});

describe('LetterChecker never accepts', () => {
  it('a stroke drawn backwards, for any letter', () => {
    const accepted: string[] = [];
    for (const g of allShapeGraphemes()) {
      const shape = letterShape(g)!;
      shape.strokes.forEach((s, i) => {
        if (s.dot) return;
        const c = new LetterChecker(shape);
        for (let j = 0; j < i; j++) c.skipCurrent();
        const v = c.check(humanize([...s.pts].reverse(), i, 4));
        if (v.kind === 'ok') accepted.push(`${g}#${i + 1}`);
      });
    }
    expect(accepted).toEqual([]);
  });

  it('a different letter in place of the expected one', () => {
    const pairs = [['ப', 'ம'], ['ட', 'ப'], ['க', 'ச'], ['ன', 'ண'], ['ர', 'ரு']];
    for (const [want, drawn] of pairs) {
      const c = new LetterChecker(letterShape(want)!);
      letterShape(drawn)!.strokes.forEach((s, i) => { if (!s.dot) c.check(humanize(s.pts, i, 3)); });
      expect(c.done, `${drawn} accepted as ${want}`).toBe(false);
    }
  });
});

describe('whole-letter check (writing from memory)', () => {
  it('notices a similar-looking letter written instead', () => {
    for (const [want, drawn] of [['வ', 'ல'], ['ட', 'ப'], ['ன', 'ள'], ['ண', 'ன']]) {
      const c = new LetterChecker(letterShape(want)!, 'memory');
      letterShape(drawn)!.strokes.forEach((s, i) => { if (!s.dot) c.check(humanize(s.pts, i, 3, [10, 5])); });
      expect(!c.done || c.confusedWith() === drawn, `${drawn} for ${want}`).toBe(true);
    }
  });

  it('does not complain about a correct letter', () => {
    const wrong: string[] = [];
    for (const g of ['அ', 'க', 'ல', 'வ', 'ள', 'ன', 'ண', 'கொ', 'மீ', 'று', 'ழ', 'ஞ']) {
      const { c } = drawAll(g, 'memory', [12, -8]);
      if (!c.done || c.confusedWith()) wrong.push(`${g}:${c.done}:${c.confusedWith()}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe('LetterChecker leniency', () => {
  it('a wobbly but recognisable trace is accepted (guided mode)', () => {
    const failed: string[] = [];
    for (const g of ['அ', 'இ', 'உ', 'க', 'ங', 'ண', 'ம', 'ழ', 'ள', 'று', 'கை', 'ஜ']) {
      const shape = letterShape(g)!;
      const c = new LetterChecker(shape, 'guided');
      shape.strokes.forEach((s, i) => c.check(s.dot ? [s.pts[0], s.pts[0]] : humanize(s.pts, i + 11, 9, [6, -5], 1.06)));
      if (!c.done) failed.push(g);
    }
    expect(failed).toEqual([]);
  });

  it('lifting half way and continuing completes the stroke (normal mode)', () => {
    const shape = letterShape('ப')!;
    const c = new LetterChecker(shape);
    const pts = shape.strokes[0].pts;
    const v1 = c.check(humanize(subPath(pts, 0, 0.5), 1, 3));
    expect(v1.kind).toBe('partial');
    const v2 = c.check(humanize(subPath(pts, 0.5, 1), 2, 3));
    expect(v2.kind).toBe('ok');
    expect(c.done).toBe(true);
  });

  it('strict mode reports lifting', () => {
    const shape = letterShape('ப')!;
    const c = new LetterChecker(shape, 'trace', 'strict');
    expect(c.check(humanize(subPath(shape.strokes[0].pts, 0, 0.5), 1, 3)).kind).toBe('lifted');
  });

  it('two strokes joined without lifting are accepted together', () => {
    const shape = letterShape('எ')!;
    const c = new LetterChecker(shape);
    const joined = shape.strokes[0].pts.concat(shape.strokes[1].pts);
    const v = c.check(humanize(joined, 2, 3));
    expect(v).toMatchObject({ kind: 'ok', strokes: [0, 1] });
    expect(c.done).toBe(true);
  });

  it('dots of ஃ can be drawn in any order', () => {
    const shape = letterShape('ஃ')!;
    const c = new LetterChecker(shape);
    for (const i of [2, 0, 1]) expect(c.check([shape.strokes[i].pts[0], shape.strokes[i].pts[0]]).kind).toBe('ok');
    expect(c.done).toBe(true);
  });

  it('memory mode accepts a letter written somewhere else in the box', () => {
    const { c } = drawAll('வ', 'memory', [25, -18]);
    expect(c.done).toBe(true);
    const { c: c2 } = drawAll('கொ', 'memory', [-30, 15]);
    expect(c2.done).toBe(true);
  });

  it('flexible mode accepts any order and direction', () => {
    const shape = letterShape('அ')!;
    const c = new LetterChecker(shape, 'trace', 'flexible');
    expect(c.check(humanize([...shape.strokes[1].pts].reverse(), 1, 3)).kind).toBe('ok');
    expect(c.check(humanize(shape.strokes[0].pts, 2, 3)).kind).toBe('ok');
    expect(c.done).toBe(true);
  });
});

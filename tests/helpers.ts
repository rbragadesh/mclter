import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

type Pt = [number, number];
interface Shape {
  strokes: { pts: Pt[]; dot: boolean }[];
}

const data = JSON.parse(readFileSync(new URL('../src/data/strokes.json', import.meta.url), 'utf8'));

/** Same composition as src/lib/letters.ts (kept separate: Playwright cannot import JSON modules). */
export function letterShape(g: string): Shape {
  const strokes: Shape['strokes'] = [];
  for (const [name, x0] of data.graphemes[g]) {
    for (const s of data.glyphs[name].strokes) {
      strokes.push({ pts: s.p.map(([x, y]: Pt) => [x + x0, y] as Pt), dot: !!s.dot });
    }
  }
  return { strokes };
}

/** Screen position of letter coordinates on the writing pad (same maths as WritingPad). */
export async function padMapper(page: Page) {
  const svg = page.locator('.pad-svg').first();
  const vb = (await svg.getAttribute('viewBox'))!.split(' ').map(Number);
  const box = (await page.getByTestId('pad-canvas').first().boundingBox())!;
  const [fx, , fw, fh] = vb;
  const s = Math.min(box.width / fw, box.height / fh);
  const ox = (box.width - fw * s) / 2;
  const oy = (box.height - fh * s) / 2;
  return ([x, y]: Pt): Pt => [box.x + ox + (x - fx) * s, box.y + oy + y * s];
}

export async function drawStroke(page: Page, pts: Pt[]) {
  const map = await padMapper(page);
  const scr = pts.map(map);
  await page.mouse.move(scr[0][0], scr[0][1]);
  await page.mouse.down();
  for (const [x, y] of scr.slice(1)) await page.mouse.move(x, y, { steps: 2 });
  if (scr.length === 1) await page.mouse.move(scr[0][0] + 1, scr[0][1] + 1);
  await page.mouse.up();
}

/** Write a whole letter correctly, stroke by stroke. */
export async function writeLetter(page: Page, g: string) {
  const shape = letterShape(g);
  for (const s of shape.strokes) {
    await drawStroke(page, s.dot ? [s.pts[0], [s.pts[0][0] + 1, s.pts[0][1] + 1]] : s.pts);
    await page.waitForTimeout(120);
  }
}

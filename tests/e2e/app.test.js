// End-to-end: drives the real app in Chromium at iPad sizes. Run with `npm run test:e2e`.
// Screenshots land in test-results/ for a human look.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

const OUT = new URL('../../test-results/', import.meta.url).pathname;
const IPAD_LANDSCAPE = { width: 1180, height: 820 };
const IPAD_PORTRAIT = { width: 820, height: 1180 };
let server;
let browser;
let base;
const errors = [];

before(async () => {
  mkdirSync(OUT, { recursive: true });
  server = await startServer(0);
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});

after(async () => {
  await browser?.close();
  server?.close();
  assert.deepEqual(errors, [], 'no console errors on any page');
});

async function open({ viewport = IPAD_LANDSCAPE, name = 'Anika', colorScheme = 'light', context } = {}) {
  const ctx = context || (await browser.newContext({ viewport, hasTouch: true, colorScheme, deviceScaleFactor: 1 }));
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${m.text()} @ ${page.url()}`));
  page.on('pageerror', (e) => errors.push(`${e} @ ${page.url()}`));
  await page.goto(base);
  if (name) {
    await page.fill('#kid-name', name);
    await page.click('button[type=submit]');
    await page.waitForSelector('.topics');
  }
  return { ctx, page };
}

const go = (page, hash) => page.evaluate((h) => (location.hash = h), `#/${hash}`);
const current = (page) => page.evaluate(() => { const c = window.__mc.current; return c && { kind: c.kind, answer: c.answer, qid: window.__mc.qid, values: c.choices?.map((x) => String(x.value)) }; });

async function answer(page, right = true) {
  const q = await current(page);
  if (q.kind === 'number') {
    const v = String(right ? q.answer : q.answer + 1);
    for (const ch of v) await page.click(`.key[data-k="${ch}"]`);
    await page.click('.key[data-k="go"]');
  } else {
    const i = q.values.findIndex((v) => (v === String(q.answer)) === right);
    await page.click(`.choice[data-i="${i}"]:not(.picked-wrong)`);
  }
  return q;
}

/** Answer every question until the results screen. */
async function finish(page, pattern = () => true) {
  for (let n = 0; n < 40; n++) {
    if (await page.$('.result')) return;
    const q = await current(page);
    if (!q) {
      await page.waitForTimeout(200);
      continue;
    }
    await answer(page, pattern(n));
    await page.waitForFunction((id) => !window.__mc.current || window.__mc.qid !== id || document.querySelector('[data-next]:not([hidden])'), q.qid, { timeout: 8000 });
    const next = await page.$('[data-next]:not([hidden])');
    if (next) await next.click();
  }
  await page.waitForSelector('.result');
}

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('first run asks for a name, then shows ten topics', async () => {
  const { ctx, page } = await open({ name: null });
  await page.screenshot({ path: `${OUT}welcome.png` });
  await page.fill('#kid-name', 'Anika');
  await page.click('[data-g="2"]');
  await page.click('button[type=submit]');
  await page.waitForSelector('.topics');
  assert.equal(await page.textContent('.hello'), 'Hi, Anika!');
  assert.equal((await page.$$('.tile')).length, 10);
  const state = await page.evaluate(() => window.__mc.state);
  assert.equal(state.profile.grade, 2);
  assert.equal(state.skills.count.level, 4, 'grade 2 starts counting at level 4');
  await page.screenshot({ path: `${OUT}home.png`, fullPage: true });
  await ctx.close();
});

test('a perfect practice round earns 10 stars and shows the result', async () => {
  const { ctx, page } = await open();
  await go(page, 'practice/add');
  await page.waitForSelector('.qcard');
  await page.screenshot({ path: `${OUT}practice-number.png` });
  await finish(page);
  const text = await page.textContent('.result');
  assert.match(text, /You got 10 of 10 right first time/);
  assert.match(text, /up to level 2/i);
  assert.equal(await page.evaluate(() => window.__mc.state.stars), 10);
  await page.screenshot({ path: `${OUT}practice-result.png` });
  await ctx.close();
});

test('a wrong answer shows the hint; a second miss shows the answer and Next', async () => {
  const { ctx, page } = await open();
  await go(page, 'practice/mult');
  await page.waitForSelector('.qcard');
  await answer(page, false);
  await page.waitForSelector('[data-hint]:not([hidden])');
  assert.match(await page.textContent('[data-fb]'), /Not quite/);
  await page.screenshot({ path: `${OUT}practice-hint.png` });
  await answer(page, false);
  await page.waitForSelector('[data-next]:not([hidden])');
  assert.match(await page.textContent('[data-fb]'), /The answer is \d+/);
  assert.match(await page.textContent('header .sub'), /Level 1/);
  await page.screenshot({ path: `${OUT}practice-answer.png` });
  await ctx.close();
});

test('multiple-choice questions work (fractions, clock, puzzles)', async () => {
  const { ctx, page } = await open();
  for (const id of ['frac', 'time', 'logic']) {
    await go(page, `practice/${id}`);
    await page.waitForSelector('.choice');
    await page.screenshot({ path: `${OUT}practice-${id}.png` });
    const q = await answer(page, true);
    assert.equal(q.kind, 'choice');
    await page.waitForSelector('.fb.good');
  }
  await ctx.close();
});

test('weekly check-up is scored and shows up for grown-ups', async () => {
  const { ctx, page } = await open();
  await go(page, 'test/weekly');
  await page.click('#start-test');
  await page.waitForSelector('.qcard');
  assert.equal(await page.$('[data-showme]'), null, 'no hints in a test');
  await finish(page, (n) => n % 4 !== 0);
  assert.match(await page.textContent('.result'), /15\s*\/ 20 points/);
  await page.screenshot({ path: `${OUT}test-result.png`, fullPage: true });

  await go(page, 'parent/tests');
  await page.waitForSelector('.gate');
  const gate = await current(page);
  for (const ch of String(gate.answer)) await page.click(`.key[data-k="${ch}"]`);
  await page.click('.key[data-k="go"]');
  await page.waitForSelector('table');
  assert.match(await page.textContent('table'), /Weekly Check-up/);
  await page.click('[data-open="0"]');
  await page.screenshot({ path: `${OUT}parent-tests.png`, fullPage: true });
  await go(page, 'parent/progress');
  await page.waitForSelector('.heat');
  await page.screenshot({ path: `${OUT}parent-progress.png`, fullPage: true });
  await go(page, 'parent/worksheet');
  await page.waitForSelector('.sheet .wq');
  assert.ok((await page.$$('.sheet .wq')).length >= 10);
  await page.screenshot({ path: `${OUT}worksheet.png`, fullPage: true });
  await ctx.close();
});

test('olympiad mock has 15 questions in three sections', async () => {
  const { ctx, page } = await open();
  await go(page, 'test/olympiad');
  await page.click('#start-test');
  await page.waitForSelector('.qcard');
  assert.match(await page.textContent('header .sub'), /Section A · 1 point/);
  await finish(page);
  assert.match(await page.textContent('.result'), /30\s*\/ 30 points/);
  await ctx.close();
});

test('learn screens respond to taps', async () => {
  const { ctx, page } = await open();
  await go(page, 'learn/mult');
  await page.waitForSelector('.stage .say-big');
  assert.equal(await page.textContent('.stage .say-big'), '3 × 4 = 12');
  await page.click('.stepper[data-key="rows"] [data-d="1"]');
  assert.equal(await page.textContent('.stage .say-big'), '4 × 4 = 16');
  await page.click('[data-flip]');
  await page.click('[data-tab="1"]');
  await page.click('.tgrid-c[data-r="7"][data-c="8"]');
  assert.equal(await page.textContent('.stage .say-big'), '7 × 8 = 56');
  await page.screenshot({ path: `${OUT}learn-grid.png` });
  for (const id of ['count', 'place', 'add', 'sub', 'div', 'frac', 'time', 'logic', 'story']) {
    await go(page, `learn/${id}`);
    await page.waitForSelector('.stage > *');
    const tabs = await page.$$('[data-tab]');
    for (let i = 0; i < Math.max(1, tabs.length); i++) {
      if (tabs.length) await page.click(`[data-tab="${i}"]`);
      await page.waitForSelector('.stage > *');
      assert.ok(await noSideScroll(page), `learn/${id} tab ${i} scrolls sideways`);
    }
    await page.screenshot({ path: `${OUT}learn-${id}.png` });
  }
  await go(page, 'learn/frac');
  await page.waitForSelector('.stage .part');
  await page.click('.stage .part >> nth=0');
  assert.match(await page.textContent('.stage .say-small'), /2 of 4/);
  await ctx.close();
});

test('make 10: clearing the board records a best time', async () => {
  const { ctx, page } = await open();
  await go(page, 'play/make10');
  await page.waitForSelector('.card10');
  const { cards, target } = await page.evaluate(() => window.__mc.current);
  assert.equal(cards.length, 12);
  const left = cards.map((v, i) => ({ v, i }));
  while (left.length) {
    const a = left.shift();
    const j = left.findIndex((b) => a.v + b.v === target);
    const b = left.splice(j, 1)[0];
    await page.click(`.card10[data-i="${a.i}"]`);
    await page.click(`.card10[data-i="${b.i}"]`);
  }
  await page.waitForSelector('.big-stars');
  assert.ok(await page.evaluate(() => window.__mc.state.games.make10['10'] > 0));
  await ctx.close();
});

test('speed round runs and saves a score', async () => {
  const { ctx, page } = await open();
  await page.clock.install();
  await go(page, 'play/sprint');
  await page.click('[data-m="mult"]');
  await page.click('[data-t="7"]');
  await page.click('#go');
  for (let i = 0; i < 5; i++) await answer(page, true);
  await page.clock.runFor(61_000);
  await page.waitForSelector('.big-stars');
  assert.equal(await page.textContent('.big-stars'), '5');
  assert.equal(await page.evaluate(() => window.__mc.state.games.sprint['mult:7']), 5);
  await ctx.close();
});

test('works offline once installed', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.topics');
  await go(page, 'practice/frac');
  await page.waitForSelector('.qcard');
  await ctx.close();
});

test('progress survives a reload; backup code restores it', async () => {
  const { ctx, page } = await open();
  await go(page, 'practice/count');
  await page.waitForSelector('.qcard');
  await answer(page, true);
  await page.waitForSelector('.fb.good');
  await go(page, '');
  await page.reload();
  await page.waitForSelector('.topics');
  assert.equal(await page.evaluate(() => window.__mc.state.stars), 1);
  const code = await page.evaluate(async () => (await import('./js/store.js')).exportCode(window.__mc.state));
  await ctx.close();

  const fresh = await open({ name: 'Other' });
  await go(fresh.page, 'parent/settings');
  const gate = await current(fresh.page);
  for (const ch of String(gate.answer)) await fresh.page.click(`.key[data-k="${ch}"]`);
  await fresh.page.click('.key[data-k="go"]');
  await fresh.page.fill('#backup-code', code);
  await fresh.page.click('[data-restore]');
  await fresh.page.click('.modal .btn.primary');
  await fresh.page.waitForSelector('.heat');
  assert.equal(await fresh.page.evaluate(() => window.__mc.state.profile.name), 'Anika');
  await fresh.ctx.close();
});

test('layouts fit iPad portrait, phone width and dark mode', async () => {
  for (const [label, viewport, colorScheme] of [
    ['portrait', IPAD_PORTRAIT, 'light'],
    ['phone', { width: 390, height: 844 }, 'light'],
    ['dark', IPAD_LANDSCAPE, 'dark'],
  ]) {
    const { ctx, page } = await open({ viewport, colorScheme });
    for (const route of ['', 'skill/mult', 'practice/story', 'practice/frac', 'learn/time', 'play', 'test/weekly']) {
      await go(page, route);
      await page.waitForTimeout(250);
      assert.ok(await noSideScroll(page), `${label}: #/${route} scrolls sideways`);
    }
    await go(page, '');
    await page.waitForSelector('.topics');
    await page.screenshot({ path: `${OUT}${label}-home.png`, fullPage: label !== 'phone' });
    await go(page, 'practice/story');
    await page.waitForSelector('.qcard');
    await page.screenshot({ path: `${OUT}${label}-practice.png` });
    await ctx.close();
  }
});

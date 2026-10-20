import { expect, test } from '@playwright/test';
import { findLesson } from '../src/data/curriculum';
import { splitLetters } from '../src/data/alphabet';
import { writeLetter } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('init')) {
      localStorage.clear();
      sessionStorage.setItem('init', '1');
    }
  });
});

test('a whole letter lesson can be completed and is saved', async ({ page }) => {
  await page.goto('/#/lesson/letter-அ');
  const next = page.getByRole('button', { name: /Next/ });

  await next.click(); // meet
  await expect(next).toBeVisible({ timeout: 10_000 }); // watch: Next appears when the animation ends
  await next.click();

  for (let i = 0; i < 2; i++) {
    await expect(page.locator('.pad-svg')).toBeVisible();
    await writeLetter(page, 'அ');
    await page.waitForTimeout(1300);
  }
  await page.locator('.choices').getByRole('button', { name: 'அ', exact: true }).click(); // listen & pick
  await page.waitForTimeout(1200);
  for (let i = 0; i < 2; i++) {
    // light guide, then from memory
    await expect(page.locator('.pad-svg')).toBeVisible();
    await writeLetter(page, 'அ');
    await page.waitForTimeout(1500);
  }
  await page.locator('.choices').getByRole('button', { name: 'அ', exact: true }).click(); // picture & pick
  await expect(page.getByText('Lesson complete')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.lesson-done .star.on')).toHaveCount(3);

  await page.getByRole('button', { name: /Home/ }).click();
  await expect(page.locator('.pill').first()).toContainText('3');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tamil-padi-progress-v1')!));
  expect(saved.lessons['letter-அ'].stars).toBe(3);
  expect(saved.letters['அ'].attempts).toBe(4);
});

test('reading a story and answering its questions', async ({ page }) => {
  await page.goto('/#/lesson/story-hare-tortoise');
  await page.getByRole('button', { name: /Start/ }).click();
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: /Next/ }).click();
  await page.getByRole('button', { name: /Questions/ }).click();
  for (const answer of ['முயல்', 'தூங்கியது', 'ஆமை']) {
    await page.locator('.choices').getByRole('button', { name: answer, exact: true }).click();
    await page.waitForTimeout(1100);
  }
  await expect(page.getByText('3 of 3')).toBeVisible();
});

test('building a word from letter tiles', async ({ page }) => {
  const lesson = findLesson('first-words-1')!.lesson;
  const firstBuild = lesson.activities.findIndex((a) => a.type === 'build-word');
  const act = lesson.activities[firstBuild] as { type: 'build-word'; word: string };
  await page.goto('/#/lesson/first-words-1');
  for (let i = 0; i < firstBuild; i++) await page.getByRole('button', { name: /Skip/ }).click();
  const letters = splitLetters(act.word);
  await expect(page.locator('.slots .slot')).toHaveCount(letters.length);
  // a wrong tile first: it shakes and is not placed
  const wrongTile = page.locator('.tiles .tile').filter({ hasNotText: new RegExp('^(' + letters.join('|') + ')$') }).first();
  if (await wrongTile.count()) {
    await wrongTile.click();
    await expect(page.locator('.slot.filled')).toHaveCount(0);
  }
  for (const l of letters) {
    await page.locator('.tiles .tile:not([disabled])').filter({ hasText: new RegExp('^' + l + '$') }).first().click();
  }
  await expect(page.locator('.slot.filled')).toHaveCount(letters.length);
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForTimeout(800); // first visit only: the page caches its own files
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('வணக்கம்')).toBeVisible();
  await page.goto('/#/practice/க');
  await expect(page.locator('.pad-svg')).toBeVisible();
  await context.setOffline(false);
});

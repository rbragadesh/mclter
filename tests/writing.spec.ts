import { expect, test } from '@playwright/test';
import { drawStroke, letterShape, writeLetter } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('practice: a correctly traced letter is accepted with stars', async ({ page }) => {
  await page.goto('/#/practice/க');
  await expect(page.locator('.pad-svg')).toBeVisible();
  await writeLetter(page, 'க');
  await expect(page.locator('.pad-msg.good')).toContainText('★');
  await page.screenshot({ path: 'test-results/practice-ka-done.png' });
});

test('practice: a stroke drawn backwards is corrected', async ({ page }) => {
  await page.goto('/#/practice/ட');
  const shape = letterShape('ட');
  await drawStroke(page, [...shape.strokes[0].pts].reverse());
  await expect(page.locator('.pad-msg.bad')).toContainText('other way');
  await page.screenshot({ path: 'test-results/practice-ta-wrong.png' });
  // then do it right
  await page.waitForTimeout(400);
  await drawStroke(page, shape.strokes[0].pts);
  await expect(page.locator('.pad-msg.good')).toBeVisible();
});

test('practice: wrong stroke order is caught for அ', async ({ page }) => {
  await page.goto('/#/practice/அ');
  const shape = letterShape('அ');
  await drawStroke(page, shape.strokes[1].pts);
  await expect(page.locator('.pad-msg.bad')).toContainText('green dot first');
});

test('writing from memory shows no guide and accepts the letter', async ({ page }) => {
  await page.goto('/#/practice/ம');
  await page.getByRole('tab', { name: /memory/ }).click();
  await expect(page.locator('.guide, .guide-current')).toHaveCount(0);
  await writeLetter(page, 'ம');
  await expect(page.locator('.pad-msg.good')).toBeVisible();
});

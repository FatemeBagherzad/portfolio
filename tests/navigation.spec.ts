import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

const scrollY = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Math.round(window.scrollY));

test.describe('scroll position on navigation', () => {
  test('a new page starts at the top, not where the last one was', async ({
    page,
  }) => {
    await page.goto('/');
    await settleAnimations(page);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => scrollY(page)).toBeGreaterThan(400);

    await page.getByRole('button', { name: 'Deep Dives', exact: true }).click();
    await expect(page).toHaveURL(/\/deep-dives$/);

    await expect.poll(() => scrollY(page)).toBeLessThan(5);
  });

  test('in-page links reset scroll too, not just the nav', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    await page.evaluate(() => window.scrollTo(0, 900));
    await page.getByRole('link', { name: /read all deep dives/i }).click();

    await expect(page).toHaveURL(/\/deep-dives$/);
    await expect.poll(() => scrollY(page)).toBeLessThan(5);
  });

  test('back returns to where the visitor actually was', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    await page.evaluate(() => window.scrollTo(0, 1000));
    const left = await scrollY(page);
    expect(left).toBeGreaterThan(400);

    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect.poll(() => scrollY(page)).toBeLessThan(5);

    // Back is a POP: the browser restores the old position and the app must
    // not stomp on it by forcing the top.
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => scrollY(page)).toBeGreaterThan(400);
  });

  test('the mobile sheet also lands at the top', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await settleAnimations(page);

    await page.evaluate(() => window.scrollTo(0, 1100));
    await page.getByRole('button', { name: /open main menu/i }).click();
    await page
      .locator('#mobile-menu')
      .getByRole('button', { name: 'Projects', exact: true })
      .click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect.poll(() => scrollY(page)).toBeLessThan(5);
  });
});

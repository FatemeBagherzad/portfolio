import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

test.use({ viewport: { width: 390, height: 844 } });

const openSheet = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await settleAnimations(page);
  await page.getByRole('button', { name: /open main menu/i }).click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  // The sheet slides up over ~280ms. Measuring the handle mid-rise gives a
  // box that has already moved by the time the drag starts, which makes the
  // drag distance wrong and the test flaky under parallel load.
  await settleAnimations(page);
};

/** Drags the sheet handle down by `distance`, in `steps` mouse moves. */
const dragHandle = async (
  page: import('@playwright/test').Page,
  distance: number,
  steps = 10
) => {
  const handle = page.locator('.sheet__grab');
  const box = await handle.boundingBox();
  if (!box) throw new Error('sheet handle has no box');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(startX, startY + (distance * step) / steps);
  }
  await page.mouse.up();
};

test.describe('mobile bottom sheet', () => {
  test('opens as a modal dialog rendered outside the header', async ({
    page,
  }) => {
    await openSheet(page);

    const sheet = page.locator('#mobile-menu');
    await expect(sheet).toHaveAttribute('role', 'dialog');
    await expect(sheet).toHaveAttribute('aria-modal', 'true');

    // The header carries a backdrop-filter, which would make it the
    // containing block for a fixed child and trap the sheet inside the bar.
    const parentTag = await page.evaluate(
      () =>
        document.getElementById('mobile-menu')?.closest('.sheet')
          ?.parentElement?.tagName
    );
    expect(parentTag).toBe('BODY');

    // It should cover the lower part of the viewport, not sit in the header.
    const box = await sheet.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThan(200);
  });

  test('locks the page behind it and lists every route', async ({ page }) => {
    await openSheet(page);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');

    for (const label of ['Home', 'Deep Dives', 'Projects', 'About']) {
      await expect(
        page.locator('#mobile-menu').getByRole('button', { name: label })
      ).toBeVisible();
    }
  });

  test('a long drag down dismisses it', async ({ page }) => {
    await openSheet(page);
    await dragHandle(page, 220);
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('a short drag springs back instead of dismissing', async ({ page }) => {
    await openSheet(page);
    // Below the dismiss distance, and slow enough not to count as a flick.
    await dragHandle(page, 40, 20);
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });

  test('Escape closes it and returns focus to the toggle', async ({ page }) => {
    await openSheet(page);
    await page.keyboard.press('Escape');

    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /open main menu/i })
    ).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe('hidden');
  });

  test('tapping the backdrop closes it', async ({ page }) => {
    await openSheet(page);
    // Well above the sheet, which sits at the bottom of the screen.
    await page.locator('.sheet__backdrop').click({ position: { x: 20, y: 20 } });
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('choosing a route navigates and closes', async ({ page }) => {
    await openSheet(page);
    await page
      .locator('#mobile-menu')
      .getByRole('button', { name: 'Projects' })
      .click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('has no axe violations while open', async ({ page }) => {
    await openSheet(page);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      violations.map((v) => v.id + ' (' + String(v.nodes.length) + ')')
    ).toEqual([]);
  });
});

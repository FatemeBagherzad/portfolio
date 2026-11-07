import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

const VIEWPORT = { width: 390, height: 844 };

test.use({ viewport: VIEWPORT });

const openDrawer = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await settleAnimations(page);
  await page.getByRole('button', { name: /open main menu/i }).click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  // It slides in over ~280ms. Measuring the handle mid-slide gives a box
  // that has already moved by the time a drag starts, which makes the drag
  // distance wrong and the test flaky under parallel load.
  await settleAnimations(page);
};

/** Drags the panel's handle to the right by `distance`, in `steps` moves. */
const dragHandle = async (
  page: import('@playwright/test').Page,
  distance: number,
  steps = 10
) => {
  const handle = page.locator('.drawer__grab');
  const box = await handle.boundingBox();
  if (!box) throw new Error('drawer handle has no box');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(startX + (distance * step) / steps, startY);
  }
  await page.mouse.up();
};

test.describe('mobile navigation drawer', () => {
  test('opens against the right edge, full height and part width', async ({
    page,
  }) => {
    await openDrawer(page);

    const box = await page.locator('#mobile-menu').boundingBox();
    expect(box).not.toBeNull();

    // Anchored right: its right edge meets the viewport's.
    expect(Math.round(box!.x + box!.width)).toBe(VIEWPORT.width);
    // Full height.
    expect(Math.round(box!.height)).toBe(VIEWPORT.height);
    // But not full width — the page stays visible behind it.
    expect(box!.x).toBeGreaterThan(0);
    expect(box!.width).toBeLessThan(VIEWPORT.width);
  });

  test('is a modal dialog rendered outside the header', async ({ page }) => {
    await openDrawer(page);

    const panel = page.locator('#mobile-menu');
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');

    // The header carries a backdrop-filter, which would make it the
    // containing block for a fixed child and trap the panel inside the bar.
    const parentTag = await page.evaluate(
      () =>
        document.getElementById('mobile-menu')?.closest('.drawer')
          ?.parentElement?.tagName
    );
    expect(parentTag).toBe('BODY');
  });

  test('locks the page behind it and lists every route', async ({ page }) => {
    await openDrawer(page);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');

    for (const label of ['Home', 'Deep Dives', 'Projects', 'About']) {
      await expect(
        page.locator('#mobile-menu').getByRole('button', { name: label })
      ).toBeVisible();
    }
  });

  test('a long swipe to the right dismisses it', async ({ page }) => {
    await openDrawer(page);
    await dragHandle(page, 180);
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('a short drag springs back instead of dismissing', async ({ page }) => {
    await openDrawer(page);
    // Below the dismiss distance, and slow enough not to count as a flick.
    await dragHandle(page, 30, 20);
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });

  test('its own close button works, since it covers the header', async ({
    page,
  }) => {
    await openDrawer(page);
    await page.getByRole('button', { name: /close the menu/i }).click();
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('Escape closes it and returns focus to the toggle', async ({ page }) => {
    await openDrawer(page);
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
    await openDrawer(page);
    // Far left, well clear of the panel on the right.
    await page
      .locator('.drawer__backdrop')
      .click({ position: { x: 20, y: 20 } });
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('choosing a route navigates and closes', async ({ page }) => {
    await openDrawer(page);
    await page
      .locator('#mobile-menu')
      .getByRole('button', { name: 'Projects' })
      .click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
  });

  test('has no axe violations while open', async ({ page }) => {
    await openDrawer(page);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      violations.map((v) => v.id + ' (' + String(v.nodes.length) + ')')
    ).toEqual([]);
  });
});

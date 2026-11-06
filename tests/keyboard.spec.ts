import { expect, test } from '@playwright/test';

// The navigation used to be <span> and <li> elements with click handlers,
// which no keyboard user could reach. These tests stop that regressing.
test.describe('keyboard operation', () => {
  test('the skip link is the first tab stop and reveals itself', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
  });

  test('every nav item is reachable and activatable by keyboard', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    for (const label of ['Home', 'Deep Dives', 'Projects', 'About']) {
      await expect(
        nav.getByRole('button', { name: label, exact: true })
      ).toBeVisible();
    }

    await nav.getByRole('button', { name: 'Deep Dives' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/deep-dives$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Engineering Deep Dives/i })
    ).toBeVisible();
  });

  test('the mobile menu opens with Enter and closes with Escape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: /open main menu/i });
    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(
      page.getByRole('button', { name: /close main menu/i })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    // Focus must come back to the control that opened the menu, or it is
    // stranded on an element that no longer exists.
    await expect(
      page.getByRole('button', { name: /open main menu/i })
    ).toBeFocused();
  });

  test('old /challenges links still resolve to the renamed page', async ({
    page,
  }) => {
    await page.goto('/challenges');
    await expect(page).toHaveURL(/\/deep-dives$/);
  });
});

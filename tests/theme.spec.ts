import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';
import { settleAnimations } from './settle';

/**
 * Asserts the applied theme, retrying until it settles.
 *
 * The toggle runs inside a View Transition, which defers its callback until
 * the browser has captured the outgoing snapshot — so `data-theme` changes a
 * frame or two after the click, not synchronously with it.
 */
const expectTheme = async (
  page: import('@playwright/test').Page,
  theme: 'light' | 'dark'
): Promise<void> => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
};

test.describe('theme', () => {
  test('defaults to light when the system prefers light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expectTheme(page, 'light');
    await expect(
      page.getByRole('button', { name: /switch to dark theme/i })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  test('follows the system when it prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expectTheme(page, 'dark');
  });

  test('the toggle switches themes and says what it will do', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const toDark = page.getByRole('button', { name: /switch to dark theme/i });
    await toDark.click();

    await expectTheme(page, 'dark');
    const toLight = page.getByRole('button', {
      name: /switch to light theme/i,
    });
    await expect(toLight).toHaveAttribute('aria-pressed', 'true');

    await toLight.click();
    await expectTheme(page, 'light');
  });

  test('the choice survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByRole('button', { name: /switch to dark theme/i }).click();
    await expectTheme(page, 'dark');

    await page.reload();
    // Set by the inline script in index.html, before React runs, so there is
    // no flash of the wrong theme.
    await expectTheme(page, 'dark');
    await expect(
      page.getByRole('button', { name: /switch to light theme/i })
    ).toBeVisible();
  });

  test('an explicit light choice beats a dark system preference', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expectTheme(page, 'dark');

    await page.getByRole('button', { name: /switch to light theme/i }).click();
    await page.reload();
    await expectTheme(page, 'light');
  });

  for (const route of ROUTES) {
    test(`${route} has no axe violations in dark mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(route);
      await settleAnimations(page);
      await expectTheme(page, 'dark');

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      expect(
        violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`)
      ).toEqual([]);
    });
  }
});

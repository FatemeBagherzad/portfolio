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

/**
 * Seeds a saved light choice before any page script runs.
 *
 * This is the only way to reach the light theme on first paint, and testing
 * it through storage rather than through a click is what proves the inline
 * script in index.html reads the saved value at all.
 */
const storeLightChoice = async (
  page: import('@playwright/test').Page
): Promise<void> => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('theme', 'light');
    } catch {
      // Nothing to do: the test below will fail loudly if it mattered.
    }
  });
};

test.describe('theme', () => {
  test('defaults to dark when the system prefers light', async ({ page }) => {
    // The point of the change: dark is not a response to the operating
    // system, it is the starting point regardless of it.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expectTheme(page, 'dark');
    await expect(
      page.getByRole('button', { name: /switch to light theme/i })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('defaults to dark when the system prefers dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expectTheme(page, 'dark');
  });

  test('a system flip to light does not move the page', async ({ page }) => {
    // There used to be a listener that followed the system until the visitor
    // chose for themselves. With dark as the default that listener could
    // only ever undo the default, so it is gone — and this pins it shut.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expectTheme(page, 'dark');

    await page.emulateMedia({ colorScheme: 'light' });
    await expectTheme(page, 'dark');
  });

  test('the toggle switches themes and says what it will do', async ({
    page,
  }) => {
    await page.goto('/');

    const toLight = page.getByRole('button', {
      name: /switch to light theme/i,
    });
    await toLight.click();

    await expectTheme(page, 'light');
    const toDark = page.getByRole('button', { name: /switch to dark theme/i });
    await expect(toDark).toHaveAttribute('aria-pressed', 'false');

    await toDark.click();
    await expectTheme(page, 'dark');
  });

  test('a light choice survives a reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /switch to light theme/i }).click();
    await expectTheme(page, 'light');

    await page.reload();
    // Set by the inline script in index.html, before React runs, so there is
    // no flash of the wrong theme.
    await expectTheme(page, 'light');
    await expect(
      page.getByRole('button', { name: /switch to dark theme/i })
    ).toBeVisible();
  });

  test('a saved light choice beats a system that prefers dark', async ({
    page,
  }) => {
    await storeLightChoice(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expectTheme(page, 'light');
  });

  test('clearing the saved choice returns to dark', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /switch to light theme/i }).click();
    await expectTheme(page, 'light');

    await page.evaluate(() => {
      window.localStorage.removeItem('theme');
    });
    await page.reload();
    await expectTheme(page, 'dark');
  });

  // Dark is now what every other suite loads, so the axe sweep here covers
  // the theme that would otherwise go unchecked.
  for (const route of ROUTES) {
    test(`${route} has no axe violations in light mode`, async ({ page }) => {
      await storeLightChoice(page);
      await page.goto(route);
      await settleAnimations(page);
      await expectTheme(page, 'light');

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      expect(
        violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`)
      ).toEqual([]);
    });
  }
});

test('the choice is kept even if the page reloads mid-animation', async ({
  page,
}) => {
  // The toggle runs inside a View Transition, whose callback the browser
  // defers. Persisting the choice there meant a reload in that window lost
  // it — this reloads immediately, with no wait at all, to pin that shut.
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: /switch to light theme/i }).click();
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

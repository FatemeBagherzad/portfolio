import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';
import { settleAnimations } from './settle';

// The resume claims accessibility is built in from the component up, so it
// is asserted here rather than left to a one-off manual audit.
test.describe('accessibility', () => {
  for (const route of ROUTES) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await page.goto(route);
      await settleAnimations(page);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      expect(
        violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`)
      ).toEqual([]);
    });

    test(`${route} has exactly one h1 and a main landmark`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(page.locator('nav')).toHaveCount(1);
    });
  }

  test('the project detail view is also clean', async ({ page }) => {
    await page.goto('/projects');
    await settleAnimations(page);
    await page
      .getByRole('button', { name: /View details for Rabva/i })
      .click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Rabva' })
    ).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await settleAnimations(page);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  test('images that convey meaning have alt text, decorative ones do not', async ({
    page,
  }) => {
    await page.goto('/');
    // Every <img> must have an alt attribute, even if it is empty.
    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt).toBe(0);
    // The portrait names the person rather than saying "user photo".
    await expect(
      page.getByRole('img', { name: 'Fatemeh Bagherzad' })
    ).toBeVisible();
  });
});

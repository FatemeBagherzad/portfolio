import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await settleAnimations(page);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
};

test.describe('command palette', () => {
  test('opens with the keyboard shortcut and focuses the input', async ({
    page,
  }) => {
    await open(page);

    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveAttribute(
      'aria-modal',
      'true'
    );
    await expect(page.getByRole('listbox')).toBeVisible();
  });

  test('opens from the header button too', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);
    await page.getByRole('button', { name: /command palette/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('filtering narrows the list and announces the count', async ({
    page,
  }) => {
    await open(page);
    const before = await page.getByRole('option').count();

    await page.getByRole('combobox').fill('arabic');
    const after = await page.getByRole('option').count();

    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    // The best match should be the one that literally says it.
    await expect(page.getByRole('option').first()).toContainText(/arabic/i);
    // A sighted user watches the list shrink; this is the equivalent.
    // Scoped to the dialog: the hero has its own status region for the
    // email-copy confirmation.
    await expect(
      page.getByRole('dialog').getByRole('status')
    ).toContainText(/result/i);
  });

  test('arrow keys move the selection without moving focus', async ({
    page,
  }) => {
    await open(page);
    const input = page.getByRole('combobox');

    const first = await input.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    const second = await input.getAttribute('aria-activedescendant');

    expect(second).not.toBe(first);
    // Focus must stay in the text field, or typing would stop working.
    await expect(input).toBeFocused();
    await expect(
      page.locator('#' + String(second).replace(/:/g, '\\:'))
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('Enter runs the selected command', async ({ page }) => {
    await open(page);
    await page.getByRole('combobox').fill('deep dives');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/deep-dives$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Escape closes it and restores background scrolling', async ({
    page,
  }) => {
    await open(page);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe('hidden');
  });

  test('Tab stays inside the dialog', async ({ page }) => {
    await open(page);

    // Tab repeatedly; focus must never escape to the page behind.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement) ?? false;
      });
      expect(inside).toBe(true);
    }
  });

  test('has no axe violations while open', async ({ page }) => {
    await open(page);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      violations.map((v) => v.id + ' (' + String(v.nodes.length) + ')')
    ).toEqual([]);
  });
});

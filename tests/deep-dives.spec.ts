import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

const TOTAL = 26;

test.describe('deep dives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deep-dives');
    await settleAnimations(page);
  });

  test('windows the list: far fewer rows in the DOM than items', async ({
    page,
  }) => {
    await expect(page.getByRole('status')).toContainText('windowed');

    const rendered = await page.locator('.deep-dives__row').count();
    expect(rendered).toBeGreaterThan(0);
    // The whole point: the DOM holds a window, not the whole list.
    expect(rendered).toBeLessThan(TOTAL);
  });

  test('tells assistive tech the real size and position of each row', async ({
    page,
  }) => {
    const first = page.locator('.deep-dives__row article').first();
    // A windowed list only has some rows present, so the full set size has
    // to be stated explicitly or a screen reader reports the window.
    await expect(first).toHaveAttribute('aria-setsize', String(TOTAL));
    await expect(first).toHaveAttribute('aria-posinset', '1');
  });

  test('scrolling moves the window to different rows', async ({ page }) => {
    const titleAtTop = await page
      .locator('.deep-dives__row h2')
      .first()
      .textContent();

    await page.evaluate(() => window.scrollTo(0, 3000));
    await expect
      .poll(async () =>
        page.locator('.deep-dives__row h2').first().textContent()
      )
      .not.toBe(titleAtTop);

    const posinset = await page
      .locator('.deep-dives__row article')
      .first()
      .getAttribute('aria-posinset');
    expect(Number(posinset)).toBeGreaterThan(1);
  });

  test('filtering below the threshold switches back to a plain list', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'CampHeaven' }).click();

    await expect(page.getByRole('status')).not.toContainText('windowed');
    await expect(page.locator('.deep-dives__list')).toHaveCount(0);
    await expect(page.locator('.deep-dives__list-static')).toHaveCount(1);

    const cards = await page.locator('.deep-dives__card').count();
    expect(cards).toBeGreaterThan(0);
    expect(cards).toBeLessThanOrEqual(20);
  });

  test('search matches across title, body and project', async ({ page }) => {
    await page.getByRole('searchbox').fill('utf8mb4');

    await expect(page.getByRole('status')).toContainText('1 write-up');
    await expect(page.locator('.deep-dives__card-title')).toHaveText(
      /Byte-Exact Arabic Database Exports/
    );
  });

  test('an empty result set says so rather than showing nothing', async ({
    page,
  }) => {
    await page.getByRole('searchbox').fill('zzzzzzz');
    await expect(page.getByRole('status')).toContainText('0 write-ups');
    await expect(page.locator('.deep-dives__empty')).toBeVisible();
  });

  test('has no axe violations while windowed', async ({ page }) => {
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      violations.map((v) => v.id + ' (' + String(v.nodes.length) + ')')
    ).toEqual([]);
  });
});

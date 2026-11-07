import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settleAnimations } from './settle';

/**
 * The home page's three preview cards, and where they land.
 *
 * The third one is the interesting case: it points at index 11 of a list
 * that windows above twenty rows, so the row it targets is not in the DOM
 * when the navigation starts.
 */

const cards = (page: Page) => page.locator('.home__dive');

const goHome = async (page: Page) => {
  await page.goto('/');
  await settleAnimations(page);
};

test.describe('deep dive preview cards', () => {
  test('every card is a link to its own write-up', async ({ page }) => {
    await goHome(page);
    await expect(cards(page)).toHaveCount(3);

    for (const href of await page
      .locator('.home__dive-link')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))) {
      expect(href).toMatch(/^\/deep-dives\?dive=\d+$/);
    }
  });

  test('each card says it continues somewhere', async ({ page }) => {
    await goHome(page);
    const more = page.locator('.home__dive-more');
    await expect(more).toHaveCount(3);
    for (const label of await more.allInnerTexts()) {
      expect(label.toLowerCase()).toContain('read more');
    }
  });

  test('clicking the card body navigates, not just the heading', async ({
    page,
  }) => {
    await goHome(page);
    const card = cards(page).first();
    const title = (await card.locator('h3').innerText()).trim();

    // page.mouse does not scroll the way locator.click() does, so the card
    // has to be on screen before its box means anything.
    await card.scrollIntoViewIfNeeded();
    await settleAnimations(page);

    // Deliberately the bottom-left of the tile — nowhere near the heading
    // text. Only the stretched pseudo-element can catch this.
    const box = await card.boundingBox();
    if (!box) throw new Error('card has no box');
    await page.mouse.click(box.x + 12, box.y + box.height - 10);

    await expect(page).toHaveURL(/\/deep-dives\?dive=\d+/);
    await expect(
      page.locator('.deep-dives__card--targeted h2')
    ).toContainText(title);
  });

  test('the linked write-up is scrolled into view, not left off screen', async ({
    page,
  }) => {
    // dive=12 is index 11, far below the fold and outside the initial
    // window of a virtualised list.
    await page.goto('/deep-dives?dive=12');
    await settleAnimations(page);

    const target = page.locator('#dive-12');
    await expect(target).toBeVisible();

    const box = await target.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error('no box');

    // On screen, and clear of BOTH overlays: the fixed header and the
    // controls bar that sticks directly beneath it.
    const controlsBottom = await page
      .locator('.deep-dives__controls')
      .evaluate((node) => node.getBoundingClientRect().bottom);
    expect(box.y).toBeGreaterThanOrEqual(controlsBottom);
    expect(box.y).toBeLessThan(viewport.height);

    // The page actually moved; it did not just render the row at the top.
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(200);
  });

  test('the linked write-up is marked so the click lands visibly', async ({
    page,
  }) => {
    await page.goto('/deep-dives?dive=4');
    await settleAnimations(page);

    const targeted = page.locator('.deep-dives__card--targeted');
    await expect(targeted).toHaveCount(1);
    await expect(targeted).toHaveAttribute('id', 'dive-4');
  });

  test('an unknown dive id leaves the page alone', async ({ page }) => {
    await page.goto('/deep-dives?dive=9999');
    await settleAnimations(page);

    await expect(page.locator('.deep-dives__card--targeted')).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });

  test('a deep-linked page has no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/deep-dives?dive=12');
    await settleAnimations(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('deep dive links on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the linked write-up clears the taller stacked controls', async ({
    page,
  }) => {
    // The controls stack into a column at this width, so the strip covering
    // the top of the list is roughly three times taller than on a desktop.
    await page.goto('/deep-dives?dive=12');
    await settleAnimations(page);

    const target = page.locator('#dive-12');
    await expect(target).toBeVisible();

    await expect(async () => {
      const box = await target.boundingBox();
      const controlsBottom = await page
        .locator('.deep-dives__controls')
        .evaluate((node) => node.getBoundingClientRect().bottom);
      expect(box?.y ?? 0).toBeGreaterThanOrEqual(controlsBottom);
    }).toPass({ timeout: 5000 });
  });
});

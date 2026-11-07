import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settleAnimations } from './settle';

/**
 * The header search.
 *
 * "Docker" is the query used throughout because it appears in one project
 * and in two write-ups, which is exactly the cross-page behaviour the field
 * exists for: one technology, every mention of it, wherever it lives.
 */

const field = (page: Page) => page.getByRole('combobox', { name: /search/i });
const list = (page: Page) => page.getByRole('listbox', { name: /search results/i });

const search = async (page: Page, query: string) => {
  await page.goto('/');
  await settleAnimations(page);
  await field(page).fill(query);
  await expect(list(page)).toBeVisible();
};

test.describe('header search', () => {
  test('a technology finds both projects and write-ups', async ({ page }) => {
    await search(page, 'docker');

    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();

    // Both kinds are represented, which is the whole point: the results are
    // not scoped to the page you happen to be on.
    const text = (await options.allInnerTexts()).join('\n');
    expect(text).toMatch(/project/i);
    expect(text).toMatch(/deep dive/i);

    // Every result genuinely mentions the term somewhere.
    for (const entry of await options.allInnerTexts()) {
      expect(entry.toLowerCase()).toContain('docker');
    }
  });

  test('the matched words are marked in the results', async ({ page }) => {
    await search(page, 'docker');
    const marks = list(page).locator('mark');
    expect(await marks.count()).toBeGreaterThan(0);
    for (const value of await marks.allInnerTexts()) {
      expect(value.toLowerCase()).toBe('docker');
    }
  });

  test('a project result opens that project', async ({ page }) => {
    await search(page, 'rabva');

    // Arrow down to select, Enter to open: the input keeps focus the whole
    // time, which is what makes this a combobox rather than a menu.
    await field(page).press('ArrowDown');
    await expect(field(page)).toHaveAttribute('aria-activedescendant', /option-0$/);
    await field(page).press('Enter');

    await expect(page).toHaveURL(/\/projects\?project=\d+/);
    await expect(
      page.getByRole('heading', { level: 1, name: /rabva/i })
    ).toBeVisible();
    // The field empties itself once it has delivered you somewhere.
    await expect(field(page)).toHaveValue('');
  });

  test('a write-up result lands on Deep Dives already filtered', async ({
    page,
  }) => {
    await search(page, 'docker');

    // The first write-up in the list, whichever rank it landed at.
    const dive = page.getByRole('option').filter({ hasText: 'Deep dive' }).first();
    await dive.click();

    await expect(page).toHaveURL(/\/deep-dives\?q=docker/);
    // The page's own field arrives carrying the term...
    await expect(page.locator('.deep-dives__input')).toHaveValue('docker');
    // ...and the list is narrowed rather than showing everything.
    await expect(page.locator('.deep-dives__count')).toContainText(/write-up/);
    expect(await page.locator('.deep-dives__card mark').count()).toBeGreaterThan(0);
  });

  test('a filtered Deep Dives URL can be loaded directly', async ({ page }) => {
    await page.goto('/deep-dives?q=docker');
    await settleAnimations(page);
    await expect(page.locator('.deep-dives__input')).toHaveValue('docker');

    const titles = await page.locator('.deep-dives__card').allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    for (const entry of titles) {
      expect(entry.toLowerCase()).toContain('docker');
    }
  });

  test('a project URL can be loaded directly', async ({ page }) => {
    await page.goto('/projects?project=1');
    await settleAnimations(page);
    await expect(
      page.getByRole('heading', { level: 1, name: /rabva/i })
    ).toBeVisible();

    // Back closes the detail view instead of leaving the site.
    await page.getByRole('button', { name: /back to all projects/i }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  });

  test('nothing found says so instead of showing an empty box', async ({
    page,
  }) => {
    await search(page, 'cobol');
    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(list(page)).toContainText(/nothing matches/i);
  });

  test('Escape closes the list, then clears the field', async ({ page }) => {
    await search(page, 'docker');

    await field(page).press('Escape');
    await expect(list(page)).toBeHidden();
    await expect(field(page)).toHaveValue('docker');

    await field(page).press('Escape');
    await expect(field(page)).toHaveValue('');
  });

  test('the clear button empties the field and returns focus to it', async ({
    page,
  }) => {
    await search(page, 'docker');
    await page.getByRole('button', { name: /clear the search/i }).click();
    await expect(field(page)).toHaveValue('');
    await expect(field(page)).toBeFocused();
  });

  test('clicking the page closes the list', async ({ page }) => {
    await search(page, 'docker');
    // Well clear of both the field and the list hanging under it.
    await page.mouse.click(1100, 600);
    await expect(list(page)).toBeHidden();
  });

  test('arrowing wraps around the list', async ({ page }) => {
    await search(page, 'docker');
    const count = await page.getByRole('option').count();

    await field(page).press('ArrowUp');
    // Up from nothing selected goes to the last result.
    await expect(field(page)).toHaveAttribute(
      'aria-activedescendant',
      new RegExp('option-' + String(count - 1) + '$')
    );

    await field(page).press('ArrowDown');
    await expect(field(page)).toHaveAttribute('aria-activedescendant', /option-0$/);
  });

  test('selected work outranks coursework for a shared technology', async ({
    page,
  }) => {
    await search(page, 'react');
    const titles = await page.getByRole('option').allInnerTexts();

    const rankOf = (name: RegExp): number =>
      titles.findIndex((entry) => name.test(entry));

    const rabva = rankOf(/rabva/i);
    const brainflix = rankOf(/brainflix/i);

    expect(rabva).toBeGreaterThanOrEqual(0);
    expect(brainflix).toBeGreaterThanOrEqual(0);
    // A bootcamp exercise repeats "React" more often than the flagship does;
    // the ranking must not reward that.
    expect(rabva).toBeLessThan(brainflix);
  });

  test('a technology named only on a page still finds that page', async ({
    page,
  }) => {
    // Python is a hero chip and sits in the About copy, but is in no
    // project's stack — the case where an index built from the JSON alone
    // would come back empty.
    await search(page, 'python');
    const titles = await page.getByRole('option').allInnerTexts();
    expect(titles.join(' ').toLowerCase()).toContain('about');
    expect(await page.getByRole('option').count()).toBeGreaterThan(0);
  });

  test('two words must both match, not either', async ({ page }) => {
    await search(page, 'docker nginx');
    for (const entry of await page.getByRole('option').allInnerTexts()) {
      const lower = entry.toLowerCase();
      expect(lower).toContain('docker');
      expect(lower).toContain('nginx');
    }
  });

  test('a write-up is findable by what it was solved with', async ({ page }) => {
    // Terraform appears in exactly one write-up's own stack and in no
    // project's prose, so it can only be found through the dive's tags.
    await search(page, 'terraform');
    const options = page.getByRole('option');
    expect(await options.count()).toBeGreaterThan(0);

    const text = (await options.allInnerTexts()).join(' ').toLowerCase();
    expect(text).toContain('nginx');
    expect(text).toContain('terraform');
  });

  test('an agent tool is findable across the site', async ({ page }) => {
    // Claude Code is on her resume and is genuinely how Rabva was built;
    // it has to resolve to the write-ups that describe that work.
    await search(page, 'claude');
    expect(await page.getByRole('option').count()).toBeGreaterThan(0);
  });

  test('the open list has no accessibility violations', async ({ page }) => {
    await search(page, 'docker');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('header search on a phone', () => {
  // 360px: a Galaxy S24 at its default zoom, and the narrowest screen worth
  // designing for.
  test.use({ viewport: { width: 360, height: 780 } });

  test('is in the bar, not behind the menu button', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    // One field, visible without opening anything.
    await expect(page.locator('.site-search')).toHaveCount(1);
    await expect(field(page)).toBeVisible();

    await field(page).fill('docker');
    await expect(list(page)).toBeVisible();
    await expect(page.getByRole('option').first()).toBeVisible();
  });

  test('the drawer no longer carries a second copy', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);
    await page.getByRole('button', { name: /open main menu/i }).click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await settleAnimations(page);

    await expect(page.locator('#mobile-menu .site-search')).toHaveCount(0);
  });

  test('the results list stays inside the screen', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);
    await field(page).fill('docker');
    await expect(list(page)).toBeVisible();

    // Anchored to a field that starts two thirds of the way across a phone,
    // a list wide enough to read would hang off the right edge. This is the
    // reason it becomes a sheet under the bar at this width.
    const box = await list(page).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  });

  test('the field is a 44px touch target and does not zoom the page', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 780 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await settleAnimations(page);

    const box = await page.locator('.site-search__field').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Below 16px, iOS Safari zooms the whole page the moment this is
    // tapped, and leaves the visitor scrolled sideways.
    const size = await page
      .locator('.site-search__input')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
    await context.close();
  });
});

test('the command-palette shortcut is gone', async ({ page }) => {
  await page.goto('/');
  await settleAnimations(page);

  // No key hint left in the header, and the shortcut opens nothing.
  await expect(page.locator('kbd')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

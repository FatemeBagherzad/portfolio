import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { settleAnimations } from './settle';

const layoutDirection = (
  page: import('@playwright/test').Page,
  cardIndex: number
) =>
  page
    .locator('.project-card__layout')
    .nth(cardIndex)
    .evaluate((el) => getComputedStyle(el).flexDirection);

test.describe('projects', () => {
  test('cards lay out from their container, not the viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');
    await settleAnimations(page);

    // Two cards, one viewport, two different layouts. A media query could
    // not produce this: both cards see the same window width, and only
    // their own container width differs.
    const featureWidth = await page
      .locator('.project-card')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    const educationWidth = await page
      .locator('.project-card')
      .nth(3)
      .evaluate((el) => el.getBoundingClientRect().width);

    expect(featureWidth).toBeGreaterThan(educationWidth);
    expect(await layoutDirection(page, 0)).toBe('row');
    expect(await layoutDirection(page, 3)).toBe('column');
  });

  test('one project leads, and CampHeaven sits with the practice work', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');
    await settleAnimations(page);

    const lead = page.locator('.projects__cards--feature .project-card');
    await expect(lead).toHaveCount(1);
    await expect(lead).toContainText('Rabva');

    const practice = page.locator('.projects__cards--compact .project-card');
    await expect(practice.filter({ hasText: 'CampHeaven' })).toHaveCount(1);
    // Still the full set, just arranged around one of them.
    await expect(practice).toHaveCount(7);
  });

  test('a narrow window stacks every card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');
    await settleAnimations(page);

    expect(await layoutDirection(page, 0)).toBe('column');
    expect(await layoutDirection(page, 3)).toBe('column');
  });

  test('the tilt effect is not shipped to touch devices', async ({
    browser,
  }) => {
    // A tilt driven by a hovering pointer is meaningless without one, so
    // the component should render nothing rather than idle handlers.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto('/projects');
    await settleAnimations(page);

    await expect(page.locator('.tilt')).toHaveCount(0);
    // The cards themselves must still be there.
    await expect(page.locator('.project-card').first()).toBeVisible();
    await context.close();
  });

  test('tilt is present where there is a real pointer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');
    await settleAnimations(page);
    expect(await page.locator('.tilt').count()).toBeGreaterThan(0);
  });

  test('has no axe violations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');
    await settleAnimations(page);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      violations.map((v) => v.id + ' (' + String(v.nodes.length) + ')')
    ).toEqual([]);
  });
});

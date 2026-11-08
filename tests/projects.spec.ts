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
    await expect(practice).toHaveCount(8);
  });

  test('the practice section runs newest first', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');
    await settleAnimations(page);

    // Order comes from position in projects.json, not from the period
    // shown on the card, so nothing stops the two drifting apart. The
    // dates are the thing a reader actually follows down the section.
    const years = await page
      .locator('.projects__cards--compact .project-card__period')
      .allInnerTexts();

    const parsed = years.map((text) => Number(text.trim().slice(0, 4)));
    expect(parsed).toHaveLength(8);
    expect(parsed.every((year) => Number.isFinite(year))).toBe(true);

    const descending = [...parsed].sort((a, b) => b - a);
    expect(parsed).toEqual(descending);
  });

  test('a live link is shown only where there is something to open', async ({
    page,
  }) => {
    await page.goto('/projects');
    await settleAnimations(page);

    // `liveUrl` is optional and most projects have none, so the button has
    // to be absent rather than present-and-dead. Cheat Sheets is the only
    // one deployed.
    const live = page.getByRole('link', { name: /^Live demo of / });
    await expect(live).toHaveCount(1);
    await expect(live).toHaveAttribute('href', /^https:\/\//);
    await expect(live).toHaveAccessibleName(/Cheat Sheets/);

    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(9);
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

/**
 * The carousel dots.
 *
 * Swiper ships its own: black at 20% opacity for the inactive ones. On the
 * dark page that measured 1.01:1 against the background — invisible, not
 * faint — so the only indication of position in an eight-image set was
 * missing for everyone who lands on the default theme.
 *
 * The floor here is WCAG 1.4.11's 3:1 for a meaningful non-text element.
 */
const CONTRAST_FLOOR = 3;

const dotContrast = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const parse = (value: string) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = (m[1] ?? '').split(',').map((x) => parseFloat(x.trim()));
      return {
        r: p[0] ?? 0,
        g: p[1] ?? 0,
        b: p[2] ?? 0,
        a: p.length > 3 ? (p[3] ?? 1) : 1,
      };
    };
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = (c: { r: number; g: number; b: number }) =>
      0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);

    const page = parse(getComputedStyle(document.body).backgroundColor);
    const dots = Array.from(
      document.querySelectorAll('.swiper-pagination-bullet')
    );
    const active = document.querySelector('.swiper-pagination-bullet-active');
    const inactive = dots.find((d) => d !== active);
    if (!page || !inactive || !active) return null;

    const measure = (el: Element) => {
      const style = getComputedStyle(el);
      const raw = parse(style.backgroundColor);
      if (!raw) return 0;
      // Swiper dims its dots with opacity, so fold that in before judging.
      const alpha = raw.a * parseFloat(style.opacity);
      const c = {
        r: alpha * raw.r + (1 - alpha) * page.r,
        g: alpha * raw.g + (1 - alpha) * page.g,
        b: alpha * raw.b + (1 - alpha) * page.b,
      };
      const a = lum(c);
      const b = lum(page);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };

    return {
      count: dots.length,
      inactive: measure(inactive),
      active: measure(active),
      // Position must not be signalled by hue alone.
      differentWidths:
        getComputedStyle(active).width !==
        getComputedStyle(inactive).width,
    };
  });

for (const theme of ['dark', 'light'] as const) {
  test(`every carousel dot is visible in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((t) => {
      try {
        window.localStorage.setItem('theme', t as string);
      } catch {
        /* ignore */
      }
    }, theme);
    await page.goto('/projects?project=1');
    await settleAnimations(page);
    await expect(page.locator('.swiper-pagination-bullet').first()).toBeVisible();

    const measured = await dotContrast(page);
    expect(measured).not.toBeNull();
    expect(measured!.count).toBeGreaterThan(1);
    expect(measured!.inactive).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
    expect(measured!.active).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
    expect(measured!.differentWidths).toBe(true);
  });
}

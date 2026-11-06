import { expect, test } from '@playwright/test';
import { ROUTES, VIEWPORTS } from './routes';
import { settleAnimations } from './settle';

/**
 * Returns how many pixels the page is wider than its own viewport, plus the
 * elements responsible, so a failure says what to fix rather than just that
 * a number was wrong.
 */
const measureOverflow = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const docEl = document.documentElement;
    const widest = Math.max(docEl.scrollWidth, document.body.scrollWidth);
    const offenders: string[] = [];

    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > window.innerWidth + 1) {
        const cls =
          typeof el.className === 'string' && el.className
            ? `.${el.className.trim().split(/\s+/).join('.')}`
            : '';
        offenders.push(`${el.tagName}${cls} (right: ${Math.round(rect.right)})`);
      }
    });

    return {
      overflow: widest - window.innerWidth,
      viewport: window.innerWidth,
      offenders: [...new Set(offenders)].slice(0, 5),
    };
  });

// The site advertises mobile-first and responsive work. This is the claim
// stated as a test: the page is never wider than the screen it is on.
test.describe('no horizontal overflow', () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route} at ${viewport.width}px (${viewport.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(route);
        await settleAnimations(page);

        const result = await measureOverflow(page);
        expect(
          result.overflow,
          `page overflows by ${result.overflow}px; widest elements: ${
            result.offenders.join(', ') || 'none identified'
          }`
        ).toBeLessThanOrEqual(0);
      });
    }
  }

  test('tap targets in the header are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /open main menu/i });
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

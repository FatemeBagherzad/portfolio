import type { Page } from '@playwright/test';

/**
 * Waits until the page has stopped moving.
 *
 * Framer Motion fades the About content in from `opacity: 0` over about a
 * second using the Web Animations API. axe sampling mid-fade reports
 * colour-contrast failures for text that is perfectly readable once the
 * animation lands, and layout measurements taken mid-transform are wrong for
 * the same reason.
 *
 * Infinite animations are excluded deliberately: a decorative colour cycle
 * never reaches a finished state, so waiting on it would hang.
 */
export const settleAnimations = async (page: Page): Promise<void> => {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () =>
      document.getAnimations().every((animation) => {
        const iterations = animation.effect?.getTiming().iterations ?? 1;
        if (!Number.isFinite(iterations)) return true;
        return animation.playState !== 'running';
      }),
    undefined,
    { timeout: 10_000 }
  );
};

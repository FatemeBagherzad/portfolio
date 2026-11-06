import type { Page } from '@playwright/test';

/**
 * Waits until the page has stopped moving.
 *
 * Framer Motion fades content in from `opacity: 0` over about a second using
 * the Web Animations API. axe sampling mid-fade reports colour-contrast
 * failures for text that is perfectly readable once the animation lands, and
 * layout measurements taken mid-transform are wrong for the same reason.
 *
 * Two kinds of animation are deliberately excluded, because waiting on either
 * would hang forever:
 *
 * - infinite ones, such as a decorative colour cycle
 * - scroll-driven ones (`animation-timeline: scroll()`), whose progress is
 *   tied to scroll position rather than to time. Their `playState` stays
 *   "running" and their iteration count is finite, so they look like ordinary
 *   unfinished animations; the giveaway is that their timeline is not the
 *   document timeline.
 */
export const settleAnimations = async (page: Page): Promise<void> => {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () =>
      document.getAnimations().every((animation) => {
        if (animation.timeline !== document.timeline) return true;
        const iterations = animation.effect?.getTiming().iterations ?? 1;
        if (!Number.isFinite(iterations)) return true;
        return animation.playState !== 'running';
      }),
    undefined,
    { timeout: 10_000 }
  );
};

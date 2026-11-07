/** Every route the site serves, including the catch-all 404. */
export const ROUTES = [
  '/',
  '/deep-dives',
  '/projects',
  '/tools',
  '/about-me',
  '/no-such-page-here',
] as const;

/**
 * Page states that are not their own route but render different things.
 *
 * The tools page shows one tool at a time, so a sweep that only visits
 * `/tools` measures the first tab and nothing else — and the other two are
 * where the tables and preformatted blocks live, which is exactly where a
 * layout breaks on a phone.
 */
export const PAGE_STATES = [
  ...ROUTES,
  '/tools?tool=text-inspector',
  '/tools?tool=eval-bench',
] as const;

export const VIEWPORTS = [
  { name: 'small phone', width: 320, height: 760 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

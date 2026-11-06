/** Every route the site serves, including the catch-all 404. */
export const ROUTES = [
  '/',
  '/deep-dives',
  '/projects',
  '/about-me',
  '/no-such-page-here',
] as const;

export const VIEWPORTS = [
  { name: 'small phone', width: 320, height: 760 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

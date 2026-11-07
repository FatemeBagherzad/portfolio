/**
 * The headline stack, shown as chips under the hero.
 *
 * It lives here rather than in Hero.tsx because the site search indexes it
 * too: a visitor who reads "Python" on the home page and types it into the
 * search box has to find something, and that only stays true if both read
 * the same list.
 */
export const HERO_STACK: readonly string[] = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'AI-directed development',
];

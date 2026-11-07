# Portfolio — Fatemeh Bagherzad

[![CI](https://github.com/FatemeBagherzad/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/FatemeBagherzad/portfolio/actions/workflows/ci.yml)

The source for my personal site: a React and TypeScript single-page app
showing selected work, written engineering notes, and how to reach me.

**Live:** https://fateme-bagherzad.com

## Why it is built this way

A portfolio is the one project a reviewer can inspect without being given
access, so the things I claim to care about professionally are demonstrated
here rather than asserted:

- **Accessibility is verified, not assumed.** Every page has one `<h1>`,
  `header` / `nav` / `main` landmarks and a skip link; the whole interface is
  operable from the keyboard, including the mobile menu, which supports
  `Escape` and returns focus to the button that opened it. Route changes move
  focus to `<main>`, which a single-page app does not do on its own. Focus
  rings are checked for contrast: magenta on white at 7.34:1, gold on the dark
  header at 11.2:1, both above the 3:1 WCAG 2.2 minimum. `axe-core` reports
  **zero violations** on every route.
- **Mobile-first is measured.** Every route is asserted to have no horizontal
  overflow at 320, 375, 768 and 1280px, and the test names the offending
  elements when it fails rather than just reporting a number.
- **Images are served at the size they are displayed.** The portraits ship as
  WebP at 300w / 600w / 900w behind `srcset`, so a 1× phone downloads about
  32 KB where the original PNGs were 1.7 MB.
- **Theming is a data change, not a rewrite.** Every colour is a CSS custom
  property defined once in `_global.scss`; components reference tokens and
  never a hex value. A light/dark toggle swaps the set at runtime, remembers
  the choice, follows the operating system until the visitor overrides it,
  and is applied by an inline script before first paint so the page never
  flashes the wrong theme.
- **Search covers the whole site, not one page.** A technology typed in the
  header is matched against every project, write-up and page at once, ranked
  so the work outranks the coursework that merely repeats the word more
  often. It is a real combobox: the input keeps focus while
  `aria-activedescendant` moves the selection, so each result is announced as
  you arrow through it. Results deep-link — a write-up opens Deep Dives
  already filtered, a project opens its own URL — which also means the
  browser's back button now closes a project instead of leaving the page.
- **TypeScript runs in strict mode**, including `noUncheckedIndexedAccess`
  and `exactOptionalPropertyTypes`.
- **Global styles are emitted once.** `variables` and `mixins` render nothing
  and can be used anywhere; `global` and `typography` are imported a single
  time in `src/styles/main.scss`.

Every one of those claims is a test. `npm test` runs 100 Playwright checks
against the production build: an axe scan of all five routes plus the project
detail view, the same scan again in dark mode, a horizontal-overflow assertion
for each route at 320, 375, 768 and 1280px, header tap targets measured at
44px, keyboard coverage for the skip link, the nav and the mobile menu's
Enter/Escape handling, theme persistence across reloads, and the search's
ranking, deep links and keyboard selection. CI runs them on every push.

## Stack

React 18 · TypeScript · Vite · SCSS · React Router · Framer Motion · Swiper

Tooling: ESLint (typescript-eslint) · axe-core · Netlify

## Running it

```bash
npm install
npm run dev
```

| Script              | Does                                      |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server                           |
| `npm run build`     | Type-check, then production build         |
| `npm run typecheck` | `tsc -b` on its own                       |
| `npm run lint`      | ESLint across the project                 |
| `npm test`          | Playwright suite against the built site   |
| `npm run test:ui`   | Playwright in watch / inspector mode      |
| `npm run preview`   | Serve the production build locally        |

## Layout

```
src/
  components/   Hero, Menu, SiteSearch, ThemeToggle, ProjectCard, Swiper
  pages/        Home, Projects, DeepDives, AboutMe, NotFound
  assets/
    projects-data/   projects.json, challenges.json — the site's content
  constants/    tech.ts — readable names for stack icons; stack.ts
  utils/        searchIndex.ts — one flat index over the site's content
  styles/       main.scss and partials (variables, mixins, typography, global)
  types/        Project and Challenge interfaces
tests/          Playwright specs: accessibility, responsive, keyboard, theme
```

Content lives in the two JSON files rather than in components, so adding a
project or a write-up does not mean touching JSX.

## Contact

- **Email:** fa.bagherzad@gmail.com
- **GitHub:** [FatemeBagherzad](https://github.com/FatemeBagherzad)
- **LinkedIn:** [fatemeh-bagherzad](https://www.linkedin.com/in/fatemeh-bagherzad/)

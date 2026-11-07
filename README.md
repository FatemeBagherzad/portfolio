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
- **Search covers the whole site, not one page, at every width.** A
  technology typed in the header — which is a field on a phone too, not a
  magnifying glass behind the menu button — is matched against every
  project, write-up, tool and page at once, ranked
  so the work outranks the coursework that merely repeats the word more
  often. It is a real combobox: the input keeps focus while
  `aria-activedescendant` moves the selection, so each result is announced as
  you arrow through it. Results deep-link — a write-up opens Deep Dives
  already filtered, a project opens its own URL — which also means the
  browser's back button now closes a project instead of leaving the page.
- **There are working apps on here, not only case studies.** `/tools` holds
  three: a Scratchpad that evaluates lines like `3 nights at $180` through a
  hand-written tokeniser and precedence-climbing parser — no parsing library
  — a Text Inspector that shows what a string is actually made of, which
  exists because "how long is this word" has four different answers in
  Arabic, and an Eval Bench, a regression harness for prompts that reports a
  pass rate with its spread and diffs one prompt version against another.
  All three run entirely in the browser with no backend — the bench calls no
  model and needs no key, because the harness is the engineering and
  fabricating a record of real runs is the one thing the discipline exists
  to prevent. They are code-split, so the Text Inspector embedded on the
  home page costs the first paint nothing and the other two are not fetched
  there at all. The parser and the bench carry 44 tests between them that
  never open a browser.
- **Type is readable on a phone, not only in a screenshot.** One fluid
  scale in `_tokens.scss` sets every size on the site: body text is 16px at
  every width, nothing visible goes below 12.5px, and anything typed into is
  at least 16px — under that, iOS Safari zooms the page on focus and leaves
  you scrolled sideways. The floors are asserted against the rendered page,
  so a component that quietly invents a size of its own fails the build.
- **TypeScript runs in strict mode**, including `noUncheckedIndexedAccess`
  and `exactOptionalPropertyTypes`.
- **Global styles are emitted once.** `variables` and `mixins` render nothing
  and can be used anywhere; `global` and `typography` are imported a single
  time in `src/styles/main.scss`.

Every one of those claims is a test. `npm test` runs 224 Playwright checks
against the production build: an axe scan of every route plus the project
detail view, the same scan again in dark mode, a horizontal-overflow assertion
and a type-size floor for each page state at 320, 375, 768 and 1280px —
including each tool's own tab, where the tables and preformatted blocks live
— header tap targets measured at 44px, keyboard coverage for the skip link, the nav and the mobile menu's
Enter/Escape handling, theme persistence across reloads, and the search's
ranking, deep links and keyboard selection, and the tools — the parser's
arithmetic, unit and currency rules as pure unit tests, plus the pages they
run on. CI runs them on every push.

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
  pages/        Home, Projects, DeepDives, Tools, AboutMe, NotFound
  tools/        scratchpad/ (tokenize, parse, evaluate, units, rates)
                textInspector/ (inspect) — both code-split
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

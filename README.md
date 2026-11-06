# Portfolio — Fatemeh Bagherzad

The source for my personal site: a React and TypeScript single-page app
showing selected work, written engineering notes, and how to reach me.

**Live:** https://fateme-bagherzad-portfolio.netlify.app/

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
- **Mobile-first is measured.** The layout is asserted to have no horizontal
  overflow at 320px and 375px, not just eyeballed.
- **Images are served at the size they are displayed.** The portraits ship as
  WebP at 300w / 600w / 900w behind `srcset`, so a 1× phone downloads about
  32 KB where the original PNGs were 1.7 MB.
- **TypeScript runs in strict mode**, including `noUncheckedIndexedAccess`
  and `exactOptionalPropertyTypes`.
- **Global styles are emitted once.** `variables` and `mixins` render nothing
  and can be used anywhere; `global` and `typography` are imported a single
  time in `src/styles/main.scss`.

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
| `npm run preview`   | Serve the production build locally        |

## Layout

```
src/
  components/   Hero, Menu, ProjectCard, ProjectDetail, SwiperComponent
  pages/        Home, Projects, Challenges, AboutMe, NotFound
  assets/
    projects-data/   projects.json, challenges.json — the site's content
  constants/    tech.ts — readable names for stack icons
  styles/       main.scss and partials (variables, mixins, typography, global)
  types/        Project and Challenge interfaces
```

Content lives in the two JSON files rather than in components, so adding a
project or a write-up does not mean touching JSX.

## Contact

- **Email:** fa.bagherzad@gmail.com
- **GitHub:** [FatemeBagherzad](https://github.com/FatemeBagherzad)
- **LinkedIn:** [fatemeh-bagherzad](https://www.linkedin.com/in/fatemeh-bagherzad/)

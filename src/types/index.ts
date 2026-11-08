/**
 * Where a project sits on the projects page.
 *
 * `selected` is deliberately a section of one: the page is built around a
 * single project to walk through, and a second card there would contradict
 * both the heading and the wide one-per-row layout. Everything else sits
 * under `education`, whether or not it came from a course.
 */
export type ProjectCategory = 'selected' | 'education';

/**
 * Shape of a single entry in `src/assets/projects-data/projects.json`.
 */
export interface Project {
  id: number;
  title: string;
  /** One sentence a reviewer can read without opening anything. */
  tagline: string;
  description: string;
  /** Drives which section of the projects page the card appears in. */
  category: ProjectCategory;
  /** Readable stack names shown as text under the card. */
  stack: string[];
  /** When the work happened, e.g. "2024 – present". */
  period: string;
  /** Paths relative to `public/`, e.g. `project-images/rabva/Rabva-board.gif`. */
  images: string[];
  /**
   * The cover image's own ratio, as `width / height`.
   *
   * Driving the media box from this means `object-fit: cover` has nothing
   * to crop and nothing to letterbox — the box is already the shape of the
   * picture. A single shared ratio cannot do that here: the covers are
   * 1.47 and 1.70, so one of them always loses.
   */
  coverAspect: string;
  /** Public GitHub repository URL. */
  repo: string;
  /** Deployed URL, when the project is publicly reachable. */
  liveUrl?: string;
  /** Filenames inside `src/assets/icons/tech-icons/`, e.g. `react.svg`. */
  icons: string[];
}

/**
 * Shape of a single entry in `src/assets/projects-data/challenges.json`.
 */
export interface Challenge {
  id: number;
  title: string;
  description: string;
  /** Which project the problem came from, e.g. "Rabva". */
  project: string;
  /**
   * What this particular problem was solved with.
   *
   * Narrower than the project's stack on purpose: the write-up about Arabic
   * rendering is a CSS and Unicode problem, not an AWS one, and tagging it
   * with everything Rabva uses would make the technology filter useless.
   */
  stack: string[];
  /** Surfaced on the home page as a preview. */
  featured?: boolean;
}

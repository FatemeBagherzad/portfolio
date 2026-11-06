/**
 * Shape of a single entry in `src/assets/projects-data/projects.json`.
 */
export interface Project {
  id: number;
  title: string;
  description: string;
  /** Paths relative to `public/`, e.g. `project-images/rabva/Rabva-board.gif`. */
  images: string[];
  /** Public GitHub repository URL. */
  repo: string;
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
}

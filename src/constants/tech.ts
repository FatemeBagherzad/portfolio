/**
 * Human-readable names for the tech-stack icon filenames stored in
 * `projects.json`. Without these a screen reader reads out raw filenames
 * such as "docker logo svgrepo com" for every card.
 */
const TECH_LABELS: Readonly<Record<string, string>> = {
  'Amazon_Web_Services_Logo.svg': 'AWS',
  'EC2-instance-contents_32.svg': 'Amazon EC2',
  'Tux.svg': 'Linux',
  'axios.svg': 'Axios',
  'css.svg': 'CSS3',
  'docker-logo-svgrepo-com.svg': 'Docker',
  'eslint.svg': 'ESLint',
  'express.svg': 'Express',
  'git.svg': 'Git',
  'github.svg': 'GitHub',
  'html5.svg': 'HTML5',
  'ionic.svg': 'Ionic',
  'javascript.svg': 'JavaScript',
  'jira.svg': 'Jira',
  'mysql.svg': 'MySQL',
  'nodedotjs.svg': 'Node.js',
  'python.svg': 'Python',
  'react.svg': 'React',
  'reactrouter.svg': 'React Router',
  'sass.svg': 'Sass',
  'vite.svg': 'Vite',
};

export const techLabel = (iconFileName: string): string =>
  TECH_LABELS[iconFileName] ?? iconFileName.replace(/\.svg$/, '');

export const techLabels = (iconFileNames: readonly string[]): string[] =>
  iconFileNames.map(techLabel);

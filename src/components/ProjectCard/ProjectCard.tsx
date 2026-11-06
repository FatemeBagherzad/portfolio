import './ProjectCard.scss';

// Vite bundles every icon in this folder and gives us its final URL,
// so the icons work both in `npm run dev` and in the Netlify build.
const techIcons = import.meta.glob<string>(
  '../../assets/icons/tech-icons/*.svg',
  { eager: true, query: '?url', import: 'default' }
);

const iconUrl = (name: string): string =>
  techIcons[`../../assets/icons/tech-icons/${name}`] ?? '';

interface ProjectCardProps {
  projectTitle: string;
  /** May be `undefined` when a project has no images yet. */
  projectCoverImg: string | undefined;
  onClick: () => void;
  icons?: string[];
}

const ProjectCard = ({
  projectTitle,
  projectCoverImg,
  onClick,
  icons = [],
}: ProjectCardProps) => {
  return (
    <div onClick={onClick} className="project-card">
      {projectCoverImg && (
        <img
          src={'/' + projectCoverImg.replace(/^\/+/, '')}
          alt={projectTitle}
          className="project-card__img"
        />
      )}
      <span className="project-card__title">
        {projectTitle}
        {icons.map((icon, idx) => (
          <img
            key={icon + idx}
            src={iconUrl(icon)}
            alt={icon.replace('.svg', '')}
            className="project-card__tech-icon"
          />
        ))}
      </span>
    </div>
  );
};

export default ProjectCard;

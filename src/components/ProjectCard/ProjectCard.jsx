import React from 'react';
import './ProjectCard.scss';

// Vite bundles every icon in this folder and gives us its final URL,
// so the icons work both in `npm run dev` and in the Netlify build.
const techIcons = import.meta.glob(
  '../../assets/icons/tech-icons/*.svg',
  { eager: true, query: '?url', import: 'default' }
);

const iconUrl = (name) =>
  techIcons[`../../assets/icons/tech-icons/${name}`] || '';

const ProjectCard = ({
  projectTitle,
  projectCoverImg,
  onClick,
  icons = [],
}) => {
  return (
    <div onClick={onClick} className="project-card">
      <img
        src={'/' + projectCoverImg.replace(/^\/+/, '')}
        alt={projectTitle}
        className="project-card__img"
      />
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

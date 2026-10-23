import React from 'react';
import './ProjectCard.scss';

const ProjectCard = ({
  projectTitle,
  projectCoverImg,
  onClick,
  icons = [],
}) => {
  return (
    <div onClick={onClick} className="project-card">
      <img
        src={projectCoverImg}
        alt={projectTitle}
        className="project-card__img"
      />
      <span className="project-card__title">
        {projectTitle}
        {icons.map((icon, idx) => (
          <img
            key={icon + idx}
            src={
              import.meta.env.BASE_URL + 'src/assets/icons/tech-icons/' + icon
            }
            alt={icon.replace('.svg', '')}
            className="project-card__tech-icon"
          />
        ))}
      </span>
    </div>
  );
};

export default ProjectCard;

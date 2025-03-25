import React from 'react';
import './ProjectCard.scss';

const ProjectCard = ({ projectTitle, projectCoverImg, onClick }) => {
  return (
    <div onClick={onClick} className="project-card">
      <img
        src={projectCoverImg}
        alt={projectTitle}
        className="project-card__img"
      />
      <span className="project-card__title">{projectTitle}</span>
    </div>
  );
};

export default ProjectCard;

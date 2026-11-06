import './ProjectCard.scss';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onViewDetails: () => void;
}

const ProjectCard = ({ project, onViewDetails }: ProjectCardProps) => {
  const cover = project.images[0];

  return (
    <article className="project-card">
      {/* The <article> is the containment context; this inner element is
          what the container query actually styles, because an element can
          never be styled by its own @container rule. */}
      <div className="project-card__layout">
      {cover && (
        <div className="project-card__media">
          <img
            src={'/' + cover.replace(/^\/+/, '')}
            alt=""
            loading="lazy"
            decoding="async"
            className="project-card__img"
          />
        </div>
      )}

      <div className="project-card__body">
        <p className="project-card__period">{project.period}</p>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__tagline">{project.tagline}</p>

        <ul className="project-card__stack" aria-label="Built with">
          {project.stack.map((tech) => (
            <li key={tech} className="project-card__stack-item">
              {tech}
            </li>
          ))}
        </ul>

        <div className="project-card__actions">
          <button type="button" className="btn" onClick={onViewDetails}>
            View details
            <span className="visually-hidden"> for {project.title}</span>
          </button>

          {project.liveUrl && (
            <a
              className="btn btn--ghost"
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live demo
              <span className="visually-hidden">
                {' of ' + project.title + ' (opens in a new tab)'}
              </span>
            </a>
          )}

          <a
            className="btn btn--ghost"
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            Code
            <span className="visually-hidden">
              {' for ' + project.title + ' on GitHub (opens in a new tab)'}
            </span>
          </a>
        </div>
      </div>
      </div>
    </article>
  );
};

export default ProjectCard;

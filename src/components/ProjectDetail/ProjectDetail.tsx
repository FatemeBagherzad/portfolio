import { useEffect, useRef } from 'react';
import './ProjectDetail.scss';
import SwiperComponent from '../SwiperComponent/SwiperComponent';
import type { Project } from '../../types';

interface ProjectDetailProps {
  project: Project;
}

const ProjectDetail = ({ project }: ProjectDetailProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Opening a project replaces the page contents, so move focus to the new
  // heading rather than leaving it on a button that no longer exists.
  useEffect(() => {
    headingRef.current?.focus();
  }, [project.id]);

  return (
    <article className="project-detail">
      <h1 ref={headingRef} tabIndex={-1} className="project-detail__title">
        {project.title}
      </h1>
      <p className="project-detail__period">{project.period}</p>
      <p className="project-detail__tagline">{project.tagline}</p>

      <SwiperComponent project={project} />

      <h2 className="project-detail__subheading">About this project</h2>
      <p className="project-detail__description">{project.description}</p>

      <h2 className="project-detail__subheading">Built with</h2>
      <ul className="project-detail__stack">
        {project.stack.map((tech) => (
          <li key={tech} className="chip">
            {tech}
          </li>
        ))}
      </ul>

      <div className="project-detail__actions">
        {project.liveUrl && (
          <a
            className="btn"
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the live site
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        )}
        <a
          className="btn btn--ghost"
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
        >
          See the GitHub repo
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
};
export default ProjectDetail;

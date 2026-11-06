import './ProjectDetail.scss';
import SwiperComponent from '../SwiperComponent/SwiperComponent';
import type { Project } from '../../types';

interface ProjectDetailProps {
  project: Project;
  onClose?: () => void;
}

const ProjectDetail = ({ project }: ProjectDetailProps) => {
  return (
    <div className="project-detail">
      <h2>{project.title}</h2>
      <SwiperComponent project={project} />

      <a
        href={project.repo}
        target="_blank"
        rel="noopener noreferrer"
        className="project-detail__btn btn"
      >
        See the GitHub repo
        <span className="visually-hidden">
          {` for ${project.title} (opens in a new tab)`}
        </span>
      </a>

      <p className="project-detail__description">{project.description} </p>
    </div>
  );
};
export default ProjectDetail;

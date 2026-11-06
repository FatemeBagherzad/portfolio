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
      <h3>{project.title} </h3>
      <SwiperComponent project={project} />

      <a
        href={project.repo}
        target="_blank"
        className="project-detail__btn btn"
      >
        See the GitHub repo
      </a>

      <p className="project-detail__description">{project.description} </p>
    </div>
  );
};
export default ProjectDetail;

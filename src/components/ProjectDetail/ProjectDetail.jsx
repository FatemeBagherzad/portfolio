import './ProjectDetail.scss';
import SwiperComponent from '../SwiperComponent/SwiperComponent';

const ProjectDetail = ({ project }) => {
  return (
    <div className="project-detail">
      <h2>{project.title} </h2>
      <SwiperComponent project={project} />
      <p className="project-detail__description">{project.description} </p>
    </div>
  );
};
export default ProjectDetail;

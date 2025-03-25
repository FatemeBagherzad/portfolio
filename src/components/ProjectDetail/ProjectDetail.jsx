import './ProjectDetail.scss';
import SwiperComponent from '../SwiperComponent/SwiperComponent';

const ProjectDetail = ({ project }) => {
  return (
    <div className="project-detail">
      <h3>{project.title} </h3>
      <SwiperComponent project={project} />
      <p className="project-detail__description">{project.description} </p>
    </div>
  );
};
export default ProjectDetail;

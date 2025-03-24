import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import './ProjectCard.scss';

const ProjectCard = ({ project, onClick }) => {
  console.log(project.title);
  return (
    <div onClick={onClick} className="project-card">
      <h2>{project.title} </h2>

      {/* <img crs={project.images} /> */}
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        className="project-card__carousel"
      >
        {project.images.map((imgSrc, index) => (
          <SwiperSlide key={index} className="project-card__slide">
            <img
              src={imgSrc}
              alt={`${project.title} ${index}`}
              className="project-card__img"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <p>{project.description} </p>
      <hr />
    </div>
  );
};

export default ProjectCard;

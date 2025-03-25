import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import './SwiperComponent.scss';

const SwiperComponent = ({ project }) => {
  return (
    <div className="swiper">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        className="swiper__carousel"
      >
        {project.images.map((imgSrc, index) => (
          <SwiperSlide key={index} className="swiper__slide">
            <img
              src={imgSrc}
              alt={`${project.title} ${index}`}
              className="swiper__img"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
export default SwiperComponent;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.scss';
import linkedinIcn from '../../assets/icons/linkedin-icon.png';
import githubIcn from '../../assets/icons/github-icon.png';
import fatemeImg1 from '../../assets/fateme-img/fatemeImg1.png';
import fatemeImg2 from '../../assets/fateme-img/fatemeImg2.png';
const resume = '/FatemeBagherzad-SoftwareDeveloper.pdf';

const Hero = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState(50);
  const [textIndex, setTextIndex] = useState(0);

  const texts = [
    'Passionate Software Developer',
    'Located in Toronto, North York',
    'Former Design Lead',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(percent);
  };

  return (
    <div className="hero container">
      <div onMouseMove={handleMouseMove} className="hero__fatemeImgContainer">
        <img
          src={fatemeImg1}
          alt="user photo"
          className="hero__fateme-img hero__fateme-img-right"
          style={{
            clipPath: position < 50 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          }}
        />
        <img
          src={fatemeImg2}
          alt="user photo"
          className="hero__fateme-img hero__fateme-img-left"
          style={{
            clipPath: position >= 50 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          }}
        />
      </div>

      <div className="hero__icon-name-container">
        <a
          href="https://www.linkedin.com/in/fatemeh-bagherzad/"
          target="_blank"
        >
          <img
            src={linkedinIcn}
            alt="linkedin icon"
            className="hero__socialmedia-icon"
          />
        </a>

        <span className="hero__name">Fateme Bagherzad</span>

        <a href="https://github.com/FatemeBagherzad" target="_blank">
          <img
            src={githubIcn}
            alt="github icon"
            className="hero__socialmedia-icon"
          />
        </a>
      </div>

      <span className="hero__animated-text">{texts[textIndex]}</span>

      <div className="hero__info-btns-container">
        <button className="hero__btn btn" onClick={() => navigate('/projects')}>
          My projects
        </button>

        <a href={resume} target="_blank" rel="noopener noreferrer">
          <button className="hero__btn btn">Resume</button>
        </a>

        <button className="hero__btn btn" onClick={() => navigate('/contact')}>
          Contact me
        </button>
      </div>
    </div>
  );
};
export default Hero;

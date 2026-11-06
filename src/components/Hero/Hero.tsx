import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.scss';
import linkedinIcn from '../../assets/icons/linkedin-icon.webp';
import githubIcn from '../../assets/icons/github-icon.webp';
import portraitA300 from '../../assets/fateme-img/fatemeImg1-300.webp';
import portraitA600 from '../../assets/fateme-img/fatemeImg1-600.webp';
import portraitA900 from '../../assets/fateme-img/fatemeImg1-900.webp';
import portraitB300 from '../../assets/fateme-img/fatemeImg2-300.webp';
import portraitB600 from '../../assets/fateme-img/fatemeImg2-600.webp';
import portraitB900 from '../../assets/fateme-img/fatemeImg2-900.webp';

/** The portrait never renders wider than 30rem, so 900w covers a 3x screen. */
const PORTRAIT_SIZES = '(min-width: 48rem) 30rem, 25rem';
const portraitASrcSet = `${portraitA300} 300w, ${portraitA600} 600w, ${portraitA900} 900w`;
const portraitBSrcSet = `${portraitB300} 300w, ${portraitB600} 600w, ${portraitB900} 900w`;

const resume = '/Fatemeh Bagherzad - Full-Stack Developer Resume.pdf';
const email = 'fa.bagherzad@gmail.com';

const texts: readonly string[] = [
  'Passionate Software Developer',
  'Located in Toronto, North York',
  'Former Design Lead',
];

const Hero = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState<number>(50);
  const [textIndex, setTextIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const copyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>): void => {
    const { clientX, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(percent);
  };

  return (
    <div className="hero container">
      <div onMouseMove={handleMouseMove} className="hero__fatemeImgContainer">
        <img
          src={portraitA600}
          srcSet={portraitASrcSet}
          sizes={PORTRAIT_SIZES}
          width={900}
          height={889}
          decoding="async"
          alt="user photo"
          className="hero__fateme-img hero__fateme-img-right"
          style={{
            clipPath: position < 50 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          }}
        />
        <img
          src={portraitB600}
          srcSet={portraitBSrcSet}
          sizes={PORTRAIT_SIZES}
          width={900}
          height={889}
          decoding="async"
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
            width={96}
            height={96}
            className="hero__socialmedia-icon"
          />
        </a>

        <span className="hero__name">Fatemeh Bagherzad</span>

        <a href="https://github.com/FatemeBagherzad" target="_blank">
          <img
            src={githubIcn}
            alt="github icon"
            width={96}
            height={96}
            className="hero__socialmedia-icon"
          />
        </a>
      </div>

      <div className="hero__animated-text-viewport">
        <span className="hero__animated-text">{texts[textIndex]}</span>
      </div>

      <div className="hero__info-btns-container">
        <button className="hero__btn btn" onClick={() => navigate('/projects')}>
          My projects
        </button>

        <a href={resume} target="_blank" rel="noopener noreferrer">
          <button className="hero__btn btn">Resume</button>
        </a>

        <button
          className={`hero__btn btn hero__email-btn${copied ? ' hero__email-btn--copied' : ''}`}
          onClick={copyEmail}
          title="Click to copy my email"
        >
          {copied ? 'Copied!' : email}
        </button>
      </div>
    </div>
  );
};
export default Hero;

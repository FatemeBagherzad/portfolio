import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import './Hero.scss';
import linkedinIcn from '../../assets/icons/linkedin-icon.webp';
import githubIcn from '../../assets/icons/github-icon.webp';
import portraitA300 from '../../assets/fateme-img/fatemeImg1-300.webp';
import portraitA600 from '../../assets/fateme-img/fatemeImg1-600.webp';
import portraitA900 from '../../assets/fateme-img/fatemeImg1-900.webp';
import portraitB300 from '../../assets/fateme-img/fatemeImg2-300.webp';
import portraitB600 from '../../assets/fateme-img/fatemeImg2-600.webp';
import portraitB900 from '../../assets/fateme-img/fatemeImg2-900.webp';

const resume = '/Fatemeh-Bagherzad-Full-Stack-Developer-Resume.pdf';
const email = 'fa.bagherzad@gmail.com';

/** The portrait never renders wider than 30rem, so 900w covers a 3x screen. */
const PORTRAIT_SIZES = '(min-width: 48rem) 30rem, 25rem';
const portraitASrcSet = `${portraitA300} 300w, ${portraitA600} 600w, ${portraitA900} 900w`;
const portraitBSrcSet = `${portraitB300} 300w, ${portraitB600} 600w, ${portraitB900} 900w`;

const STACK = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'AI-directed development',
];

const Hero = () => {
  const [position, setPosition] = useState<number>(50);
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
          alt="Fatemeh Bagherzad"
          className="hero__fateme-img hero__fateme-img-right"
          style={{
            clipPath: position < 50 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          }}
        />
        {/* Second portrait is the pointer-reveal effect only: the same person,
            so announcing it again would just repeat the name. */}
        <img
          src={portraitB600}
          srcSet={portraitBSrcSet}
          sizes={PORTRAIT_SIZES}
          width={900}
          height={889}
          decoding="async"
          alt=""
          aria-hidden="true"
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
          rel="noopener noreferrer"
          aria-label="Fatemeh Bagherzad on LinkedIn (opens in a new tab)"
        >
          <img
            src={linkedinIcn}
            alt=""
            width={96}
            height={96}
            className="hero__socialmedia-icon"
          />
        </a>

        <h1 className="hero__name">Fatemeh Bagherzad</h1>

        <a
          href="https://github.com/FatemeBagherzad"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fatemeh Bagherzad on GitHub (opens in a new tab)"
        >
          <img
            src={githubIcn}
            alt=""
            width={96}
            height={96}
            className="hero__socialmedia-icon"
          />
        </a>
      </div>

      <p className="hero__role">Full-Stack Developer</p>

      <ul className="hero__stack" aria-label="Core technologies">
        {STACK.map((tech) => (
          <li key={tech} className="hero__stack-item">
            {tech}
          </li>
        ))}
      </ul>

      <p className="hero__pitch">
        I build complex interactive interfaces — multilingual, right-to-left,
        accessible, mobile-first — and design the APIs and data models behind
        them.
      </p>

      <p className="hero__meta">
        Toronto, ON · Open to full-time front-end or full-stack roles
      </p>

      <div className="hero__info-btns-container">
        <Link className="hero__btn btn" to="/projects">
          My projects
        </Link>

        <a
          className="hero__btn btn"
          href={resume}
          target="_blank"
          rel="noopener noreferrer"
        >
          Resume
          <span className="visually-hidden"> (PDF, opens in a new tab)</span>
        </a>

        <button
          type="button"
          className={`hero__btn btn hero__email-btn${copied ? ' hero__email-btn--copied' : ''}`}
          onClick={copyEmail}
          aria-label={`Copy my email address, ${email}, to the clipboard`}
        >
          {copied ? 'Copied!' : email}
        </button>

        {/* Announces the copy result, which is otherwise a silent visual change. */}
        <p className="visually-hidden" role="status">
          {copied ? 'Email address copied to clipboard' : ''}
        </p>
      </div>
    </div>
  );
};
export default Hero;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Hero.scss';
import CanvasField from '../CanvasField/CanvasField';
import CompareSlider from '../CompareSlider/CompareSlider';
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

const PORTRAIT_SIZES = '(min-width: 64rem) 38rem, (min-width: 48rem) 30rem, 62vw';
const portraitA = {
  src: portraitA600,
  srcSet: portraitA300 + ' 300w, ' + portraitA600 + ' 600w, ' + portraitA900 + ' 900w',
  alt: '',
};
const portraitB = {
  src: portraitB600,
  srcSet: portraitB300 + ' 300w, ' + portraitB600 + ' 600w, ' + portraitB900 + ' 900w',
  alt: 'Fatemeh Bagherzad',
};

const STACK = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'AI-directed development',
];

const Hero = () => {
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

  return (
    <section className="hero">
      <CanvasField />

      <div className="hero__inner container">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">
            Full-stack developer
            <span className="hero__dot" aria-hidden="true" />
            Toronto, ON
          </p>

          <h1 className="hero__name">
            Fatemeh
            <span className="hero__name-line">Bagherzad</span>
          </h1>

          <p className="hero__pitch">
            I build complex interactive interfaces — multilingual,
            right-to-left, accessible, mobile-first — and design the APIs and
            data models behind them.
          </p>

          <ul className="hero__stack" aria-label="Core technologies">
            {STACK.map((tech) => (
              <li key={tech} className="hero__stack-item">
                {tech}
              </li>
            ))}
          </ul>

          <div className="hero__actions">
            <Link className="btn" to="/projects">
              See my work
            </Link>

            <a
              className="btn btn--ghost"
              href={resume}
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
              <span className="visually-hidden"> (PDF, opens in a new tab)</span>
            </a>

            <button
              type="button"
              className={
                'btn btn--quiet hero__email' +
                (copied ? ' hero__email--copied' : '')
              }
              onClick={copyEmail}
              aria-label={'Copy my email address, ' + email + ', to the clipboard'}
            >
              {copied ? 'Copied' : email}
            </button>

            {/* Announces the copy, which is otherwise a silent visual change. */}
            <p className="visually-hidden" role="status">
              {copied ? 'Email address copied to clipboard' : ''}
            </p>
          </div>

          <ul className="hero__socials">
            <li>
              <a
                className="hero__social"
                href="https://www.linkedin.com/in/fatemeh-bagherzad/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fatemeh Bagherzad on LinkedIn (opens in a new tab)"
              >
                <img src={linkedinIcn} alt="" width={96} height={96} />
              </a>
            </li>
            <li>
              <a
                className="hero__social hero__social--invert-on-dark"
                href="https://github.com/FatemeBagherzad"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fatemeh Bagherzad on GitHub (opens in a new tab)"
              >
                <img src={githubIcn} alt="" width={96} height={96} />
              </a>
            </li>
          </ul>
        </div>

        <div className="hero__visual">
          <CompareSlider
            before={portraitA}
            after={portraitB}
            sizes={PORTRAIT_SIZES}
            width={900}
            height={889}
            label="Drag, or use the arrow keys, to wipe between two portraits"
            initial={64}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;

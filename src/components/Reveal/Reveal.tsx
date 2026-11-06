import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './Reveal.scss';

interface RevealProps {
  children: ReactNode;
  /** Staggers siblings. Multiplied by 60ms, capped so a long list never crawls. */
  order?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}

/**
 * Reveals its children once, as they scroll into view.
 *
 * Two deliberate choices:
 *
 * - it unobserves after the first reveal. A reveal that replays every time
 *   you scroll past is a nuisance on a page people scroll up and down.
 * - the hidden state is applied from JavaScript, not from the stylesheet.
 *   If CSS hid it and the script failed, the content would be invisible
 *   forever; this way the worst case is that it appears without animating.
 */
const Reveal = ({ children, order = 0, className, as = 'div' }: RevealProps) => {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState<boolean>(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Anything already on screen at mount should not animate in.
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // Starts slightly before the element reaches the fold, so it has
      // finished by the time it is properly in view.
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  const delay = Math.min(order, 8) * 60;

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={
        'reveal' + (shown ? ' reveal--shown' : '') + (className ? ' ' + className : '')
      }
      style={{ transitionDelay: String(delay) + 'ms' }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;

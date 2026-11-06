import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import './TiltCard.scss';
import { useIsTouch, usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on each axis. */
  max?: number;
}

/**
 * Tilts towards the pointer, with a highlight that tracks it.
 *
 * Three things keep this from being the usual gimmick:
 *
 * - it is off entirely on touch devices and under reduced motion. A tilt
 *   driven by a pointer that does not hover is meaningless, and the
 *   rotation is exactly the kind of movement reduced motion rules out.
 * - the transform is written to CSS custom properties inside a single
 *   requestAnimationFrame, not applied per pointer event. Pointer events
 *   fire far more often than the screen refreshes.
 * - the transition is removed while tracking and restored on leave, so the
 *   card follows the pointer exactly but still springs back smoothly.
 *
 * It decorates a card whose content is already interactive on its own, so
 * it adds no keyboard or screen-reader surface of its own.
 */
const TiltCard = ({ children, className, max = 7 }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const [tracking, setTracking] = useState<boolean>(false);

  const isTouch = useIsTouch();
  const prefersReducedMotion = usePrefersReducedMotion();
  const enabled = !isTouch && !prefersReducedMotion;

  const handleMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const node = ref.current;
      if (!node) return;

      const { clientX, clientY } = event;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // -0.5 .. 0.5 from the centre of the card.
        const px = (clientX - rect.left) / rect.width - 0.5;
        const py = (clientY - rect.top) / rect.height - 0.5;

        node.style.setProperty('--tilt-y', String(px * max * 2) + 'deg');
        node.style.setProperty('--tilt-x', String(-py * max * 2) + 'deg');
        node.style.setProperty('--glare-x', String((px + 0.5) * 100) + '%');
        node.style.setProperty('--glare-y', String((py + 0.5) * 100) + '%');
      });
    },
    [max]
  );

  const reset = useCallback((): void => {
    cancelAnimationFrame(frameRef.current);
    setTracking(false);
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  }, []);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={
        'tilt' + (tracking ? ' tilt--tracking' : '') + (className ? ' ' + className : '')
      }
      onPointerEnter={() => setTracking(true)}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <div className="tilt__inner">{children}</div>
      <span className="tilt__glare" aria-hidden="true" />
    </div>
  );
};

export default TiltCard;

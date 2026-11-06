import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import './CompareSlider.scss';

interface CompareImage {
  src: string;
  srcSet: string;
  alt: string;
}

interface CompareSliderProps {
  /** Shown on the left of the divider. */
  before: CompareImage;
  /** Shown on the right of the divider. */
  after: CompareImage;
  sizes: string;
  width: number;
  height: number;
  label: string;
  /** Starting divider position, 0-100. */
  initial?: number;
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

/**
 * A two-image comparison slider.
 *
 * The usual version of this is a mousemove listener and nothing else, which
 * leaves it unusable by keyboard and jumpy on touch. This one:
 *
 * - is a real `role="slider"` with aria-valuenow/min/max, so assistive tech
 *   announces it as the control it behaves like
 * - responds to arrow keys, Home and End, with a larger step on PageUp/Down
 * - uses pointer events with setPointerCapture, so a drag that leaves the
 *   element keeps tracking instead of sticking
 * - has a 44px grab area on a 2px visual divider
 * - sets touch-action so a horizontal drag does not also scroll the page
 */
const CompareSlider = ({
  before,
  after,
  sizes,
  width,
  height,
  label,
  initial = 50,
}: CompareSliderProps) => {
  const [position, setPosition] = useState<number>(initial);
  const [dragging, setDragging] = useState<boolean>(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const positionFromClientX = useCallback((clientX: number): number => {
    const frame = frameRef.current;
    if (!frame) return 50;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return 50;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    // Capturing means the drag survives the pointer leaving the element,
    // which is the difference between this feeling solid and feeling broken.
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setPosition(positionFromClientX(event.clientX));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    setPosition(positionFromClientX(event.clientX));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const steps: Record<string, number> = {
      ArrowLeft: -2,
      ArrowRight: 2,
      ArrowDown: -2,
      ArrowUp: 2,
      PageDown: -10,
      PageUp: 10,
    };
    const step = steps[event.key];

    if (step !== undefined) {
      event.preventDefault();
      setPosition((current) => clamp(current + step));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      className={'compare' + (dragging ? ' compare--dragging' : '')}
      ref={frameRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span id={labelId} className="visually-hidden">
        {label}
      </span>

      <img
        className="compare__img"
        src={after.src}
        srcSet={after.srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={after.alt}
        decoding="async"
      />

      {/* The second image is the same person, so repeating the name would
          only add noise for a screen reader. */}
      <img
        className="compare__img compare__img--top"
        src={before.src}
        srcSet={before.srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{ clipPath: 'inset(0 ' + String(100 - position) + '% 0 0)' }}
      />

      <div
        className="compare__handle"
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={Math.round(position) + ' percent'}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        style={{ left: String(position) + '%' }}
      >
        <span className="compare__grip" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
            <path
              d="M9 6 4 12l5 6M15 6l5 6-5 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default CompareSlider;

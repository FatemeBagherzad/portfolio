import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import './NavDrawer.scss';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  id: string;
  title: string;
  children: ReactNode;
}

/** Past this many pixels to the right, releasing dismisses. */
const DISMISS_DISTANCE = 90;
/** Or past this speed, in px/ms, however far it travelled. */
const DISMISS_VELOCITY = 0.5;

/**
 * The mobile navigation: a panel anchored to the right edge, full height and
 * part width, with swipe-to-dismiss.
 *
 * The drag is the fiddly part:
 *
 * - pointer capture, so a drag that leaves the handle keeps tracking rather
 *   than sticking half-open
 * - `touch-action: none` on the handle alone, so the swipe is not also read
 *   as a page scroll, while the links inside stay scrollable
 * - velocity as well as distance, so a quick flick closes it even if it
 *   barely moved — that is what makes it feel native rather than sticky
 * - the transition is dropped while dragging and restored on release, so it
 *   tracks the finger exactly and still springs back
 * - resistance when dragged the wrong way, so it cannot be pulled off its
 *   own edge
 *
 * It is a real modal: focus is trapped, Escape closes it, focus returns to
 * whatever opened it, and the page behind cannot scroll. Because it covers
 * the header at full height, it carries its own close button — the menu
 * button that opened it is underneath.
 */
const NavDrawer = ({ open, onClose, id, title, children }: NavDrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; time: number } | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    setOffset(0);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture can be refused if the pointer has already gone. The drag
      // still works without it; it just stops tracking outside the handle,
      // which beats the handler throwing and the panel jamming.
    }
    dragStart.current = { x: event.clientX, time: performance.now() };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = dragStart.current;
    if (!start) return;
    const delta = event.clientX - start.x;
    // Rubber-banding inward: the panel resists rather than leaving its edge.
    setOffset(delta < 0 ? delta / 4 : delta);
  };

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const start = dragStart.current;
      dragStart.current = null;
      setDragging(false);

      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Already released; nothing to undo.
      }
      if (!start) return;

      const delta = event.clientX - start.x;
      const elapsed = Math.max(performance.now() - start.time, 1);
      const velocity = delta / elapsed;

      if (delta > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        onClose();
        return;
      }
      setOffset(0);
    },
    [onClose]
  );

  if (!open) return null;

  // Portalled to <body> deliberately. The header carries a backdrop-filter,
  // and a filtered element becomes the containing block for its
  // position: fixed descendants — rendered inside the header the panel
  // would be trapped inside the 56px bar.
  return createPortal(
    <div className="drawer" role="presentation">
      <div className="drawer__backdrop" onClick={onClose} role="presentation" />

      <div
        id={id}
        ref={panelRef}
        className={'drawer__panel' + (dragging ? ' drawer__panel--dragging' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          prefersReducedMotion
            ? undefined
            : { transform: 'translateX(' + String(offset) + 'px)' }
        }
      >
        {/* The grab strip runs down the panel's inner edge. It is not a
            focus stop: Escape and the close button already cover the
            keyboard path, so adding a draggable control to the tab order
            would only add noise. */}
        <div
          className="drawer__grab"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-hidden="true"
        >
          <span className="drawer__grab-bar" />
        </div>

        {/* Everything except the grab strip. Keeping them as siblings in a
            row means the gutter is one padding on this element, instead of
            each child hand-padding itself clear of the strip. */}
        <div className="drawer__body">
          <div className="drawer__head">
            <p className="drawer__title">{title}</p>
            <button
              type="button"
              className="drawer__close"
              onClick={onClose}
              aria-label="Close the menu"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="drawer__content">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NavDrawer;

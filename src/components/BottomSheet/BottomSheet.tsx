import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import './BottomSheet.scss';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  id: string;
  title: string;
  children: ReactNode;
}

/** Past this many pixels, releasing dismisses rather than springs back. */
const DISMISS_DISTANCE = 110;
/** Or past this speed, in px/ms, regardless of how far it travelled. */
const DISMISS_VELOCITY = 0.55;

/**
 * A bottom sheet with drag-to-dismiss, which is what a phone menu should be:
 * reachable with a thumb rather than pinned to the top corner.
 *
 * The drag is the fiddly part and most of the care is in it:
 *
 * - pointer capture, so a drag that leaves the handle keeps tracking instead
 *   of sticking half-open
 * - `touch-action: none` on the handle only, so dragging the sheet does not
 *   also scroll the page, while the content inside stays scrollable
 * - velocity as well as distance: a quick flick dismisses even if it barely
 *   moved, which is what makes it feel native rather than sticky
 * - the transition is removed while dragging and restored on release, so the
 *   sheet tracks the finger exactly and still springs
 * - resistance past the top, so dragging upward does not detach it
 *
 * It is a real modal: focus is trapped, Escape closes it, focus returns to
 * whatever opened it, and the page behind cannot scroll.
 */
const BottomSheet = ({
  open,
  onClose,
  id,
  title,
  children,
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useFocusTrap(sheetRef, open);

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
      // Capture can be refused if the pointer is already gone. The drag
      // still works without it; it just stops tracking outside the handle,
      // which is better than the handler throwing and the sheet jamming.
    }
    dragStart.current = { y: event.clientY, time: performance.now() };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = dragStart.current;
    if (!start) return;
    const delta = event.clientY - start.y;
    // Rubber-banding upward: the sheet resists rather than detaching.
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

      const delta = event.clientY - start.y;
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
  // position: fixed descendants — rendering the sheet inside the header
  // would trap it inside the 56px bar instead of covering the viewport.
  return createPortal(
    <div className="sheet" role="presentation">
      <div
        className="sheet__backdrop"
        onClick={onClose}
        role="presentation"
      />

      <div
        id={id}
        ref={sheetRef}
        className={'sheet__panel' + (dragging ? ' sheet__panel--dragging' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          prefersReducedMotion
            ? undefined
            : { transform: 'translateY(' + String(offset) + 'px)' }
        }
      >
        {/* The grab area. It is deliberately a generous strip rather than
            the thin visual bar, and it is not a focus stop: Escape and the
            close button already cover the keyboard path, so adding a
            draggable control to the tab order would only add noise. */}
        <div
          className="sheet__grab"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-hidden="true"
        >
          <span className="sheet__grab-bar" />
        </div>

        <div className="sheet__content">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;

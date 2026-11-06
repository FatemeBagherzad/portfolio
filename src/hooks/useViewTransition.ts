import { useCallback } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery';

export interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

export type ViewTransitionDocument = Document & {
  startViewTransition?: (
    callback: () => void | Promise<void>
  ) => ViewTransition;
};

/**
 * True when the browser can run a View Transition and the visitor has not
 * asked for reduced motion.
 *
 * Both halves matter. `document.startViewTransition` is still missing in
 * Firefox and older Safari, so calling it unguarded throws; and a cross-fade
 * of the entire page is exactly the kind of movement reduced motion is
 * asking us not to make.
 */
export const useCanViewTransition = (): boolean => {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    !prefersReducedMotion &&
    typeof (document as ViewTransitionDocument).startViewTransition ===
      'function'
  );
};

/**
 * Runs a DOM update inside a View Transition where one is available, and
 * plainly where it is not. The update always happens — the transition is
 * decoration on top of it, never a prerequisite.
 */
export const useViewTransition = () => {
  const canTransition = useCanViewTransition();

  return useCallback(
    (update: () => void): void => {
      const doc = document as ViewTransitionDocument;
      if (!canTransition || !doc.startViewTransition) {
        update();
        return;
      }
      doc.startViewTransition(update);
    },
    [canTransition]
  );
};

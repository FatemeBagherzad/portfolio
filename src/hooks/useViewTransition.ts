import { useCallback } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery';

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

/**
 * Runs a DOM update inside a View Transition when the browser supports one.
 *
 * Feature detection matters here: `document.startViewTransition` is missing
 * in Firefox and older Safari, and calling it blindly throws. Reduced motion
 * also opts out, because a cross-fade of the whole page is exactly the kind
 * of movement the setting is asking us not to make.
 *
 * The update always runs — the transition is decoration on top of it, never
 * a prerequisite.
 */
export const useViewTransition = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return useCallback(
    (update: () => void): void => {
      const doc = document as ViewTransitionCapableDocument;
      if (prefersReducedMotion || typeof doc.startViewTransition !== 'function') {
        update();
        return;
      }
      doc.startViewTransition(update);
    },
    [prefersReducedMotion]
  );
};

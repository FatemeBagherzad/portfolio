import { useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { themeStore } from '../store/themeStore';
import {
  useCanViewTransition,
  type ViewTransitionDocument,
} from './useViewTransition';

interface Origin {
  x: number;
  y: number;
}

/**
 * Toggles the theme, revealing the new one with a circle growing from
 * `origin` — so the change visibly comes from the control that was pressed
 * rather than just happening to the page.
 *
 * Falls back to an instant swap wherever View Transitions are unavailable
 * or reduced motion is set. The theme always changes either way.
 */
export const useThemeTransition = () => {
  const canTransition = useCanViewTransition();

  return useCallback(
    (origin?: Origin): void => {
      const doc = document as ViewTransitionDocument;

      if (!canTransition || !doc.startViewTransition) {
        themeStore.toggle();
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      // Reach the furthest corner, or the circle stops short of one.
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const root = document.documentElement;
      // Scopes the CSS that suppresses the default cross-fade, so route
      // transitions keep theirs.
      root.dataset['vt'] = 'theme';

      const transition = doc.startViewTransition(() => {
        // Without flushSync the DOM would not have changed by the time
        // startViewTransition takes its second snapshot, and nothing would
        // animate.
        flushSync(() => {
          themeStore.toggle();
        });
      });

      void transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [
                'circle(0px at ' + String(x) + 'px ' + String(y) + 'px)',
                'circle(' +
                  String(radius) +
                  'px at ' +
                  String(x) +
                  'px ' +
                  String(y) +
                  'px)',
              ],
            },
            {
              duration: 520,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          // A skipped or interrupted transition is not worth surfacing;
          // the theme has already changed.
        });

      void transition.finished.finally(() => {
        delete root.dataset['vt'];
      });
    },
    [canTransition]
  );
};

/**
 * Follows the operating system's colour scheme until the visitor has made an
 * explicit choice of their own, after which their choice wins permanently.
 */
export const useSystemThemeSync = (): void => {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent): void => {
      if (themeStore.hasExplicitChoice()) return;
      themeStore.follow(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);
};

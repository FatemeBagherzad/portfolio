import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the media
 * query is external state React does not own, and reading it in an effect
 * means the first paint renders with the wrong answer and then corrects
 * itself. This reads it during render and cannot tear when React yields
 * between components in a concurrent render.
 *
 * `getServerSnapshot` returns `false` so a server render never assumes a
 * browser capability it cannot know about.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onStoreChange);
      return () => list.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/** True when the visitor has asked their system to reduce motion. */
export const usePrefersReducedMotion = (): boolean =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

/** True on a device whose primary input cannot hover (phones, tablets). */
export const useIsTouch = (): boolean =>
  useMediaQuery('(hover: none) and (pointer: coarse)');

/** True from the tablet breakpoint up. */
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 48rem)');

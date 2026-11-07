import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Theme as an external store rather than React state.
 *
 * The header toggle reads and writes it, and the real source of truth is the
 * `data-theme` attribute that the inline script in index.html sets before
 * React has run at all — which is what stops the page flashing the wrong
 * theme on first paint. Lifting the value into
 * component state would mean either prop drilling or a context that re-renders
 * the whole tree; an external store read through `useSyncExternalStore` keeps
 * one source of truth and cannot tear between consumers mid-render.
 *
 * Dark is the default everywhere below: every read treats anything that is
 * not an explicit `light` as dark, so a missing attribute, a refused
 * `localStorage` and a server render all agree with the stylesheet.
 */

const readApplied = (): Theme =>
  document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';

let current: Theme = typeof document === 'undefined' ? 'dark' : readApplied();

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) listener();
};

const apply = (next: Theme): void => {
  current = next;
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing can refuse storage. The theme still applies for
    // this visit, it just will not be remembered.
  }
  emit();
};

export const themeStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): Theme {
    return current;
  },
  set(next: Theme): void {
    apply(next);
  },
  toggle(): Theme {
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    apply(next);
    return next;
  },
  /** What a toggle would switch to, without switching to it. */
  nextTheme(): Theme {
    return current === 'dark' ? 'light' : 'dark';
  },
  /**
   * Records the choice without touching the page.
   *
   * The toggle applies the theme inside a View Transition, and the browser
   * defers that callback until it has captured the outgoing snapshot — so
   * the write would land a frame or more after the click. Reloading in that
   * window used to lose the choice entirely. Remembering it up front, and
   * animating afterwards, keeps the decision and the animation independent.
   */
  remember(next: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing refuses storage; the theme still applies today.
    }
  },
};

export const useTheme = (): Theme =>
  useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    () => 'dark' as Theme
  );

import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Theme as an external store rather than React state.
 *
 * Two things read and write it — the header toggle and the command palette —
 * and the real source of truth is the `data-theme` attribute that the inline
 * script in index.html sets before React has run at all. Lifting it into
 * component state would mean either prop drilling or a context that re-renders
 * the whole tree; an external store read through `useSyncExternalStore` keeps
 * one source of truth and cannot tear between consumers mid-render.
 */

const readApplied = (): Theme =>
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';

let current: Theme = typeof document === 'undefined' ? 'light' : readApplied();

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) listener();
};

const apply = (next: Theme, persist: boolean): void => {
  current = next;
  document.documentElement.setAttribute('data-theme', next);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse storage. The theme still applies for
      // this visit, it just will not be remembered.
    }
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
    apply(next, true);
  },
  toggle(): Theme {
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    apply(next, true);
    return next;
  },
  /** Used by the system-preference listener: follows without persisting. */
  follow(next: Theme): void {
    apply(next, false);
  },
  hasExplicitChoice(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },
};

export const useTheme = (): Theme =>
  useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    () => 'light' as Theme
  );

import { useSyncExternalStore } from 'react';

/**
 * Open state for the command palette, kept outside React.
 *
 * The palette is opened from three places — a global key handler, the header
 * button, and the mobile sheet — none of which share a sensible common
 * ancestor to own the state. An external store avoids both prop drilling and
 * a context provider that would re-render the whole tree on every toggle.
 */

let open = false;
const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) listener();
};

const set = (next: boolean): void => {
  if (open === next) return;
  open = next;
  emit();
};

export const paletteStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): boolean {
    return open;
  },
  open(): void {
    set(true);
  },
  close(): void {
    set(false);
  },
  toggle(): void {
    set(!open);
  },
};

export const usePaletteOpen = (): boolean =>
  useSyncExternalStore(
    paletteStore.subscribe,
    paletteStore.getSnapshot,
    () => false
  );

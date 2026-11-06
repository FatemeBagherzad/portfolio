import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps Tab inside `containerRef` while `active`, and restores focus to
 * whatever was focused before it opened.
 *
 * Without this, tabbing out of an open dialog lands on the page behind it:
 * a sighted mouse user never notices, and a keyboard user is lost.
 *
 * The focusable set is recomputed on each Tab rather than cached, because
 * the contents of a palette or sheet change as the user types.
 */
export const useFocusTrap = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean
): void => {
  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusFirst = (): void => {
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus();
    };
    focusFirst();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      const activeEl = document.activeElement;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef]);
};

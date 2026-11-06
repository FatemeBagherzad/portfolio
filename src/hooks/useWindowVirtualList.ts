import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface VirtualItem {
  index: number;
  /** Offset from the top of the list, in pixels. */
  start: number;
  height: number;
}

export interface VirtualWindow {
  items: VirtualItem[];
  totalHeight: number;
  /** Attach to each rendered row so its real height replaces the estimate. */
  measureRef: (index: number) => (node: HTMLElement | null) => void;
}

/**
 * Windowing against the page scroll, with dynamically measured row heights.
 *
 * Most virtual list implementations assume a fixed row height, which is fine
 * for a table and wrong for prose: these cards are between two and eight
 * lines depending on the text and the viewport width. So rows start at an
 * estimate, report their real height through a ResizeObserver, and the
 * offset table is rebuilt from what was actually measured.
 *
 * It scrolls the window rather than an inner container, because a list that
 * owns its own scrollbar inside a page breaks the browser's find-in-page,
 * scroll restoration and the usual momentum behaviour on a phone.
 *
 * Reads are batched into a single animation frame: a scroll handler that
 * calls setState directly fires far more often than the screen refreshes.
 */
export const useWindowVirtualList = (
  containerRef: RefObject<HTMLElement | null>,
  count: number,
  estimateHeight: number,
  overscan = 4
): VirtualWindow => {
  const [measured, setMeasured] = useState<ReadonlyMap<number, number>>(
    () => new Map()
  );
  const [tick, setTick] = useState<number>(0);
  const observersRef = useRef<Map<number, ResizeObserver>>(new Map());
  const frameRef = useRef<number>(0);

  // Prefix sums, so the offset of any row is a lookup rather than a loop.
  const offsets = useMemo<number[]>(() => {
    const result: number[] = new Array<number>(count + 1);
    result[0] = 0;
    for (let i = 0; i < count; i += 1) {
      const previous = result[i] ?? 0;
      result[i + 1] = previous + (measured.get(i) ?? estimateHeight);
    }
    return result;
  }, [count, measured, estimateHeight]);

  const totalHeight = offsets[count] ?? 0;

  /** First index whose end is past `target`. */
  const findIndex = useCallback(
    (target: number): number => {
      let low = 0;
      let high = count;
      while (low < high) {
        const mid = (low + high) >> 1;
        if ((offsets[mid + 1] ?? 0) <= target) low = mid + 1;
        else high = mid;
      }
      return Math.min(low, Math.max(0, count - 1));
    },
    [count, offsets]
  );

  // Recompute on scroll and resize, once per frame.
  useEffect(() => {
    const schedule = (): void => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setTick((value) => value + 1);
      });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const items = useMemo<VirtualItem[]>(() => {
    // `tick` is the dependency that makes this recompute on scroll; the
    // values it depends on are read from the DOM, not from React state.
    void tick;
    if (count === 0) return [];

    const container = containerRef.current;
    const containerTop = container
      ? container.getBoundingClientRect().top + window.scrollY
      : 0;

    const viewportTop = window.scrollY - containerTop;
    const viewportBottom = viewportTop + window.innerHeight;

    const first = Math.max(0, findIndex(viewportTop) - overscan);
    const last = Math.min(count - 1, findIndex(viewportBottom) + overscan);

    const result: VirtualItem[] = [];
    for (let index = first; index <= last; index += 1) {
      result.push({
        index,
        start: offsets[index] ?? 0,
        height: measured.get(index) ?? estimateHeight,
      });
    }
    return result;
  }, [
    containerRef,
    count,
    estimateHeight,
    findIndex,
    measured,
    offsets,
    overscan,
    tick,
  ]);

  const measureRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      const observers = observersRef.current;

      const existing = observers.get(index);
      if (existing) {
        existing.disconnect();
        observers.delete(index);
      }
      if (!node) return;

      const observer = new ResizeObserver(() => {
        const height = node.getBoundingClientRect().height;
        if (height === 0) return;
        setMeasured((current) => {
          // Sub-pixel noise from a reflow would otherwise loop forever.
          if (Math.abs((current.get(index) ?? -1) - height) < 0.5) return current;
          const next = new Map(current);
          next.set(index, height);
          return next;
        });
      });
      observer.observe(node);
      observers.set(index, observer);
    },
    []
  );

  // Row identity changes when the list is filtered, so stale measurements
  // would describe rows that are no longer there.
  useEffect(() => {
    setMeasured(new Map());
  }, [count]);

  useEffect(() => {
    const observers = observersRef.current;
    return () => {
      for (const observer of observers.values()) observer.disconnect();
      observers.clear();
    };
  }, []);

  return { items, totalHeight, measureRef };
};

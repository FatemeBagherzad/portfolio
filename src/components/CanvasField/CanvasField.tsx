import { useEffect, useRef } from 'react';
import './CanvasField.scss';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  /** Per-particle speed, so the field does not look like one moving sheet. */
  speed: number;
}

interface FieldColors {
  ink: string;
  accent: string;
  alpha: number;
}

/** Reads the palette from CSS custom properties so the field follows the theme. */
const readColors = (el: HTMLElement): FieldColors => {
  const styles = getComputedStyle(el);
  return {
    ink: styles.getPropertyValue('--field-ink').trim() || '11, 11, 15',
    accent: styles.getPropertyValue('--field-accent').trim() || '148, 47, 103',
    alpha: Number(styles.getPropertyValue('--field-alpha')) || 0.5,
  };
};

/**
 * Layered sines standing in for noise. A real simplex implementation would be
 * a dependency and a few hundred lines for a difference nobody would spot at
 * this scale; three offset waves already read as organic.
 */
const fieldAngle = (x: number, y: number, t: number): number =>
  (Math.sin(x * 0.0022 + t) +
    Math.cos(y * 0.0025 - t * 0.8) +
    Math.sin((x + y) * 0.0012 + t * 0.4)) *
  1.4;

/**
 * A generative flow field behind the hero.
 *
 * The interesting part is not the maths. It is everything that stops a canvas
 * animation from becoming a battery and jank problem:
 *
 * - the backing store is scaled to devicePixelRatio, capped at 2, because a
 *   3x phone would push 9x the pixels for no visible gain
 * - ResizeObserver rather than a window resize listener, so it tracks its own
 *   box and not the viewport
 * - the loop stops completely when the tab is hidden or the canvas scrolls out
 *   of view, instead of burning frames nobody sees
 * - particle count is derived from area, so a phone never runs a desktop budget
 * - reduced motion renders one static frame and never starts a loop at all
 * - pointer input is passive and applied once per frame, not per event
 */
const CanvasField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let colors = readColors(document.documentElement);
    let frame = 0;
    let time = 0;
    let running = false;
    let onScreen = true;

    // Pointer state, applied once per frame rather than once per event.
    const pointer = { x: -9999, y: -9999, active: false };

    const seed = (): void => {
      const area = width * height;
      // Roughly one particle per 5,000 css px, clamped at both ends.
      const count = Math.max(90, Math.min(620, Math.round(area / 5000)));
      particles = Array.from({ length: count }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return { x, y, px: x, py: y, speed: 0.45 + Math.random() * 1.15 };
      });
    };

    const resize = (): void => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = String(width) + 'px';
      canvas.style.height = String(height) + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      seed();
    };

    const step = (p: Particle, dt: number): void => {
      p.px = p.x;
      p.py = p.y;

      let angle = fieldAngle(p.x, p.y, time);

      // Pointer repulsion, falling off smoothly with distance.
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        const radius = 150;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 1;
          const falloff = 1 - dist / radius;
          const force = falloff * falloff;
          angle = Math.atan2(dy, dx) * force + angle * (1 - force);
          p.x += (dx / dist) * force * 2.4 * dt;
          p.y += (dy / dist) * force * 2.4 * dt;
        }
      }

      p.x += Math.cos(angle) * p.speed * dt;
      p.y += Math.sin(angle) * p.speed * dt;

      // Wrap at the edges. The previous point has to move too, or the
      // particle draws a line straight across the canvas as it wraps.
      if (p.x < -4) {
        p.x = width + 4;
        p.px = p.x;
      } else if (p.x > width + 4) {
        p.x = -4;
        p.px = p.x;
      }
      if (p.y < -4) {
        p.y = height + 4;
        p.py = p.y;
      } else if (p.y > height + 4) {
        p.y = -4;
        p.py = p.y;
      }
    };

    const paint = (): void => {
      // Fading what is already there, rather than clearing it, is what turns
      // moving points into trails. destination-out erases by alpha, so the
      // canvas stays transparent over the page background.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      ctx.lineCap = 'round';
      for (const p of particles) {
        const nearPointer =
          pointer.active &&
          Math.abs(p.x - pointer.x) < 150 &&
          Math.abs(p.y - pointer.y) < 150;

        const rgb = nearPointer ? colors.accent : colors.ink;
        const alpha = nearPointer ? colors.alpha : colors.alpha * 0.6;
        ctx.strokeStyle = 'rgba(' + rgb + ', ' + String(alpha) + ')';
        ctx.lineWidth = nearPointer ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    };

    let last = performance.now();
    const loop = (now: number): void => {
      // Normalised against 60fps, so the field drifts at the same speed on a
      // 120Hz screen as on a 60Hz one.
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      time += 0.0016 * dt;
      for (const p of particles) step(p, dt);
      paint();
      frame = requestAnimationFrame(loop);
    };

    const start = (): void => {
      if (running || prefersReducedMotion) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    const stop = (): void => {
      running = false;
      cancelAnimationFrame(frame);
    };

    // One static frame for visitors who asked for reduced motion: the
    // composition is still there, nothing moves.
    const renderStatic = (): void => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(' + colors.ink + ', ' + String(colors.alpha * 0.4) + ')';
      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, 0);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(angle) * 9, p.y + Math.sin(angle) * 9);
        ctx.stroke();
      }
    };

    resize();
    if (prefersReducedMotion) renderStatic();
    else start();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) renderStatic();
    });
    resizeObserver.observe(wrap);

    // Stop when scrolled away. On a long page that is most of the time.
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(wrap);

    const handleVisibility = (): void => {
      if (document.hidden || !onScreen) stop();
      else start();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handlePointerMove = (event: PointerEvent): void => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const handlePointerLeave = (): void => {
      pointer.active = false;
    };
    // Passive: this listener never calls preventDefault, and saying so lets
    // the browser keep scrolling off the main thread.
    wrap.addEventListener('pointermove', handlePointerMove, { passive: true });
    wrap.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });

    // Re-read the palette when the theme changes, rather than calling
    // getComputedStyle sixty times a second.
    const themeObserver = new MutationObserver(() => {
      colors = readColors(document.documentElement);
      if (prefersReducedMotion) renderStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      wrap.removeEventListener('pointermove', handlePointerMove);
      wrap.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="canvas-field" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="canvas-field__canvas" />
    </div>
  );
};

export default CanvasField;

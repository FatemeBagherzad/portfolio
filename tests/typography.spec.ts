import { expect, test } from '@playwright/test';
import { ROUTES, VIEWPORTS } from './routes';
import { settleAnimations } from './settle';

/**
 * The readability floor, as a test.
 *
 * The scale used to bottom out at 11px with body text at 14.5px. That is
 * legible in a screenshot on a desktop and hard work on a phone, which is
 * the only device most people will ever see this site on. These are the
 * numbers the tokens now guarantee, checked on the rendered page rather
 * than read back out of the stylesheet — a component overriding a step with
 * a value of its own is exactly the drift this is here to catch.
 */

/** Nothing visible is smaller than this, at any width. */
const ABSOLUTE_FLOOR = 12.5;
/**
 * Running prose. A paragraph longer than this many characters is something
 * to be read rather than a label, a hint or a count — and anything read in
 * sentences is held to the browser's own default size.
 */
const PROSE_LENGTH = 80;
const BODY_FLOOR = 16;
/** Anything typed into, below which iOS Safari zooms the page on focus. */
const CONTROL_FLOOR = 16;

interface Offender {
  selector: string;
  size: number;
  text: string;
}

const tooSmall = async (
  page: import('@playwright/test').Page,
  floor: number,
  selector: string,
  minLength = 0
): Promise<Offender[]> =>
  page.evaluate(
    ({ floor, selector, minLength }) => {
      const out: Offender[] = [];
      document.querySelectorAll(selector).forEach((el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        // Screen-reader-only text is never read with the eyes.
        if (el.classList.contains('visually-hidden')) return;
        // Only elements that hold text of their own.
        const own = Array.from(el.childNodes).some(
          (node) => node.nodeType === 3 && (node.textContent ?? '').trim()
        );
        const typed =
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT';
        if (!own && !typed) return;
        if ((el.textContent ?? '').trim().length < minLength) return;

        const size = parseFloat(style.fontSize);
        if (size + 0.01 < floor) {
          const cls =
            typeof el.className === 'string' && el.className
              ? '.' + el.className.trim().split(/\s+/).join('.')
              : '';
          out.push({
            selector: el.tagName.toLowerCase() + cls,
            size: Math.round(size * 100) / 100,
            text: (el.textContent ?? '').trim().slice(0, 40),
          });
        }
      });
      return out;
    },
    { floor, selector, minLength }
  ) as Promise<Offender[]>;

const describe = (found: Offender[]): string =>
  found
    .map(
      (entry) =>
        entry.selector + ' at ' + String(entry.size) + 'px — "' + entry.text + '"'
    )
    .join('; ');

test.describe('type is readable at every width', () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route} at ${viewport.width}px (${viewport.name})`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(route);
        await settleAnimations(page);

        const small = await tooSmall(page, ABSOLUTE_FLOOR, '*');
        expect(small, describe(small)).toEqual([]);

        const prose = await tooSmall(
          page,
          BODY_FLOOR,
          'p, li, dd, blockquote',
          PROSE_LENGTH
        );
        expect(prose, describe(prose)).toEqual([]);

        const controls = await tooSmall(
          page,
          CONTROL_FLOOR,
          'input, textarea, select'
        );
        expect(controls, describe(controls)).toEqual([]);
      });
    }
  }
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settleAnimations } from './settle';
import { inspect } from '../src/tools/textInspector/inspect';

/** U+0628 U+0650 U+0633 U+0652 U+0645 U+0650 — "bismi", with diacritics. */
const BISMI = String.fromCodePoint(
  0x0628, 0x0650, 0x0633, 0x0652, 0x0645, 0x0650
);
const RTL_OVERRIDE = String.fromCodePoint(0x202e);
const ZWJ = String.fromCodePoint(0x200d);

// ---------------------------------------------------------------------------
// The inspector's logic, with no browser involved
// ---------------------------------------------------------------------------

test.describe('text inspection', () => {
  test('counts the four different answers separately', () => {
    const report = inspect(BISMI);
    // Six code points, three of which are combining marks sitting on the
    // three letters — so a reader sees three characters, not six.
    expect(report.counts.codePoints).toBe(6);
    expect(report.counts.graphemes).toBe(3);
    expect(report.counts.withoutDiacritics).toBe(3);
    expect(report.counts.utf8Bytes).toBe(12);
  });

  test('plain ASCII agrees with itself', () => {
    const report = inspect('hello');
    expect(report.counts.utf16).toBe(5);
    expect(report.counts.codePoints).toBe(5);
    expect(report.counts.graphemes).toBe(5);
    expect(report.counts.utf8Bytes).toBe(5);
  });

  test('an emoji is one character and several code units', () => {
    const report = inspect(String.fromCodePoint(0x1f469));
    expect(report.counts.utf16).toBe(2);
    expect(report.counts.codePoints).toBe(1);
    expect(report.counts.graphemes).toBe(1);
  });

  test('finds characters that cannot be seen', () => {
    const report = inspect('a' + RTL_OVERRIDE + 'b' + ZWJ);
    expect(report.invisibles.map((entry) => entry.name)).toEqual([
      'RIGHT-TO-LEFT OVERRIDE',
      'ZERO WIDTH JOINER',
    ]);
  });

  test('notices when normalisation would change the string', () => {
    // é as one code point, then as e + combining acute.
    const composed = String.fromCodePoint(0x00e9);
    const decomposed = 'e' + String.fromCodePoint(0x0301);

    expect(inspect(composed).normalisationMatters).toBe(true);
    expect(inspect(composed).isNfc).toBe(true);
    expect(inspect(decomposed).isNfc).toBe(false);
    // They look identical and are not equal — the whole point.
    expect(composed === decomposed).toBe(false);
    expect(composed.normalize('NFC') === decomposed.normalize('NFC')).toBe(true);
  });

  test('reports mixed direction', () => {
    expect(inspect(BISMI).hasMixedDirection).toBe(false);
    expect(inspect(BISMI + ' hello').hasMixedDirection).toBe(true);
    expect(inspect(BISMI).direction).toBe('rtl');
    expect(inspect('hello').direction).toBe('ltr');
  });

  test('credits a combining mark to the script it belongs to', () => {
    // Script=Inherited would call these "Other"; Script_Extensions does not.
    const marks = inspect(BISMI).characters.filter(
      (entry) => entry.isDiacritic
    );
    expect(marks.length).toBe(3);
    for (const mark of marks) expect(mark.script).toBe('Arabic');
  });

  test('strips diacritics without touching the letters', () => {
    const report = inspect(BISMI);
    expect(Array.from(report.strippedDiacritics).length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const pad = (page: Page) => page.locator('.scratchpad__input');
const answers = (page: Page) =>
  page.locator('.scratchpad__result-value');

test.describe('tools page', () => {
  test('is reachable from the main navigation', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('button', { name: 'Tools' })
      .click();
    await expect(page).toHaveURL(/\/tools$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tools');
  });

  test('the scratchpad computes as you type', async ({ page }) => {
    await page.goto('/tools');
    await settleAnimations(page);

    await pad(page).fill('12 * 4\n+ 25%\n1 TB in GiB\n$99.99 * 3');

    await expect(answers(page).nth(0)).toHaveText('48');
    await expect(answers(page).nth(1)).toHaveText('60');
    await expect(answers(page).nth(2)).toHaveText('931.3226 GiB');
    await expect(answers(page).nth(3)).toHaveText('$299.97');
  });

  test('a half-typed line does not take the others down with it', async ({
    page,
  }) => {
    await page.goto('/tools');
    await settleAnimations(page);

    await pad(page).fill('2 + 2\n((((\n3 + 3');
    await expect(answers(page).nth(0)).toHaveText('4');
    await expect(answers(page).nth(2)).toHaveText('6');
  });

  test('says its exchange rates are not live', async ({ page }) => {
    await page.goto('/tools');
    await settleAnimations(page);

    await pad(page).fill('100 USD in EUR');
    await expect(page.locator('.scratchpad__rates')).toContainText(/not live/i);
  });

  test('the scratchpad survives a reload', async ({ page }) => {
    await page.goto('/tools');
    await settleAnimations(page);

    await pad(page).fill('7 * 6');
    await expect(answers(page).nth(0)).toHaveText('42');

    await page.reload();
    await settleAnimations(page);
    await expect(pad(page)).toHaveValue('7 * 6');
  });

  test('the tabs follow the keyboard pattern', async ({ page }) => {
    await page.goto('/tools');
    await settleAnimations(page);

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(3);

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator('.inspector')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.bench')).toBeVisible();

    // And it wraps back round.
    await page.keyboard.press('ArrowRight');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('a tool can be linked to directly', async ({ page }) => {
    await page.goto('/tools?tool=text-inspector');
    await settleAnimations(page);
    await expect(page.locator('.inspector')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Text Inspector' })
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('the inspector reports on what is typed into it', async ({ page }) => {
    await page.goto('/tools?tool=text-inspector');
    await settleAnimations(page);

    await page.locator('.inspector__input').fill('hello');
    const values = page.locator('.inspector__stat-value');
    await expect(values.nth(0)).toHaveText('5');
    await expect(values.nth(2)).toHaveText('5');

    await page.locator('.inspector__input').fill(BISMI);
    await expect(values.nth(1)).toHaveText('6');
    await expect(values.nth(2)).toHaveText('3');
  });

  test('has no accessibility violations on any tool', async ({ page }) => {
    for (const url of [
      '/tools',
      '/tools?tool=text-inspector',
      '/tools?tool=eval-bench',
    ]) {
      await page.goto(url);
      await settleAnimations(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, url).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// The homepage embed
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The eval bench, on the page
// ---------------------------------------------------------------------------

test.describe('eval bench', () => {
  const open = async (page: Page) => {
    await page.goto('/tools?tool=eval-bench');
    await settleAnimations(page);
  };

  test('says plainly that no model is called', async ({ page }) => {
    await open(page);
    // The claim this tool must never make is that these are real runs.
    await expect(page.locator('.bench__note')).toContainText(/no model runs/i);
    await expect(page.locator('.bench__note')).toContainText(
      /written by hand/i
    );
  });

  test('scores a version and switches to the other', async ({ page }) => {
    await open(page);
    await expect(page.locator('.bench__score-value')).toHaveText('67%');

    await page.getByRole('radio', { name: /contract restated/i }).check();
    await expect(page.locator('.bench__score-value')).toHaveText('83%');
  });

  test('loosening a gate moves the number with no new output', async ({
    page,
  }) => {
    await open(page);
    await page.getByRole('radio', { name: /contract restated/i }).check();
    await expect(page.locator('.bench__score-value')).toHaveText('83%');

    // Nothing about the samples changes — only what the gate accepts.
    await page
      .getByRole('checkbox', { name: /normalise arabic/i })
      .check();
    await expect(page.locator('.bench__score-value')).toHaveText('89%');
  });

  test('the comparison names the case that got worse', async ({ page }) => {
    await open(page);
    await page.getByRole('radio', { name: /compare the two/i }).check();

    await expect(page.locator('.bench__diff-headline')).toContainText(
      '67% → 83%'
    );
    // The point of the whole tool: the summary improved and something
    // still broke.
    await expect(page.locator('.bench__row--regressed th')).toHaveText(
      'Short gloss'
    );
    await expect(page.locator('.bench__move--bad')).toContainText(
      'fits the card'
    );
  });

  test('a failing run can be opened and read', async ({ page }) => {
    await open(page);
    await page.locator('.bench__case').first().locator('summary').click();

    const failed = page.locator('.bench__sample--failed').first();
    await expect(failed).toBeVisible();
    // The Arabic normalisation gate explains itself rather than saying
    // "not found", which would be true and useless. Scoped by name: a
    // closed <details> keeps its contents in the DOM, so every other
    // case's gates are matchable too.
    await expect(
      page
        .locator('.bench__gate--failed')
        .filter({ hasText: 'Arabic comes back' })
        .first()
    ).toContainText(/normalisation form/);
  });
});

// ---------------------------------------------------------------------------
// The home page carries one tool: short, and it hands the text over
// ---------------------------------------------------------------------------

test.describe('the text inspector on the home page', () => {
  const embedded = (page: Page) => page.locator('.inspector--compact');

  test('is the only tool embedded there', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    await expect(embedded(page)).toBeVisible();
    // The scratchpad is a better toy and a worse argument, so it stays on
    // the tools page rather than doubling the length of this one.
    await expect(page.locator('.scratchpad')).toHaveCount(0);
  });

  test('is usable without leaving the page', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    const input = embedded(page).locator('.inspector__input');
    await input.fill('hello');
    await expect(
      embedded(page).locator('.inspector__stat-value').first()
    ).toHaveText('5');
  });

  test('is not in the bundle the first paint waits for', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.js')) chunks.push(request.url());
    });

    await page.goto('/');
    await settleAnimations(page);

    // It arrives as its own chunk rather than inside the main one...
    expect(chunks.some((url) => /TextInspector/.test(url))).toBe(true);
    // ...and the tool this page no longer shows is not fetched at all.
    expect(chunks.some((url) => /Scratchpad/.test(url))).toBe(false);
  });

  test('shows the counts and not the table', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    await expect(embedded(page).locator('.inspector__stat')).toHaveCount(5);
    // The part that grows with whatever is pasted in stays on the tools
    // page; that is the whole reason this variant exists.
    await expect(embedded(page).locator('.inspector__table')).toHaveCount(0);
  });

  test('a paste leaves the next section heading on screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await settleAnimations(page);

    const input = embedded(page).locator('.inspector__input');
    await input.scrollIntoViewIfNeeded();
    // A real paragraph, not a word: the failure this guards against is the
    // section growing with its input.
    await input.fill(
      'یک پاراگراف طولانی فارسی برای آزمایش، با چند کلمه بیشتر تا متن کوتاه نباشد.'
    );
    await expect(
      embedded(page).locator('.inspector__stat-value').first()
    ).not.toHaveText('0');

    const tool = await embedded(page).boundingBox();
    const heading = await page
      .getByRole('heading', { name: 'Engineering deep dives' })
      .boundingBox();
    expect(tool).not.toBeNull();
    expect(heading).not.toBeNull();
    // Within a screen of the tool's own top: scroll the tool into view and
    // the next section announces itself without hunting for it.
    expect(heading!.y - tool!.y).toBeLessThan(780);
  });

  test('See more carries the text to the full analysis', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    const typed = 'héllo' + String.fromCodePoint(0x200b);
    await embedded(page).locator('.inspector__input').fill(typed);

    await page.getByRole('link', { name: /see the full analysis/i }).click();

    await expect(page).toHaveURL(/\/tools\?tool=text-inspector$/);
    // Same text, now with the table and the findings under it — and
    // nothing of what was typed went into the URL to get here.
    await expect(page.locator('.inspector__input')).toHaveValue(typed);
    await expect(page.locator('.inspector__table')).toBeVisible();
    await expect(page.locator('.inspector__finding--warn')).toContainText(
      /ZERO WIDTH SPACE/
    );
  });
});

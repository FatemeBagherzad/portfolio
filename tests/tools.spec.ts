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
    await expect(tabs).toHaveCount(2);

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator('.inspector')).toBeVisible();

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

  test('has no accessibility violations on either tool', async ({ page }) => {
    for (const url of ['/tools', '/tools?tool=text-inspector']) {
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

test.describe('the scratchpad on the home page', () => {
  test('is usable without leaving the page', async ({ page }) => {
    await page.goto('/');
    await settleAnimations(page);

    const embedded = page.locator('.home__tool .scratchpad__input');
    await expect(embedded).toBeVisible();

    await embedded.fill('25 * 4');
    await expect(
      page.locator('.home__tool .scratchpad__result-value').first()
    ).toHaveText('100');
  });

  test('is not in the bundle the first paint waits for', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.js')) chunks.push(request.url());
    });

    await page.goto('/');
    await settleAnimations(page);

    // It arrives as its own chunk rather than inside the main one.
    expect(chunks.some((url) => /Scratchpad/.test(url))).toBe(true);
  });
});

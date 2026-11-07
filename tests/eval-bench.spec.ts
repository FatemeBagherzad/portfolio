import { expect, test } from '@playwright/test';
import { evaluateOutput } from '../src/tools/evalBench/assertions';
import {
  asPercent,
  compareRuns,
  runVersion,
  withNormalisation,
} from '../src/tools/evalBench/run';
import {
  EXAMPLE_RUNS,
  splitRuns,
} from '../src/tools/evalBench/parseRuns';
import { RABVA_SUITE } from '../src/tools/evalBench/suite';
import type { Assertion } from '../src/tools/evalBench/types';

/**
 * The harness, with no browser involved.
 *
 * A bench whose own arithmetic is not tested is a bench that reports
 * whatever it happens to compute, which is worse than no bench at all.
 */

const first = (assertions: Assertion[], output: string) => {
  const results = evaluateOutput(assertions, output);
  const head = results[0];
  if (!head) throw new Error('no result');
  return head;
};

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

test.describe('gates', () => {
  test('contains is byte-exact unless told otherwise', () => {
    const composed = String.fromCodePoint(0x0623); // أ
    const decomposed = composed.normalize('NFD'); // ا + hamza above

    const strict: Assertion = { kind: 'contains', value: composed };
    expect(first([strict], decomposed).passed).toBe(false);
    // And it says why, rather than "not found" — the two render alike.
    expect(first([strict], decomposed).detail).toContain('normalisation');

    const lenient: Assertion = {
      kind: 'contains',
      value: composed,
      normalise: true,
    };
    expect(first([lenient], decomposed).passed).toBe(true);
  });

  test('contains distinguishes absent from differently encoded', () => {
    const strict: Assertion = { kind: 'contains', value: 'kitab' };
    expect(first([strict], 'nothing here').detail).toContain('not found');
  });

  test('json wants a parse and the named fields', () => {
    const gate: Assertion = {
      kind: 'json',
      requiredFields: ['verse.arabic', 'ayah'],
    };
    expect(first([gate], '{"verse":{"arabic":"x"},"ayah":2}').passed).toBe(true);
    expect(first([gate], 'not json').detail).toBe('not valid JSON');
    expect(first([gate], '{"ayah":2}').detail).toContain('verse.arabic');
    // A fenced block is the most common near-miss and is not JSON.
    expect(first([gate], '```json\n{"ayah":2}\n```').passed).toBe(false);
  });

  test('maxLength measures the unit it was given', () => {
    const emoji = String.fromCodePoint(0x1f469); // two UTF-16 units, one point
    const asUtf16: Assertion = { kind: 'maxLength', limit: 1, unit: 'utf16' };
    const asPoints: Assertion = {
      kind: 'maxLength',
      limit: 1,
      unit: 'codePoints',
    };
    expect(first([asUtf16], emoji).passed).toBe(false);
    expect(first([asPoints], emoji).passed).toBe(true);
  });

  test('numberWithin rejects a number-shaped string', () => {
    const gate: Assertion = {
      kind: 'numberWithin',
      path: 'matches',
      min: 1,
      max: 10,
    };
    expect(first([gate], '{"matches":5}').passed).toBe(true);
    expect(first([gate], '{"matches":50}').passed).toBe(false);
    expect(first([gate], '{"matches":"5"}').passed).toBe(false);
    expect(first([gate], '{"matches":"5"}').detail).toContain('not a number');
    expect(first([gate], '{}').detail).toContain('missing');
  });

  test('excludes catches a field outside the contract', () => {
    const gate: Assertion = { kind: 'excludes', value: 'explanation' };
    expect(first([gate], '{"root":"k-t-b"}').passed).toBe(true);
    expect(first([gate], '{"explanation":"because"}').passed).toBe(false);
  });

  test('one failed gate fails the sample', () => {
    const results = evaluateOutput(
      [
        { kind: 'contains', value: 'a' },
        { kind: 'contains', value: 'zzz' },
      ],
      'a'
    );
    expect(results.map((entry) => entry.passed)).toEqual([true, false]);
  });
});

// ---------------------------------------------------------------------------
// Rates and spread
// ---------------------------------------------------------------------------

test.describe('runs', () => {
  const [v1, v2] = RABVA_SUITE.versions;

  test('the suite has two versions to compare', () => {
    expect(v1).toBeDefined();
    expect(v2).toBeDefined();
  });

  test('reports a rate per case and overall', () => {
    if (!v1) throw new Error('no v1');
    const run = runVersion(RABVA_SUITE, v1);

    expect(run.total).toBe(18);
    expect(run.passed).toBe(12);
    expect(asPercent(run.passRate)).toBe('67%');

    const byId = Object.fromEntries(
      run.cases.map((entry) => [entry.case.id, entry])
    );
    expect(byId['record']?.passed).toBe(3);
    expect(byId['root']?.passed).toBe(3);
    expect(byId['gloss']?.passed).toBe(6);
  });

  test('a decided case has no spread, a mixed one does', () => {
    if (!v1) throw new Error('no v1');
    const run = runVersion(RABVA_SUITE, v1);
    const gloss = run.cases.find((entry) => entry.case.id === 'gloss');
    const record = run.cases.find((entry) => entry.case.id === 'record');

    expect(gloss?.deviation).toBe(0);
    expect(record?.deviation).toBeGreaterThan(0);
    // sqrt(0.5 * 0.5) for a case that passes half the time.
    expect(record?.deviation).toBeCloseTo(0.5, 5);
  });

  test('names the gate that only fails sometimes', () => {
    if (!v2) throw new Error('no v2');
    const run = runVersion(RABVA_SUITE, v2);
    const record = run.cases.find((entry) => entry.case.id === 'record');

    // Five of six runs are clean; the sixth returns the same Arabic in a
    // different normalisation form. That is the flake worth naming.
    expect(record?.passed).toBe(5);
    expect(record?.flakyAssertions).toHaveLength(1);
    expect(record?.flakyAssertions[0]?.label).toBe(
      'Arabic comes back byte-exact'
    );
  });

  test('loosening a gate moves the number without changing an output', () => {
    if (!v2) throw new Error('no v2');
    const strict = runVersion(RABVA_SUITE, v2);
    const lenient = runVersion(
      withNormalisation(RABVA_SUITE, true),
      withNormalisation(RABVA_SUITE, true).versions[1]!
    );

    expect(lenient.passed).toBeGreaterThan(strict.passed);
    // Nothing about the samples changed — only what the gate accepts.
    expect(lenient.total).toBe(strict.total);
  });
});

// ---------------------------------------------------------------------------
// The comparison — the reason the bench exists
// ---------------------------------------------------------------------------

test.describe('comparing two prompt versions', () => {
  const [v1, v2] = RABVA_SUITE.versions;

  test('a better suite can still contain a worse case', () => {
    if (!v1 || !v2) throw new Error('missing version');
    const comparison = compareRuns(
      runVersion(RABVA_SUITE, v1),
      runVersion(RABVA_SUITE, v2)
    );

    // The headline improves...
    expect(comparison.after.passRate).toBeGreaterThan(
      comparison.before.passRate
    );
    expect(asPercent(comparison.after.passRate)).toBe('83%');
    // ...and one case is worse than it was.
    expect(comparison.improvements).toBe(2);
    expect(comparison.regressions).toBe(1);

    const gloss = comparison.cases.find((entry) => entry.caseId === 'gloss');
    expect(gloss?.movement).toBe('regressed');
    // Named, not merely counted: this is what a single rate cannot say.
    expect(gloss?.newlyFailing).toEqual(['fits the card']);
  });

  test('a gate that starts passing is reported too', () => {
    if (!v1 || !v2) throw new Error('missing version');
    const comparison = compareRuns(
      runVersion(RABVA_SUITE, v1),
      runVersion(RABVA_SUITE, v2)
    );
    const root = comparison.cases.find((entry) => entry.caseId === 'root');
    expect(root?.movement).toBe('improved');
    expect(root?.newlyPassing.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Splitting what someone pastes in
// ---------------------------------------------------------------------------

test.describe('pasted runs', () => {
  test('splits on a line of dashes, not on blank lines', () => {
    // Pretty-printed JSON has blank lines in it; a blank-line separator
    // would cut a single answer into several.
    const pasted = ['{', '  "a": 1', '', '}', '---', '{"a": 2}'].join('\n');
    expect(splitRuns(pasted)).toEqual(['{\n  "a": 1\n\n}', '{"a": 2}']);
  });

  test('ignores empty blocks and stray separators', () => {
    expect(splitRuns('---\n\none\n---\n---\ntwo\n---\n')).toEqual([
      'one',
      'two',
    ]);
    expect(splitRuns('   ')).toEqual([]);
    expect(splitRuns('')).toEqual([]);
  });

  test('a single answer with no separator is one run', () => {
    expect(splitRuns('just this')).toEqual(['just this']);
  });

  test('the prefilled example scores what the panel claims', () => {
    // Three answers, two gates, one good answer: the number someone sees
    // the first time they open the panel.
    const runs = splitRuns(EXAMPLE_RUNS);
    expect(runs).toHaveLength(3);

    const gates: Assertion[] = [
      { kind: 'json', requiredFields: ['ayah', 'word'] },
      { kind: 'numberWithin', path: 'ayah', min: 1, max: 286 },
    ];
    const passed = runs.filter((run) =>
      evaluateOutput(gates, run).every((entry) => entry.passed)
    ).length;

    expect(passed).toBe(1);
    expect(asPercent(passed / runs.length)).toBe('33%');
  });
});

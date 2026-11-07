import { describe, evaluateOutput } from './assertions';
import type {
  Assertion,
  CaseResult,
  PromptVersion,
  RunResult,
  SampleResult,
  Suite,
} from './types';

/**
 * Running a suite, and comparing two runs.
 *
 * The thing this exists to show is not pass or fail. It is that the same
 * prompt, asked the same question several times, does not answer the same
 * way — so a single green run proves nothing, and the number worth
 * reporting is a rate with a spread beside it.
 */

const runCase = (
  evalCase: Suite['cases'][number],
  outputs: string[]
): CaseResult => {
  const samples: SampleResult[] = outputs.map((output) => {
    const assertions = evaluateOutput(evalCase.assertions, output);
    return {
      output,
      // One gate fails, the sample fails. Gates are conditions for
      // shipping, not a score to average.
      passed: assertions.every((entry) => entry.passed),
      assertions,
    };
  });

  const passed = samples.filter((sample) => sample.passed).length;
  const total = samples.length;
  const passRate = total === 0 ? 0 : passed / total;

  // Bernoulli: the spread of a pass/fail outcome is fixed by its rate.
  const deviation = Math.sqrt(passRate * (1 - passRate));

  // A gate that both passed and failed across the samples. This is the
  // number to act on: a gate that always fails is a bug you can see, and
  // one that fails sometimes is the one that reaches production.
  const flakyAssertions: Assertion[] = evalCase.assertions.filter(
    (_, index) => {
      const outcomes = samples.map((sample) => sample.assertions[index]?.passed);
      return outcomes.includes(true) && outcomes.includes(false);
    }
  );

  return {
    case: evalCase,
    samples,
    passed,
    total,
    passRate,
    deviation,
    flakyAssertions,
  };
};

export const runVersion = (suite: Suite, version: PromptVersion): RunResult => {
  const cases = suite.cases.map((evalCase) =>
    runCase(evalCase, version.samples[evalCase.id] ?? [])
  );

  const passed = cases.reduce((sum, entry) => sum + entry.passed, 0);
  const total = cases.reduce((sum, entry) => sum + entry.total, 0);

  return {
    version,
    cases,
    passed,
    total,
    passRate: total === 0 ? 0 : passed / total,
  };
};

// ---------------------------------------------------------------------------
// Comparing two runs
// ---------------------------------------------------------------------------

export type Movement = 'improved' | 'regressed' | 'unchanged';

export interface CaseDelta {
  caseId: string;
  name: string;
  before: number;
  after: number;
  /** after − before, in rate. */
  change: number;
  movement: Movement;
  /** Gates that passed everywhere before and fail somewhere now. */
  newlyFailing: string[];
  /** Gates that failed somewhere before and pass everywhere now. */
  newlyPassing: string[];
}

export interface Comparison {
  before: RunResult;
  after: RunResult;
  cases: CaseDelta[];
  regressions: number;
  improvements: number;
}

/** Gates that failed in at least one sample of this case. */
const failingGates = (result: CaseResult | undefined): Set<string> => {
  const names = new Set<string>();
  if (!result) return names;
  for (const sample of result.samples) {
    for (const entry of sample.assertions) {
      if (!entry.passed) names.add(describe(entry.assertion));
    }
  }
  return names;
};

/**
 * What moved between two prompt versions.
 *
 * A single pass rate tells you where you are; this tells you what you did.
 * The gate-level lists are the part worth having — an overall rate that
 * went up while one gate started failing is the shape of a change that
 * looks like progress in a summary and is not.
 */
export const compareRuns = (before: RunResult, after: RunResult): Comparison => {
  const cases: CaseDelta[] = after.cases.map((afterCase) => {
    const beforeCase = before.cases.find(
      (entry) => entry.case.id === afterCase.case.id
    );
    const beforeRate = beforeCase?.passRate ?? 0;
    const change = afterCase.passRate - beforeRate;

    const wasFailing = failingGates(beforeCase);
    const nowFailing = failingGates(afterCase);

    return {
      caseId: afterCase.case.id,
      name: afterCase.case.name,
      before: beforeRate,
      after: afterCase.passRate,
      change,
      movement:
        change > 0 ? 'improved' : change < 0 ? 'regressed' : 'unchanged',
      newlyFailing: [...nowFailing].filter((name) => !wasFailing.has(name)),
      newlyPassing: [...wasFailing].filter((name) => !nowFailing.has(name)),
    };
  });

  return {
    before,
    after,
    cases,
    regressions: cases.filter((entry) => entry.movement === 'regressed').length,
    improvements: cases.filter((entry) => entry.movement === 'improved').length,
  };
};

/** 0.8333 → "83%". Rates are read, not calculated with. */
export const asPercent = (rate: number): string =>
  String(Math.round(rate * 100)) + '%';

/**
 * The same suite with every text gate set to normalise, or not.
 *
 * One switch, because it is the shortest way to show what a gate is for.
 * Turn normalisation on and the pass rate climbs — nothing about the
 * outputs changed, only what the gate is prepared to accept. A harness
 * where the gates are adjustable until the numbers look good is a harness
 * that reports whatever you want, and watching the figure move is the
 * fastest way to understand why that matters.
 */
export const withNormalisation = (suite: Suite, on: boolean): Suite => ({
  ...suite,
  cases: suite.cases.map((entry) => ({
    ...entry,
    assertions: entry.assertions.map((assertion) =>
      assertion.kind === 'contains' ? { ...assertion, normalise: on } : assertion
    ),
  })),
});

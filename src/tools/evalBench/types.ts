/**
 * The vocabulary of the bench.
 *
 * A *gate* is one assertion. A *case* is an input plus the gates its output
 * has to pass. A *version* is one wording of the prompt, carrying the
 * outputs it produced. A *suite* is the whole thing.
 *
 * The shape that matters: outputs belong to a version, not to a case. That
 * is what makes a regression visible — the same case, the same gates, a
 * different prompt, and a number that moved.
 */

/**
 * The five gates.
 *
 * Deliberately five. A bench with twenty assertion kinds is a worse
 * demonstration than one with five, because the interesting part is never
 * the vocabulary — it is combining gates, reporting which one failed, and
 * noticing that one of them only fails sometimes.
 */
export type Assertion =
  | {
      kind: 'contains';
      value: string;
      /**
       * Unicode normalisation before comparing. Off by default, and that
       * default is the point: a model that re-emits Arabic in NFD instead
       * of NFC produces text that renders identically and compares
       * unequal. Normalising here would hide exactly the bug this gate
       * exists to catch.
       */
      normalise?: boolean;
      label?: string;
    }
  | { kind: 'excludes'; value: string; label?: string }
  | {
      kind: 'json';
      /** Dotted paths that must be present, e.g. `verse.arabic`. */
      requiredFields: string[];
      label?: string;
    }
  | {
      kind: 'maxLength';
      limit: number;
      /**
       * Which length. A limit measured in UTF-16 code units cuts Arabic in
       * a different place than one measured in code points, which is the
       * whole reason the Text Inspector exists.
       */
      unit: 'utf16' | 'codePoints';
      label?: string;
    }
  | {
      kind: 'numberWithin';
      /** Dotted path to a number inside the JSON output. */
      path: string;
      min: number;
      max: number;
      label?: string;
    };

export interface EvalCase {
  id: string;
  name: string;
  /** What was asked of the model, beyond the prompt itself. */
  input: string;
  assertions: Assertion[];
}

export interface PromptVersion {
  id: string;
  label: string;
  /** The system prompt this version used. */
  prompt: string;
  /** Outputs per case id. Several per case: that is where variance lives. */
  samples: Record<string, string[]>;
}

export interface Suite {
  id: string;
  name: string;
  description: string;
  cases: EvalCase[];
  versions: PromptVersion[];
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  /** Why it failed, in words, with the actual value where that helps. */
  detail: string;
}

export interface SampleResult {
  output: string;
  passed: boolean;
  assertions: AssertionResult[];
}

export interface CaseResult {
  case: EvalCase;
  samples: SampleResult[];
  passed: number;
  total: number;
  /** passed / total, 0–1. */
  passRate: number;
  /**
   * Standard deviation of the per-sample pass/fail, which for a Bernoulli
   * outcome is sqrt(p(1-p)). Zero means the case is decided — it always
   * passes or always fails. Anything above zero is flakiness, and flaky is
   * worse than failing: a gate that fails every time gets fixed, and one
   * that fails one run in nine gets argued about.
   */
  deviation: number;
  /** Gates that both passed and failed across the samples. */
  flakyAssertions: Assertion[];
}

export interface RunResult {
  version: PromptVersion;
  cases: CaseResult[];
  passed: number;
  total: number;
  passRate: number;
}

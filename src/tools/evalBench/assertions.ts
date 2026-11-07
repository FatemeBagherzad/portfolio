import type { Assertion, AssertionResult } from './types';

/**
 * Evaluating one gate against one output.
 *
 * Every branch returns a reason, not just a boolean. A harness that reports
 * "3 of 12 failed" and stops there sends you back to reading the outputs by
 * eye, which is the job it was supposed to do for you.
 */

/** A readable name for a gate, for the report and for a screen reader. */
export const describe = (assertion: Assertion): string => {
  if (assertion.label) return assertion.label;
  switch (assertion.kind) {
    case 'contains':
      return 'contains ' + quote(assertion.value);
    case 'excludes':
      return 'does not contain ' + quote(assertion.value);
    case 'json':
      return 'valid JSON with ' + assertion.requiredFields.join(', ');
    case 'maxLength':
      return (
        'at most ' +
        String(assertion.limit) +
        (assertion.unit === 'utf16' ? ' UTF-16 units' : ' code points')
      );
    case 'numberWithin':
      return (
        assertion.path +
        ' between ' +
        String(assertion.min) +
        ' and ' +
        String(assertion.max)
      );
  }
};

const quote = (value: string): string => {
  const trimmed = value.length > 28 ? value.slice(0, 28) + '…' : value;
  return '“' + trimmed + '”';
};

/** Walks a dotted path, returning undefined rather than throwing. */
const at = (value: unknown, path: string): unknown => {
  let current: unknown = value;
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

/**
 * Parsed once per output rather than once per gate.
 *
 * Three of the five gates want the same parse, and a suite of any size runs
 * this across every sample — parsing the same string three times is the
 * kind of waste that only shows up once there is enough data to matter.
 */
const parseJson = (output: string): unknown => {
  try {
    return JSON.parse(output);
  } catch {
    return undefined;
  }
};

const countCodePoints = (value: string): number =>
  Array.from(value).length;

export const evaluateAssertion = (
  assertion: Assertion,
  output: string,
  parsed: unknown
): AssertionResult => {
  const result = (passed: boolean, detail: string): AssertionResult => ({
    assertion,
    passed,
    detail,
  });

  switch (assertion.kind) {
    case 'contains': {
      // The normalisation decision is the gate. Comparing normalised text
      // makes an NFD copy of the same Arabic pass, and an NFD copy is a
      // real defect: it renders identically, compares unequal, and breaks
      // every lookup built on the stored form.
      const haystack = assertion.normalise ? output.normalize('NFC') : output;
      const needle = assertion.normalise
        ? assertion.value.normalize('NFC')
        : assertion.value;

      if (haystack.includes(needle)) return result(true, 'found');

      // Worth distinguishing: absent, or present in a different form?
      const normalisedMatch = output
        .normalize('NFC')
        .includes(assertion.value.normalize('NFC'));
      return result(
        false,
        normalisedMatch
          ? 'present, but in a different normalisation form — it renders the same and compares unequal'
          : 'not found in the output'
      );
    }

    case 'excludes':
      return output.includes(assertion.value)
        ? result(false, 'found ' + quote(assertion.value) + ' in the output')
        : result(true, 'absent');

    case 'json': {
      if (parsed === undefined) return result(false, 'not valid JSON');
      const missing = assertion.requiredFields.filter(
        (field) => at(parsed, field) === undefined
      );
      return missing.length === 0
        ? result(true, 'parsed, all fields present')
        : result(false, 'missing ' + missing.join(', '));
    }

    case 'maxLength': {
      const measured =
        assertion.unit === 'utf16' ? output.length : countCodePoints(output);
      return measured <= assertion.limit
        ? result(true, String(measured) + ' of ' + String(assertion.limit))
        : result(
            false,
            String(measured) +
              ', over by ' +
              String(measured - assertion.limit)
          );
    }

    case 'numberWithin': {
      if (parsed === undefined) return result(false, 'not valid JSON');
      const value = at(parsed, assertion.path);
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return result(
          false,
          assertion.path +
            ' is ' +
            (value === undefined ? 'missing' : typeof value) +
            ', not a number'
        );
      }
      return value >= assertion.min && value <= assertion.max
        ? result(true, String(value))
        : result(false, String(value) + ' is outside the range');
    }
  }
};

/** Every gate for one output. The parse is shared across them. */
export const evaluateOutput = (
  assertions: Assertion[],
  output: string
): AssertionResult[] => {
  const parsed = parseJson(output);
  return assertions.map((assertion) =>
    evaluateAssertion(assertion, output, parsed)
  );
};

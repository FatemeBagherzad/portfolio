import { expect, test } from '@playwright/test';
import { evaluateDocument } from '../src/tools/scratchpad/evaluate';

/**
 * The scratchpad's parser and evaluator, exercised directly.
 *
 * No browser here: this is pure logic, and testing it through a rendered
 * textarea would be slower, flakier and would tell you less about which
 * part broke.
 */

/** The displayed result of the last non-blank line. */
const last = (source: string): string => {
  const results = evaluateDocument(source).filter(
    (line) => line.kind !== 'blank'
  );
  return results[results.length - 1]?.display ?? '';
};

/** Every line's result, blanks included. */
const all = (source: string): string[] =>
  evaluateDocument(source).map((line) => line.display);

test.describe('arithmetic', () => {
  test('respects precedence and brackets', () => {
    expect(last('2 + 3 * 4')).toBe('14');
    expect(last('(2 + 3) * 4')).toBe('20');
    expect(last('10 / 4')).toBe('2.5');
    expect(last('2 ^ 3 ^ 2')).toBe('512'); // right-associative
    expect(last('-5 + 2')).toBe('-3');
  });

  test('reads numbers the way people write them', () => {
    expect(last('1,250 + 1,250')).toBe('2,500');
    expect(last('10k')).toBe('10,000');
    expect(last('1.5m')).toBe('1,500,000');
  });

  test('reports division by zero rather than printing Infinity', () => {
    expect(last('5 / 0')).toBe('division by zero');
  });
});

test.describe('percentages', () => {
  test('a trailing percent is taken from the value on the left', () => {
    expect(last('200 + 13%')).toBe('226');
    expect(last('200 - 10%')).toBe('180');
  });

  test('"of" reads as a share of something', () => {
    expect(last('13% of 200')).toBe('26');
  });

  test('a percent on its own is just a percent', () => {
    expect(last('13%')).toBe('13%');
  });
});

test.describe('units', () => {
  test('converts within a dimension', () => {
    expect(last('65 kg in lbs')).toBe('143.3005 lb');
    expect(last('10 km in miles')).toBe('6.2137 mi');
    expect(last('2 hours in minutes')).toBe('120 min');
  });

  test('handles the temperature offset, not just a scale factor', () => {
    expect(last('100 C in F')).toBe('212 °F');
    expect(last('32 F in C')).toBe('0 °C');
    expect(last('0 C in K')).toBe('273.15 K');
  });

  test('knows decimal and binary data sizes are different', () => {
    expect(last('1 GB in MB')).toBe('1,000 MB');
    expect(last('1 GiB in MiB')).toBe('1,024 MiB');
  });

  test('adds compatible units and refuses incompatible ones', () => {
    expect(last('1 km + 500 m')).toBe('1.5 km');
    expect(last('1 kg + 2 km')).toBe('cannot add mass and length');
  });

  test('cancels units when dividing like by like', () => {
    expect(last('6 km / 2 km')).toBe('3');
  });

  test('scales a quantity by a plain number', () => {
    expect(last('3 * 2 hours')).toBe('6 h');
  });
});

test.describe('currency', () => {
  test('reads a symbol before its amount', () => {
    expect(last('$180')).toBe('$180.00');
    expect(last('€1,250')).toBe('€1,250.00');
  });

  test('converts between currencies', () => {
    // Against the bundled November 2026 snapshot: 1 USD = 1.37 CAD = 0.92 EUR.
    expect(last('137 CAD in USD')).toBe('$100.00');
  });

  test('uses each currency’s own decimal convention', () => {
    // Intl knows the yen has none; this is not hardcoded anywhere.
    expect(last('1000 JPY')).toBe('¥1,000');
  });

  test('keeps the currency when multiplied by a count', () => {
    expect(last('3 nights at $180')).toBe('$540.00');
  });

  test('divides money by a count into a rate', () => {
    expect(last('$180 / 2 nights')).toBe('$90.00');
  });

  test('adds a plain number as the same currency', () => {
    expect(last('$180 + 20')).toBe('$200.00');
  });
});

test.describe('lines working together', () => {
  test('a leading operator continues the line above', () => {
    const results = all(['3 nights at $180', '+ 13% tax'].join('\n'));
    expect(results[0]).toBe('$540.00');
    expect(results[1]).toBe('$610.20');
  });

  test('named values can be used further down', () => {
    const results = all(
      ['rate = $85', 'hours = 12', 'rate * hours'].join('\n')
    );
    expect(results[2]).toBe('$1,020.00');
  });

  test('a user name beats a reserved one', () => {
    const results = all(['total = 5', 'total * 2'].join('\n'));
    expect(results[1]).toBe('10');
  });

  test('sum adds everything above it', () => {
    const results = all(['$10', '$20', '$30', 'sum'].join('\n'));
    expect(results[3]).toBe('$60.00');
  });

  test('sum steps over lines in another dimension', () => {
    const results = all(['$10', '5 kg', '$20', 'sum'].join('\n'));
    expect(results[3]).toBe('$30.00');
  });

  test('prev refers to the line above', () => {
    const results = all(['40 + 2', 'prev * 2'].join('\n'));
    expect(results[1]).toBe('84');
  });
});

test.describe('labels and notes', () => {
  test('words that are not maths are ignored', () => {
    expect(last('groceries 20 + 30')).toBe('50');
    expect(last('200 + 13% tax')).toBe('226');
  });

  test('comment lines produce nothing', () => {
    const results = evaluateDocument('# a heading\n2 + 2');
    expect(results[0]?.kind).toBe('comment');
    expect(results[1]?.display).toBe('4');
  });

  test('blank lines stay blank', () => {
    const results = evaluateDocument('2 + 2\n\n3 + 3');
    expect(results[1]?.kind).toBe('blank');
    expect(results[2]?.display).toBe('6');
  });
});

test.describe('errors', () => {
  test('one bad line does not stop the ones below it', () => {
    const results = all(['2 + 2', '((', '3 + 3'].join('\n'));
    expect(results[0]).toBe('4');
    expect(results[2]).toBe('6');
    expect(evaluateDocument(['2 + 2', '((', '3 + 3'].join('\n'))[1]?.kind).toBe(
      'error'
    );
  });

  test('an unknown name says so instead of guessing', () => {
    // `widgets` survives label-stripping only if something defined it.
    const results = evaluateDocument('widgets * 2');
    expect(results[0]?.kind).toBe('error');
  });

  test('a half-typed line is an error, not a crash', () => {
    for (const fragment of ['2 +', '*', '(', '65 kg in']) {
      expect(() => evaluateDocument(fragment)).not.toThrow();
    }
  });
});

import { parseLine, ParseError, RESERVED, type Node } from './parse';
import { convert, type UnitDef } from './units';
import './rates';

/**
 * Evaluates the scratchpad, one line at a time, top to bottom.
 *
 * The arithmetic rules are looser than a programming language's on purpose,
 * because the input is closer to a receipt than to code:
 *
 * - a percent on the right of `+` or `-` means "of the left", so a column
 *   of `+ 13% tax` lines does what it looks like
 * - adding a plain number to a quantity adopts the quantity's unit, because
 *   "$180 + 20" is obviously twenty dollars
 * - multiplying a currency by anything keeps the currency, which is what
 *   makes "3 nights at $180" land on $540 rather than on a type error
 *
 * Every one of those is a place where being strict would be correct and
 * useless.
 */

export type Value =
  | { kind: 'number'; value: number }
  | { kind: 'quantity'; value: number; unit: UnitDef }
  | { kind: 'percent'; value: number };

export class EvalError extends Error {}

const asNumber = (value: Value): number =>
  value.kind === 'percent' ? value.value / 100 : value.value;

/** A percent anywhere other than beside `+`/`-` is simply its fraction. */
const defuse = (value: Value): Value =>
  value.kind === 'percent' ? { kind: 'number', value: value.value / 100 } : value;

const sameDimension = (a: UnitDef, b: UnitDef): boolean =>
  a.dimension === b.dimension;

const add = (left: Value, right: Value, sign: 1 | -1): Value => {
  // "+ 13%" — the percent is read against whatever is on the left.
  if (right.kind === 'percent') {
    const factor = 1 + (sign * right.value) / 100;
    if (left.kind === 'quantity') {
      return { kind: 'quantity', value: left.value * factor, unit: left.unit };
    }
    return { kind: 'number', value: asNumber(left) * factor };
  }

  const a = defuse(left);
  const b = defuse(right);

  if (a.kind === 'quantity' && b.kind === 'quantity') {
    if (!sameDimension(a.unit, b.unit)) {
      throw new EvalError(
        'cannot add ' + a.unit.dimension + ' and ' + b.unit.dimension
      );
    }
    const converted = convert(b.value, b.unit, a.unit) ?? 0;
    return { kind: 'quantity', value: a.value + sign * converted, unit: a.unit };
  }

  if (a.kind === 'quantity') {
    return { kind: 'quantity', value: a.value + sign * b.value, unit: a.unit };
  }
  if (b.kind === 'quantity') {
    return { kind: 'quantity', value: a.value + sign * b.value, unit: b.unit };
  }

  return { kind: 'number', value: a.value + sign * b.value };
};

const multiply = (left: Value, right: Value): Value => {
  const a = defuse(left);
  const b = defuse(right);

  if (a.kind === 'quantity' && b.kind === 'quantity') {
    // Currency wins, which is the whole point of "3 nights at $180": the
    // nights are what you are counting, the dollars are what you get.
    if (a.unit.dimension === 'currency') {
      return { kind: 'quantity', value: a.value * b.value, unit: a.unit };
    }
    if (b.unit.dimension === 'currency') {
      return { kind: 'quantity', value: a.value * b.value, unit: b.unit };
    }
    throw new EvalError(
      'cannot multiply ' + a.unit.symbol + ' by ' + b.unit.symbol
    );
  }

  if (a.kind === 'quantity') {
    return { kind: 'quantity', value: a.value * b.value, unit: a.unit };
  }
  if (b.kind === 'quantity') {
    return { kind: 'quantity', value: a.value * b.value, unit: b.unit };
  }
  return { kind: 'number', value: a.value * b.value };
};

const divide = (left: Value, right: Value): Value => {
  const a = defuse(left);
  const b = defuse(right);

  const divisor = b.kind === 'quantity' ? b.value : b.value;
  if (divisor === 0) throw new EvalError('division by zero');

  if (a.kind === 'quantity' && b.kind === 'quantity') {
    if (sameDimension(a.unit, b.unit)) {
      // Same dimension cancels: "6 km / 2 km" is just 3.
      const converted = convert(b.value, b.unit, a.unit) ?? 1;
      if (converted === 0) throw new EvalError('division by zero');
      return { kind: 'number', value: a.value / converted };
    }
    if (a.unit.dimension === 'currency') {
      // "$180 / 2 nights" — a rate, printed as the currency it is in.
      return { kind: 'quantity', value: a.value / b.value, unit: a.unit };
    }
    throw new EvalError(
      'cannot divide ' + a.unit.symbol + ' by ' + b.unit.symbol
    );
  }

  if (a.kind === 'quantity') {
    return { kind: 'quantity', value: a.value / divisor, unit: a.unit };
  }
  if (b.kind === 'quantity') {
    throw new EvalError('cannot divide a plain number by ' + b.unit.symbol);
  }
  return { kind: 'number', value: a.value / divisor };
};

export interface Scope {
  variables: Map<string, Value>;
  previous: Value | null;
  /** Every value produced so far, for `sum`. */
  history: Value[];
}

const runningTotal = (history: Value[]): Value => {
  let total: Value | null = null;
  for (const entry of history) {
    if (total === null) {
      total = entry;
      continue;
    }
    try {
      total = add(total, entry, 1);
    } catch {
      // A line in another dimension is skipped rather than poisoning the
      // whole total — a shopping list with a weight in it still adds up.
    }
  }
  return total ?? { kind: 'number', value: 0 };
};

const evaluateNode = (node: Node, scope: Scope): Value => {
  switch (node.type) {
    case 'number':
      return { kind: 'number', value: node.value };
    case 'quantity':
      return { kind: 'quantity', value: node.value, unit: node.unit };
    case 'percent':
      return { kind: 'percent', value: node.value };

    case 'variable': {
      const own = scope.variables.get(node.name);
      if (own) return own;
      if (RESERVED.has(node.name)) {
        if (node.name === 'sum' || node.name === 'total') {
          return runningTotal(scope.history);
        }
        if (!scope.previous) throw new EvalError('nothing above to refer to');
        return scope.previous;
      }
      throw new EvalError('"' + node.name + '" is not defined above');
    }

    case 'unary': {
      const operand = defuse(evaluateNode(node.operand, scope));
      if (operand.kind === 'quantity') {
        return { kind: 'quantity', value: -operand.value, unit: operand.unit };
      }
      return { kind: 'number', value: -operand.value };
    }

    case 'convert': {
      const operand = defuse(evaluateNode(node.operand, scope));
      if (operand.kind !== 'quantity') {
        throw new EvalError('there is no unit to convert from');
      }
      const converted = convert(operand.value, operand.unit, node.unit);
      if (converted === null) {
        throw new EvalError(
          'cannot convert ' + operand.unit.dimension + ' to ' + node.unit.dimension
        );
      }
      return { kind: 'quantity', value: converted, unit: node.unit };
    }

    case 'binary': {
      const left = evaluateNode(node.left, scope);
      const right = evaluateNode(node.right, scope);
      switch (node.op) {
        case '+':
          return add(left, right, 1);
        case '-':
          return add(left, right, -1);
        case '*':
          return multiply(left, right);
        case '/':
          return divide(left, right);
        case '^': {
          const base = defuse(left);
          const exponent = defuse(right);
          if (base.kind === 'quantity' || exponent.kind === 'quantity') {
            throw new EvalError('powers work on plain numbers only');
          }
          return { kind: 'number', value: base.value ** exponent.value };
        }
        default:
          throw new EvalError('unknown operator');
      }
    }

    default:
      throw new EvalError('cannot evaluate this');
  }
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const LOCALE = 'en-US';

const plain = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 4 });

const currencyFormatters = new Map<string, Intl.NumberFormat>();

const currencyFormatter = (code: string): Intl.NumberFormat => {
  const existing = currencyFormatters.get(code);
  if (existing) return existing;
  // Intl knows how many decimals each currency actually uses — yen has
  // none, dinars have three — so this is not a thing to hardcode.
  const formatter = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: code,
  });
  currencyFormatters.set(code, formatter);
  return formatter;
};

export const formatValue = (value: Value): string => {
  if (value.kind === 'percent') return plain.format(value.value) + '%';
  if (value.kind === 'number') {
    if (!Number.isFinite(value.value)) return '—';
    return plain.format(value.value);
  }

  if (!Number.isFinite(value.value)) return '—';

  if (value.unit.dimension === 'currency') {
    try {
      return currencyFormatter(value.unit.id).format(value.value);
    } catch {
      return plain.format(value.value) + ' ' + value.unit.symbol;
    }
  }

  const separator = value.unit.symbol.startsWith('°') ? ' ' : ' ';
  return plain.format(value.value) + separator + value.unit.symbol;
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type LineKind = 'value' | 'blank' | 'comment' | 'error';

export interface LineResult {
  kind: LineKind;
  /**
   * The line that produced this, carried alongside the answer.
   *
   * The two-column layout only pairs a sum with its result by position,
   * which works for someone looking at it and not at all for someone
   * hearing it — or for a phone, where the column moves underneath. Both
   * need the question attached to the answer.
   */
  source: string;
  /** What to show on the right of the line. */
  display: string;
  /** Set when the line assigned a name. */
  assigned: string | null;
  /** True when a currency took part, so the rates note can be shown. */
  usedCurrency: boolean;
  value: Value | null;
}

const touchesCurrency = (value: Value | null): boolean =>
  value?.kind === 'quantity' && value.unit.dimension === 'currency';

/**
 * Evaluates a whole scratchpad.
 *
 * Errors are per line and never stop the ones below: a half-typed line in
 * the middle is the normal state of this thing while someone is using it,
 * and blanking every result underneath on every keystroke would make it
 * unusable.
 */
export const evaluateDocument = (text: string): LineResult[] => {
  const scope: Scope = {
    variables: new Map<string, Value>(),
    previous: null,
    history: [],
  };

  return text.split('\n').map((line): LineResult => {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      return {
        kind: 'blank',
        source: line,
        display: '',
        assigned: null,
        usedCurrency: false,
        value: null,
      };
    }

    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return {
        kind: 'comment',
        source: line,
        display: '',
        assigned: null,
        usedCurrency: false,
        value: null,
      };
    }

    try {
      const known = new Set(scope.variables.keys());
      const parsed = parseLine(line, known, scope.previous !== null);

      if (!parsed.expression) {
        return {
          kind: 'comment',
          source: line,
          display: '',
          assigned: null,
          usedCurrency: false,
          value: null,
        };
      }

      // Deliberately NOT defused: a line that is just "13%" should print
      // as 13%, not as 0.13. The fraction only applies where a percent
      // meets arithmetic, which `add` and `multiply` handle themselves.
      const value = evaluateNode(parsed.expression, scope);

      scope.previous = value;
      scope.history.push(value);
      if (parsed.assignTo) scope.variables.set(parsed.assignTo, value);

      return {
        kind: 'value',
        source: line,
        display: formatValue(value),
        assigned: parsed.assignTo,
        usedCurrency: touchesCurrency(value),
        value,
      };
    } catch (error) {
      const message =
        error instanceof ParseError || error instanceof EvalError
          ? error.message
          : 'could not read this line';
      return {
        kind: 'error',
        source: line,
        display: message,
        assigned: null,
        usedCurrency: false,
        value: null,
      };
    }
  });
};

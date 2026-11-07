import { tokenize, type Token } from './tokenize';
import type { UnitDef } from './units';

/**
 * A precedence-climbing parser over one line.
 *
 * It produces a tree rather than evaluating as it goes, for one reason
 * worth stating: `+ 13%` has to mean "add thirteen percent *of the thing on
 * the left*", so the percent cannot be resolved until its sibling is known.
 * A tree makes that a two-line rule in the evaluator instead of a special
 * case threaded through the parse.
 */

export interface NumberNode {
  type: 'number';
  value: number;
}
export interface QuantityNode {
  type: 'quantity';
  value: number;
  unit: UnitDef;
}
export interface PercentNode {
  type: 'percent';
  value: number;
}
export interface VariableNode {
  type: 'variable';
  name: string;
}
export interface BinaryNode {
  type: 'binary';
  op: '+' | '-' | '*' | '/' | '^';
  left: Node;
  right: Node;
}
export interface UnaryNode {
  type: 'unary';
  op: '-';
  operand: Node;
}
export interface ConvertNode {
  type: 'convert';
  operand: Node;
  unit: UnitDef;
}

export type Node =
  | NumberNode
  | QuantityNode
  | PercentNode
  | VariableNode
  | BinaryNode
  | UnaryNode
  | ConvertNode;

export interface ParsedLine {
  /** Set when the line was `name = expression`. */
  assignTo: string | null;
  expression: Node | null;
}

export class ParseError extends Error {}

/**
 * Identifiers the evaluator supplies rather than the user.
 *
 * A user variable of the same name wins, which is why the scope is checked
 * before this set rather than after.
 */
export const RESERVED = new Set(['prev', 'previous', 'last', 'sum', 'total']);

class Parser {
  private readonly tokens: Token[];
  private position = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.position + offset];
  }

  private next(): Token | undefined {
    const token = this.tokens[this.position];
    this.position += 1;
    return token;
  }

  private atEnd(): boolean {
    return this.position >= this.tokens.length;
  }

  /** `in` / `to` / `as`, which bind loosest so they convert the whole line. */
  parseConversion(): Node {
    let left = this.parseAdditive();

    while (!this.atEnd()) {
      const token = this.peek();
      if (
        !token ||
        token.kind !== 'keyword' ||
        !['in', 'to', 'as'].includes(token.text)
      ) {
        break;
      }
      this.next();
      const target = this.next();
      if (!target || target.kind !== 'unit' || !target.unit) {
        throw new ParseError('expected a unit after "' + token.text + '"');
      }
      left = { type: 'convert', operand: left, unit: target.unit };
    }

    return left;
  }

  private parseAdditive(): Node {
    let left = this.parseMultiplicative();

    while (!this.atEnd()) {
      const token = this.peek();
      if (!token || token.kind !== 'operator') break;
      if (token.text !== '+' && token.text !== '-') break;
      this.next();
      const right = this.parseMultiplicative();
      left = { type: 'binary', op: token.text, left, right };
    }

    return left;
  }

  private parseMultiplicative(): Node {
    let left = this.parsePower();

    while (!this.atEnd()) {
      const token = this.peek();
      if (!token) break;

      // "13% of 200" — `of` is a multiply that reads like English.
      if (token.kind === 'keyword' && token.text === 'of') {
        this.next();
        const right = this.parsePower();
        left = { type: 'binary', op: '*', left, right };
        continue;
      }

      if (token.kind !== 'operator') break;
      if (token.text !== '*' && token.text !== '/') break;
      this.next();
      const right = this.parsePower();
      left = { type: 'binary', op: token.text, left, right };
    }

    return left;
  }

  private parsePower(): Node {
    const base = this.parseUnary();
    const token = this.peek();
    if (token && token.kind === 'operator' && token.text === '^') {
      this.next();
      // Right-associative: 2^3^2 is 2^(3^2).
      const exponent = this.parsePower();
      return { type: 'binary', op: '^', left: base, right: exponent };
    }
    return base;
  }

  private parseUnary(): Node {
    const token = this.peek();
    if (token && token.kind === 'operator' && token.text === '-') {
      this.next();
      return { type: 'unary', op: '-', operand: this.parseUnary() };
    }
    if (token && token.kind === 'operator' && token.text === '+') {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const token = this.next();
    if (!token) throw new ParseError('unexpected end of line');

    if (token.kind === 'lparen') {
      const inner = this.parseConversion();
      const closing = this.next();
      if (!closing || closing.kind !== 'rparen') {
        throw new ParseError('missing closing bracket');
      }
      return inner;
    }

    // A currency symbol written before its amount: $180, €1,250.
    if (token.kind === 'unit' && token.unit) {
      const following = this.peek();
      if (following && following.kind === 'number') {
        this.next();
        return {
          type: 'quantity',
          value: following.value ?? 0,
          unit: token.unit,
        };
      }
      throw new ParseError('"' + token.text + '" needs an amount');
    }

    if (token.kind === 'number') {
      const value = token.value ?? 0;

      // 13% — a percent is its own kind of value, not 0.13.
      const following = this.peek();
      if (following && following.kind === 'percent') {
        this.next();
        return { type: 'percent', value };
      }

      // 65 kg — a trailing unit attaches to the number before it.
      if (following && following.kind === 'unit' && following.unit) {
        this.next();
        return { type: 'quantity', value, unit: following.unit };
      }

      return { type: 'number', value };
    }

    if (token.kind === 'identifier') {
      return { type: 'variable', name: token.text.toLowerCase() };
    }

    throw new ParseError('did not expect "' + token.text + '"');
  }
}

/**
 * Drops the words that are labels rather than maths.
 *
 * An identifier survives only if it names something the evaluator can
 * actually resolve; anything else is a note the person wrote to themselves
 * and the arithmetic has to step over it. This is why scope has to reach
 * the parser rather than being purely an evaluation concern.
 */
const stripLabels = (tokens: Token[], known: ReadonlySet<string>): Token[] =>
  tokens.filter(
    (token) =>
      token.kind !== 'word' &&
      (token.kind !== 'identifier' ||
        known.has(token.text.toLowerCase()) ||
        RESERVED.has(token.text.toLowerCase()))
  );

export const parseLine = (
  line: string,
  known: ReadonlySet<string>,
  hasPrevious: boolean
): ParsedLine => {
  const raw = tokenize(line);

  // `name = ...` is an assignment. Checked before labels are stripped,
  // because the name being assigned is not in scope yet by definition.
  let assignTo: string | null = null;
  let body = raw;
  const first = raw[0];
  const second = raw[1];
  if (
    first &&
    second &&
    (first.kind === 'identifier' || first.kind === 'unit') &&
    second.kind === 'assign'
  ) {
    assignTo = first.text.toLowerCase();
    body = raw.slice(2);
  }

  // A name the user defined shadows a unit of the same spelling. Without
  // this, `hours = 12` assigns fine and then `rate * hours` reads `hours`
  // as the time unit and asks what amount it is supposed to have.
  const shadowed = body.map((token) =>
    token.kind === 'unit' && known.has(token.text.toLowerCase())
      ? { kind: 'identifier' as const, text: token.text }
      : token
  );

  const tokens = stripLabels(shadowed, known);
  if (tokens.length === 0) return { assignTo: null, expression: null };

  // A line that opens with an operator continues the one above it, which is
  // what makes a column of "+ 13% tax" lines read the way it looks.
  // `*` and `/` cannot start an expression, so they always continue the
  // line above. `+` and `-` can — "-5 + 2" is a negative five, not a
  // continuation — so those only continue when there is something to
  // continue from.
  const lead = tokens[0];
  const continues =
    lead?.kind === 'operator' &&
    (['*', '/'].includes(lead.text) ||
      (hasPrevious && ['+', '-'].includes(lead.text)));
  const effective: Token[] = continues
    ? [{ kind: 'identifier', text: 'prev' }, ...tokens]
    : tokens;

  const parser = new Parser(effective);
  const expression = parser.parseConversion();
  return { assignTo, expression };
};

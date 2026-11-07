import { findUnit, type UnitDef } from './units';
import './rates';

/**
 * Turns a line of the scratchpad into tokens.
 *
 * The thing that makes this feel like writing rather than programming is
 * that unknown words are kept as `word` tokens and the parser is free to
 * throw them away. "3 nights at $180" has to work, and so does the "tax"
 * in "+ 13% tax" — neither is a syntax error, both are labels a person
 * wrote for themselves.
 *
 * That tolerance has a price, and it is worth being honest about it: a
 * typo is a label too, so "20 kgg" quietly becomes 20 rather than an
 * error. The interface answers that by always showing what it computed, so
 * a wrong reading is visible rather than silent.
 */

export type TokenKind =
  | 'number'
  | 'unit'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'percent'
  | 'keyword'
  | 'identifier'
  | 'word'
  | 'assign';

export interface Token {
  kind: TokenKind;
  text: string;
  /** Set on `number`. */
  value?: number;
  /** Set on `unit`. */
  unit?: UnitDef;
}

/** Words that mean an operator rather than a label. */
const WORD_OPERATORS: Record<string, string> = {
  plus: '+',
  minus: '-',
  times: '*',
  x: '*',
  // "3 nights at $180" — "at" is the price-per-thing multiply.
  at: '*',
  divided: '/',
  over: '/',
  per: '/',
};

/** Words the parser gives its own meaning to. */
const KEYWORDS = new Set(['in', 'to', 'of', 'as', 'by']);

const CURRENCY_SYMBOLS = '$€£¥₹';

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

const isWordChar = (char: string): boolean => /[\p{L}\p{M}_]/u.test(char);

export const tokenize = (line: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;

  const push = (token: Token): void => {
    tokens.push(token);
  };

  while (i < line.length) {
    const char = line[i] ?? '';

    if (char === ' ' || char === '\t') {
      i += 1;
      continue;
    }

    // --- numbers, with thousands separators ------------------------------
    if (isDigit(char) || (char === '.' && isDigit(line[i + 1] ?? ''))) {
      let text = '';
      while (i < line.length) {
        const next = line[i] ?? '';
        if (isDigit(next) || next === '.') {
          text += next;
          i += 1;
        } else if (next === ',' && isDigit(line[i + 1] ?? '')) {
          // A separator, not a decimal comma: "1,250" is one number.
          i += 1;
        } else {
          break;
        }
      }
      // A bare `k`/`m` suffix, as people write 10k.
      const suffix = (line[i] ?? '').toLowerCase();
      let scale = 1;
      if ((suffix === 'k' || suffix === 'm') && !isWordChar(line[i + 1] ?? '')) {
        scale = suffix === 'k' ? 1e3 : 1e6;
        i += 1;
      }
      push({ kind: 'number', text, value: Number(text) * scale });
      continue;
    }

    // --- currency symbols, which bind to the number after them ------------
    if (CURRENCY_SYMBOLS.includes(char)) {
      const definition = findUnit(char);
      if (definition) push({ kind: 'unit', text: char, unit: definition });
      else push({ kind: 'word', text: char });
      i += 1;
      continue;
    }

    if (char === '%') {
      push({ kind: 'percent', text: '%' });
      i += 1;
      continue;
    }

    if ('+-*/^'.includes(char)) {
      push({ kind: 'operator', text: char });
      i += 1;
      continue;
    }

    if (char === '×') {
      push({ kind: 'operator', text: '*' });
      i += 1;
      continue;
    }
    if (char === '÷') {
      push({ kind: 'operator', text: '/' });
      i += 1;
      continue;
    }

    if (char === '(') {
      push({ kind: 'lparen', text: char });
      i += 1;
      continue;
    }
    if (char === ')') {
      push({ kind: 'rparen', text: char });
      i += 1;
      continue;
    }

    if (char === '=') {
      push({ kind: 'assign', text: '=' });
      i += 1;
      continue;
    }

    // --- words ------------------------------------------------------------
    if (isWordChar(char)) {
      let text = '';
      while (i < line.length && isWordChar(line[i] ?? '')) {
        text += line[i];
        i += 1;
      }
      const lower = text.toLowerCase();

      const wordOperator = WORD_OPERATORS[lower];
      if (wordOperator !== undefined) {
        push({ kind: 'operator', text: wordOperator });
        continue;
      }

      if (KEYWORDS.has(lower)) {
        push({ kind: 'keyword', text: lower });
        continue;
      }

      const definition = findUnit(text);
      if (definition) {
        push({ kind: 'unit', text, unit: definition });
        continue;
      }

      // Everything else is either a variable the user defined or a label.
      // The parser decides which, because only it knows the scope.
      push({ kind: 'identifier', text });
      continue;
    }

    // Anything left is punctuation a person typed for themselves.
    push({ kind: 'word', text: char });
    i += 1;
  }

  return tokens;
};

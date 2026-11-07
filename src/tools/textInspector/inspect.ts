/**
 * What a string actually is, as opposed to what it looks like.
 *
 * Every number here exists because it caused a real bug in Rabva. "How long
 * is this word" has at least four defensible answers in Arabic, and a data
 * model that picks the wrong one is wrong in a way that only shows up once
 * somebody types a diacritic.
 *
 * Nothing in this file is written as a literal character. Every range is a
 * code point, because the characters this tool is about are invisible — a
 * source file full of them is unreadable, unreviewable, and one careless
 * editor away from being silently corrupted.
 */

type Range = readonly [start: number, end: number];

/** Arabic combining marks: fathah through sukun, superscript alef, and the
 *  Quranic annotation marks above and below the line. */
const DIACRITIC_RANGES: readonly Range[] = [
  [0x064b, 0x0652],
  [0x0670, 0x0670],
  [0x06d6, 0x06ed],
];

/** Letters that carry a strong right-to-left direction. */
const RTL_RANGES: readonly Range[] = [
  [0x0590, 0x08ff], // Hebrew, Arabic, Syriac, Thaana, N'Ko, Samaritan
  [0xfb1d, 0xfdff], // Hebrew and Arabic presentation forms A
  [0xfe70, 0xfeff], // Arabic presentation forms B
];

/** Letters that carry a strong left-to-right direction. */
const LTR_RANGES: readonly Range[] = [
  [0x0041, 0x005a],
  [0x0061, 0x007a],
  [0x00c0, 0x024f], // Latin supplements and extensions
  [0x0370, 0x052f], // Greek and Cyrillic
];

/** Characters with no visible form, keyed by code point. */
const INVISIBLES = new Map<number, string>([
  [0x200b, 'ZERO WIDTH SPACE'],
  [0x200c, 'ZERO WIDTH NON-JOINER'],
  [0x200d, 'ZERO WIDTH JOINER'],
  [0x200e, 'LEFT-TO-RIGHT MARK'],
  [0x200f, 'RIGHT-TO-LEFT MARK'],
  [0x202a, 'LEFT-TO-RIGHT EMBEDDING'],
  [0x202b, 'RIGHT-TO-LEFT EMBEDDING'],
  [0x202c, 'POP DIRECTIONAL FORMATTING'],
  [0x202d, 'LEFT-TO-RIGHT OVERRIDE'],
  [0x202e, 'RIGHT-TO-LEFT OVERRIDE'],
  [0x2066, 'LEFT-TO-RIGHT ISOLATE'],
  [0x2067, 'RIGHT-TO-LEFT ISOLATE'],
  [0x2068, 'FIRST STRONG ISOLATE'],
  [0x2069, 'POP DIRECTIONAL ISOLATE'],
  [0xfeff, 'ZERO WIDTH NO-BREAK SPACE (BOM)'],
  [0x00a0, 'NO-BREAK SPACE'],
  [0x0640, 'ARABIC TATWEEL'],
]);

/** U+00B7 MIDDLE DOT — stands in for a character with no glyph. */
const MIDDLE_DOT = String.fromCodePoint(0x00b7);
/** U+25CC DOTTED CIRCLE — what a combining mark is meant to be shown on. */
const DOTTED_CIRCLE = String.fromCodePoint(0x25cc);

const inRanges = (point: number, ranges: readonly Range[]): boolean =>
  ranges.some(([start, end]) => point >= start && point <= end);

export interface Counts {
  /** `string.length` — what most code means by "length", and rarely right. */
  utf16: number;
  /** Actual Unicode characters. */
  codePoints: number;
  /** What a reader would call a character. */
  graphemes: number;
  /** Code points left once the combining marks are gone. */
  withoutDiacritics: number;
  /** Bytes once stored or sent. */
  utf8Bytes: number;
}

export interface CharInfo {
  /** The character itself, or a stand-in when it has no visible form. */
  display: string;
  codePoint: string;
  name: string | null;
  isInvisible: boolean;
  isDiacritic: boolean;
  script: string;
}

export interface Inspection {
  counts: Counts;
  /** True when NFC and NFD disagree — i.e. normalisation would change it. */
  normalisationMatters: boolean;
  nfcLength: number;
  nfdLength: number;
  /** Already NFC, so storing it unchanged is safe. */
  isNfc: boolean;
  strippedDiacritics: string;
  invisibles: CharInfo[];
  direction: 'rtl' | 'ltr';
  hasMixedDirection: boolean;
  characters: CharInfo[];
}

const scriptOf = (char: string): string => {
  // Script_Extensions, not Script. A combining mark's `Script` is
  // `Inherited` — it has no script of its own, it takes the one it is
  // sitting on — so `Script=Arabic` reports every Arabic diacritic as
  // "Other", which is exactly the wrong answer in a tool about diacritics.
  if (/\p{Script_Extensions=Arabic}/u.test(char)) return 'Arabic';
  if (/\p{Script_Extensions=Hebrew}/u.test(char)) return 'Hebrew';
  if (/\p{Script_Extensions=Latin}/u.test(char)) return 'Latin';
  if (/\p{Nd}/u.test(char)) return 'Digit';
  if (/\s/u.test(char)) return 'Space';
  return 'Other';
};

const utf8Length = (text: string): number =>
  new TextEncoder().encode(text).length;

const describe = (char: string): CharInfo => {
  const point = char.codePointAt(0) ?? 0;
  const invisibleName = INVISIBLES.get(point) ?? null;
  const isDiacritic = inRanges(point, DIACRITIC_RANGES);

  return {
    // A combining mark rendered on its own jumps onto whatever precedes it
    // in the table, so it is given a dotted circle to sit on.
    display: invisibleName
      ? MIDDLE_DOT
      : isDiacritic
        ? DOTTED_CIRCLE + char
        : char,
    codePoint: 'U+' + point.toString(16).toUpperCase().padStart(4, '0'),
    name: invisibleName,
    isInvisible: invisibleName !== null,
    isDiacritic,
    script: scriptOf(char),
  };
};

/** Splits into what a reader would call characters, not code units. */
const graphemesOf = (text: string): string[] => {
  const Segmenter = (
    Intl as unknown as { Segmenter?: typeof Intl.Segmenter }
  ).Segmenter;

  if (!Segmenter) {
    // Older Safari. Code points are a closer answer than UTF-16 units.
    return Array.from(text);
  }
  const segmenter = new Segmenter('en', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), (entry) => entry.segment);
};

const stripDiacritics = (text: string): string =>
  Array.from(text)
    .filter((char) => !inRanges(char.codePointAt(0) ?? 0, DIACRITIC_RANGES))
    .join('');

const hasAny = (text: string, ranges: readonly Range[]): boolean =>
  Array.from(text).some((char) =>
    inRanges(char.codePointAt(0) ?? 0, ranges)
  );

export const inspect = (text: string): Inspection => {
  const codePoints = Array.from(text);
  const nfc = text.normalize('NFC');
  const nfd = text.normalize('NFD');
  const stripped = stripDiacritics(nfc);

  const characters = codePoints.map(describe);

  const hasRtl = hasAny(text, RTL_RANGES);
  const hasLtr = hasAny(text, LTR_RANGES);

  return {
    counts: {
      utf16: text.length,
      codePoints: codePoints.length,
      graphemes: graphemesOf(text).length,
      withoutDiacritics: Array.from(stripped).length,
      utf8Bytes: utf8Length(text),
    },
    normalisationMatters: nfc !== nfd,
    nfcLength: Array.from(nfc).length,
    nfdLength: Array.from(nfd).length,
    isNfc: text === nfc,
    strippedDiacritics: stripped,
    invisibles: characters.filter((entry) => entry.isInvisible),
    direction: hasRtl ? 'rtl' : 'ltr',
    hasMixedDirection: hasRtl && hasLtr,
    characters,
  };
};

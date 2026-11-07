import type { Suite } from './types';

/**
 * The suite shipped with the bench.
 *
 * Honest about what it is: the outputs below are written by hand to
 * exercise the harness, not transcripts of a model run. The engineering on
 * display is the harness — the gates, the rate, the spread, the diff — and
 * inventing a record of real runs to dress it up would be the one thing
 * this whole discipline exists to prevent.
 *
 * The gates themselves are the shape I use on Rabva: a response is not
 * "good", it either satisfies the endpoint contract or it does not.
 */

/**
 * One Arabic word, and the same word decomposed.
 *
 * Built with `normalize` rather than typed twice, because the two forms are
 * visually identical — a second literal in this file would be unreviewable
 * and the next person to touch it would "fix" the difference away.
 *
 * `أ` is U+0623; under NFD it becomes U+0627 followed by U+0654. Same
 * glyph, different bytes, and `===` says they are not equal.
 */
const WORD = 'الْأَرْض';
const WORD_NFD = WORD.normalize('NFD');

const long = (gloss: string): string =>
  JSON.stringify({ gloss: gloss.repeat(3) });

export const RABVA_SUITE: Suite = {
  id: 'contract',
  name: 'Endpoint contract',
  description:
    'Three things an agent is asked for while building against a documented API, and the gates its answer has to clear before the work counts as done.',
  cases: [
    {
      id: 'record',
      name: 'Word record',
      input: 'Return the record for ' + WORD + ' in surah 2, ayah 22.',
      assertions: [
        {
          kind: 'json',
          requiredFields: ['surah', 'ayah', 'word', 'translation'],
          label: 'matches the response shape',
        },
        {
          kind: 'contains',
          value: WORD,
          label: 'Arabic comes back byte-exact',
        },
        {
          kind: 'numberWithin',
          path: 'ayah',
          min: 1,
          max: 286,
          label: 'ayah is a real ayah number',
        },
      ],
    },
    {
      id: 'root',
      name: 'Root lookup',
      input: 'Return the root of الْكِتَاب and how many verses share it.',
      assertions: [
        {
          kind: 'json',
          requiredFields: ['root', 'matches'],
          label: 'matches the response shape',
        },
        {
          kind: 'numberWithin',
          path: 'matches',
          min: 1,
          max: 2000,
          label: 'a count, not a word',
        },
        {
          kind: 'excludes',
          value: 'explanation',
          label: 'invents no field outside the contract',
        },
      ],
    },
    {
      id: 'gloss',
      name: 'Short gloss',
      input: 'A one-line English gloss for ' + WORD + '.',
      assertions: [
        {
          kind: 'maxLength',
          limit: 120,
          unit: 'codePoints',
          label: 'fits the card',
        },
        {
          kind: 'excludes',
          value: 'As an AI',
          label: 'no preamble',
        },
        { kind: 'contains', value: 'earth', label: 'actually glosses it' },
      ],
    },
  ],

  versions: [
    {
      id: 'v1',
      label: 'v1 — plain instruction',
      prompt:
        'You are helping build a Quran study API. Answer the request. Return JSON.',
      samples: {
        record: [
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          // Renders identically to the two above. Fails anyway, which is
          // the entire reason this gate does not normalise first.
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD_NFD,
            translation: 'the earth',
          }),
          // Fenced, which is not JSON however much it looks like it.
          '```json\n' +
            JSON.stringify({
              surah: 2,
              ayah: 22,
              word: WORD,
              translation: 'the earth',
            }) +
            '\n```',
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          // Plausible, well-formed, and surah 2 has 286 ayat.
          JSON.stringify({
            surah: 2,
            ayah: 300,
            word: WORD,
            translation: 'the earth',
          }),
        ],
        root: [
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({
            root: 'ك ت ب',
            matches: 319,
            explanation: 'The root k-t-b relates to writing and books.',
          }),
          // A count the contract says is a number.
          JSON.stringify({ root: 'ك ت ب', matches: 'many' }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({
            root: 'ك ت ب',
            matches: 319,
            explanation: 'Derived forms include kitab and maktab.',
          }),
        ],
        // Every run clears the gates. This is the case v2 breaks, and it
        // only reads as a regression because there was something to lose.
        gloss: [
          JSON.stringify({ gloss: 'the earth; the ground underfoot' }),
          JSON.stringify({ gloss: 'the earth, as opposed to the heavens' }),
          JSON.stringify({ gloss: 'the earth, the ground' }),
          JSON.stringify({ gloss: 'the earth' }),
          JSON.stringify({ gloss: 'the earth; land' }),
          JSON.stringify({ gloss: 'the earth or ground' }),
        ],
      },
    },
    {
      id: 'v2',
      label: 'v2 — contract restated',
      prompt:
        'You are helping build a Quran study API. Return only JSON matching the documented response shape, with no fields beyond it and no code fences. Reproduce Arabic exactly as given, byte for byte. Give the answer rich context.',
      samples: {
        record: [
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
          // "Byte for byte" in the prompt did not stop this. Telling a
          // model to preserve bytes does not give it control over the
          // normalisation its tokeniser applies.
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD_NFD,
            translation: 'the earth',
          }),
          JSON.stringify({
            surah: 2,
            ayah: 22,
            word: WORD,
            translation: 'the earth',
          }),
        ],
        root: [
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
          JSON.stringify({ root: 'ك ت ب', matches: 319 }),
        ],
        // The regression. "Give the answer rich context" fixed the other
        // two cases and pushed this one over the card limit — a change
        // that reads as an improvement in the summary and is not.
        gloss: [
          JSON.stringify({ gloss: 'the earth; the ground underfoot' }),
          long('the earth, the ground, the dry land set out as a resting '),
          long('the earth, in contrast with the heavens above it, the '),
          JSON.stringify({ gloss: 'the earth; land' }),
          JSON.stringify({ gloss: 'the earth, the ground' }),
          JSON.stringify({ gloss: 'the earth' }),
        ],
      },
    },
  ],
};

/**
 * The tools, as data.
 *
 * Kept apart from the page that renders them so the search index can read
 * the list without pulling a React tree — and so the page stays a file that
 * exports only a component, which is what keeps fast refresh working.
 */
export interface ToolEntry {
  id: string;
  name: string;
  tagline: string;
  /** What was actually hard about building it. */
  note: string;
  stack: string[];
}

export const TOOLS: ToolEntry[] = [
  {
    id: 'scratchpad',
    name: 'Scratchpad',
    tagline:
      'A calculator you write in sentences. Units, currencies and percentages, with each line able to refer to the ones above it.',
    note: 'A hand-written tokeniser and precedence-climbing parser, with no parsing library. It runs entirely in this tab — nothing you type leaves the browser, which is also why the exchange rates are a dated snapshot rather than a live feed: a live one would mean an API key published to everyone who opens the network tab.',
    stack: [
      'TypeScript',
      'Parser',
      'Tokeniser',
      'Intl.NumberFormat',
      'React 18',
      'localStorage',
    ],
  },
  {
    id: 'text-inspector',
    name: 'Text Inspector',
    tagline:
      'What a string is really made of: code points, graphemes, normalisation forms, and the invisible characters hiding in it.',
    note: 'Built out of three bugs that each cost me a day on Rabva. Arabic diacritics are separate code points, so string length is not character count; the same word stored in two normalisation forms renders identically and compares unequal; and a right-to-left override you cannot see reorders everything after it.',
    stack: [
      'TypeScript',
      'Unicode',
      'Intl.Segmenter',
      'Normalisation',
      'RTL',
      'React 18',
    ],
  },
];

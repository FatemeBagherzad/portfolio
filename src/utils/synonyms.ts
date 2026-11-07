/**
 * The short names people actually type, mapped to what the site calls things.
 *
 * Search matches substrings, which quietly covers a lot of this already:
 * "mongo" is inside "MongoDB", "ec2" is inside "AWS EC2", "css" is inside
 * "SCSS". What it cannot do is connect two spellings of the same thing that
 * share no letters in the right order — "js" is not inside "JavaScript" —
 * so a visitor types the abbreviation every developer uses and the site
 * answers that it knows nothing about it.
 *
 * Each group is a set of equal names for one thing. Typing any member finds
 * all of them, so the table does not have to be written twice.
 *
 * Two rules keep this honest:
 *
 * 1. Every member must name the SAME technology. This is a spelling table,
 *    not a related-topics table. Mapping "node" to "javascript" would make
 *    the site answer a question it was not asked, and would quietly claim
 *    adjacency that the work does not.
 * 2. At least one member must appear in the site's own content, or the
 *    entry is dead weight that still costs a lookup on every keystroke.
 */
const GROUPS: readonly (readonly string[])[] = [
  // Abbreviations.
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['py', 'python'],
  ['a11y', 'accessibility'],
  ['drf', 'django rest framework'],
  ['nodejs', 'node.js'],
  ['reactjs', 'react'],
  ['sass', 'scss'],

  // The site writes these the British way. Someone typing the American
  // spelling is asking for something that is here, and should be told so.
  ['i18n', 'internationalisation', 'internationalization'],
  ['optimisation', 'optimization'],
  ['normalisation', 'normalization'],
  ['tokeniser', 'tokenizer'],
];

const BY_TERM = new Map<string, readonly string[]>();
for (const group of GROUPS) {
  for (const term of group) BY_TERM.set(term, group);
}

/**
 * Every form of one typed word.
 *
 * Looked up whole, never by prefix, so expansion starts exactly when the
 * word is complete: typing "j" searches for "j", and "js" searches for both.
 */
export const expandTerm = (word: string): readonly string[] =>
  BY_TERM.get(word) ?? [word];

/** The words of a query, each expanded to its equivalent forms. */
export const queryGroups = (query: string): readonly (readonly string[])[] =>
  query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(expandTerm);

/**
 * True when every word of the query is present in some form.
 *
 * An AND across words and an OR within each word's forms. Shared by the
 * header search and the Deep Dives filter: the header hands that page a
 * term through `?q=`, so if the two disagreed about what "js" means, a
 * result you clicked would land on a page that then claimed to find
 * nothing.
 */
export const matchesQuery = (haystack: string, query: string): boolean =>
  queryGroups(query).every((forms) =>
    forms.some((form) => haystack.includes(form))
  );

/**
 * Every form the highlighter should mark, longest first.
 *
 * Longest first matters: with the pattern `(js|javascript)` the alternation
 * is tried left to right at each position, so a shorter form that is a
 * prefix of a longer one would mark only part of the word.
 */
export const highlightTerms = (query: string): string[] =>
  [...new Set(queryGroups(query).flat())].sort((a, b) => b.length - a.length);

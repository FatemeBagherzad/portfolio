import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { highlightTerms } from './synonyms';

/** Escapes a user-typed term so it cannot act as a regular expression. */
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wraps every occurrence of the query's words in `<mark>`.
 *
 * Built by splitting on a capturing group, which keeps the separators in the
 * result, so the original text is reassembled exactly — including its
 * original casing. Matching lowercase and rendering the matched slice means
 * searching "arabic" still displays "Arabic".
 *
 * The query is escaped before it reaches the RegExp constructor; without
 * that, typing a bare "(" would throw and blank the page.
 */
export const highlight = (text: string, query: string): ReactNode => {
  // The expanded forms, not the raw words: searching "js" matches a record
  // through the word "JavaScript", and marking only the letters typed would
  // show a result with nothing highlighted — which reads as a mis-hit.
  const terms = highlightTerms(query);
  if (terms.length === 0) return text;

  const pattern = new RegExp(
    '(' + terms.map(escapeRegExp).join('|') + ')',
    'gi'
  );
  const lookup = new Set(terms);

  return text.split(pattern).map((part, index) =>
    lookup.has(part.toLowerCase()) ? (
      <mark key={index}>{part}</mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
};

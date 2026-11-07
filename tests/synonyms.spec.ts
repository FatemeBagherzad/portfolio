import { expect, test } from '@playwright/test';
import {
  expandTerm,
  highlightTerms,
  matchesQuery,
  queryGroups,
} from '../src/utils/synonyms';

/**
 * The abbreviations people type, with no browser involved.
 *
 * The site writes "JavaScript"; developers type "js". Substring matching
 * covers a surprising amount of this already — "mongo" is inside "MongoDB"
 * — so these are aimed squarely at the pairs that share no letters in the
 * right order, which is the only case the table exists for.
 *
 * Only `synonyms.ts` is imported here. Pulling in the search index would
 * drag the content JSON along with it, which Node will not import without
 * an attribute; the site-level behaviour is asserted in search.spec.ts
 * against the real page instead.
 */

test.describe('expansion', () => {
  test('a known abbreviation brings its full name with it', () => {
    expect([...expandTerm('js')]).toContain('javascript');
    expect([...expandTerm('ts')]).toContain('typescript');
    expect([...expandTerm('py')]).toContain('python');
  });

  test('it works in both directions without a second table', () => {
    expect([...expandTerm('javascript')]).toContain('js');
  });

  test('an unknown word is left exactly as typed', () => {
    expect([...expandTerm('docker')]).toEqual(['docker']);
    expect([...expandTerm('zzz')]).toEqual(['zzz']);
  });

  test('expansion needs the whole word, not a prefix', () => {
    // Typing towards "js" must not start matching JavaScript at "j", or
    // the list would reorder under the fingers mid-word.
    expect([...expandTerm('j')]).toEqual(['j']);
    expect([...expandTerm('jsx')]).toEqual(['jsx']);
  });

  test('each word of a multi-word query expands on its own', () => {
    const groups = queryGroups('js docker');
    expect(groups).toHaveLength(2);
    expect([...(groups[0] ?? [])]).toContain('javascript');
    expect([...(groups[1] ?? [])]).toEqual(['docker']);
  });

  test('an empty query expands to nothing', () => {
    expect(queryGroups('   ')).toEqual([]);
  });
});

test.describe('matching', () => {
  test('every word must be present, in some spelling', () => {
    const hay = 'built with javascript and docker';
    expect(matchesQuery(hay, 'js')).toBe(true);
    expect(matchesQuery(hay, 'js docker')).toBe(true);
    // AND, not OR: one missing word fails the whole query.
    expect(matchesQuery(hay, 'js terraform')).toBe(false);
  });

  test('the American spelling finds the British one the site uses', () => {
    expect(matchesQuery('query optimisation', 'optimization')).toBe(true);
    expect(matchesQuery('normalisation', 'normalization')).toBe(true);
    expect(matchesQuery('internationalisation', 'i18n')).toBe(true);
  });

  test('a multi-word expansion is matched as a phrase', () => {
    expect(matchesQuery('django rest framework', 'drf')).toBe(true);
    expect(matchesQuery('django and a rest framework', 'drf')).toBe(false);
  });
});

test.describe('highlighting', () => {
  test('the form that will be marked is the one in the text', () => {
    expect(highlightTerms('js')).toContain('javascript');
  });

  test('longer forms come first', () => {
    // `(js|javascript)` would mark only the first two letters of the word,
    // because the alternation is tried left to right at each position.
    const terms = highlightTerms('js');
    expect(terms.indexOf('javascript')).toBeLessThan(terms.indexOf('js'));
  });

  test('a word with no abbreviation is marked as typed', () => {
    expect(highlightTerms('docker')).toEqual(['docker']);
  });
});

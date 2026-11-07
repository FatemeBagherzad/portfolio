import projectsData from '../assets/projects-data/projects.json';
import challengesData from '../assets/projects-data/challenges.json';
import type { Challenge, Project } from '../types';
import { HERO_STACK } from '../constants/stack';

export type ResultKind = 'Project' | 'Deep dive' | 'Page';

export interface SearchRecord {
  id: string;
  kind: ResultKind;
  title: string;
  /** Where it lives — the project it belongs to, or its section. */
  context: string;
  /** Everything searchable, already lower-cased. */
  haystack: string;
  /** The prose a snippet is cut from. */
  body: string;
  tags: string[];
  href: string;
  /** Added once to a record's score, regardless of the query. */
  boost: number;
}

export interface SearchResult extends SearchRecord {
  score: number;
  /** A short extract of `body` around the first match. */
  snippet: string;
  /**
   * The tags that matched, if any.
   *
   * Searching "python" matches the home page through its stack chip, not
   * through a sentence — so without this the result would appear with none
   * of the query highlighted anywhere, looking like a mistake.
   */
  matchedTags: string[];
}

// ---------------------------------------------------------------------------
// Ranking weights
// ---------------------------------------------------------------------------
// Ordered deliberately. A title match outranks everything, because searching
// "rabva" should open Rabva — not one of the nine write-ups that merely
// belong to it. A stack tag comes next, since that is how a technology is
// claimed rather than mentioned. Occurrences in prose are worth a single
// point each: they break ties without ever overturning the signals above.

/** A hit in the record's own name. */
const TITLE_WEIGHT = 24;
/** A hit in a stack tag or the owning project. */
const TAG_WEIGHT = 6;
/** The tag is the search term exactly, not merely contains it. */
const EXACT_TAG_BONUS = 4;
/** Carried by the two projects the site leads with. */
const SELECTED_BOOST = 8;
/** Pushes a whole page below a specific project or write-up. */
const PAGE_PENALTY = 4;

const projects = projectsData as Project[];
const challenges = challengesData as Challenge[];

/**
 * The pages whose own prose names technologies the JSON does not.
 *
 * Python and Django are the reason this exists: both are claimed on the site
 * — Python as a hero chip, Django in the About copy — while neither appears
 * in any project's stack. Without these records, typing the word a visitor
 * has just read on the page would return nothing, which reads as a broken
 * search rather than an honest one.
 *
 * `body` is a deliberately short summary, not a copy of the page. A copy
 * would be a second source of truth that silently goes stale; a summary is
 * small enough to notice when it stops being true.
 */
const PAGES: readonly Omit<SearchRecord, 'haystack'>[] = [
  {
    id: 'page-home',
    kind: 'Page',
    title: 'Home',
    context: 'Overview',
    body: 'Full-stack developer in Toronto building complex interactive interfaces — multilingual, right-to-left, accessible, mobile-first — and the APIs and data models behind them.',
    tags: [...HERO_STACK],
    href: '/',
    // A page is where you look when nothing more specific matched, so it
    // sits below the work rather than above it.
    boost: -PAGE_PENALTY,
  },
  {
    id: 'page-about',
    kind: 'Page',
    title: 'About',
    context: 'Background',
    body: 'Background, how I work, and what I am looking for: a full-time front-end or full-stack role in Toronto or remote. Covers the Quran study platform behind Rabva, its Django API, and directing AI coding agents against a specification I wrote.',
    tags: ['Django', 'Python', 'Toronto', 'Rabva'],
    href: '/about-me',
    boost: -PAGE_PENALTY,
  },
];

/**
 * One flat index over everything on the site.
 *
 * Built once at module load rather than per keystroke: the content is static
 * JSON, so there is nothing to invalidate, and rebuilding it on every
 * character typed would be pure waste.
 */
const RECORDS: SearchRecord[] = [
  ...projects.map<SearchRecord>((project) => ({
    id: 'project-' + String(project.id),
    kind: 'Project',
    title: project.title,
    context: project.period,
    body: project.tagline + ' ' + project.description,
    tags: project.stack,
    haystack: [
      project.title,
      project.tagline,
      project.description,
      project.stack.join(' '),
      project.period,
    ]
      .join(' ')
      .toLowerCase(),
    // Opens straight to that project rather than dropping you on the index.
    href: '/projects?project=' + String(project.id),
    // Coursework mentions React more often than Rabva does, simply because
    // its write-up is shorter and more repetitive. Without this, a search
    // for a common technology leads with a bootcamp exercise instead of the
    // work worth being judged on.
    boost: project.category === 'selected' ? SELECTED_BOOST : 0,
  })),

  ...challenges.map<SearchRecord>((challenge) => ({
    id: 'dive-' + String(challenge.id),
    kind: 'Deep dive',
    title: challenge.title,
    context: challenge.project,
    body: challenge.description,
    // The owning project first, then what the problem was actually solved
    // with — so "terraform" finds the AWS write-up and not the other
    // eighteen that merely belong to the same project.
    tags: [challenge.project, ...challenge.stack],
    haystack: [
      challenge.title,
      challenge.description,
      challenge.project,
      challenge.stack.join(' '),
    ]
      .join(' ')
      .toLowerCase(),
    href: '/deep-dives',
    boost: 0,
  })),

  ...PAGES.map<SearchRecord>((page) => ({
    ...page,
    haystack: [page.title, page.body, page.tags.join(' ')]
      .join(' ')
      .toLowerCase(),
  })),
];

const terms = (query: string): string[] =>
  query.trim().toLowerCase().split(/\s+/).filter(Boolean);

/** Cuts a readable extract of `body` around the first match. */
const snippetFor = (body: string, word: string): string => {
  const at = body.toLowerCase().indexOf(word);
  if (at === -1) return body.slice(0, 120).trim() + '…';

  const start = Math.max(0, at - 55);
  const end = Math.min(body.length, at + word.length + 85);
  return (
    (start > 0 ? '…' : '') +
    body.slice(start, end).trim() +
    (end < body.length ? '…' : '')
  );
};

/**
 * Ranked search across projects and write-ups.
 *
 * Every word of the query must appear somewhere in a record — an AND, not an
 * OR — because "react docker" should find the thing that mentions both, not
 * everything that mentions either.
 *
 * Scoring uses the weights defined at the top of this file.
 */
export const searchSite = (query: string, limit = 12): SearchResult[] => {
  const words = terms(query);
  if (words.length === 0) return [];

  const results: SearchResult[] = [];

  for (const record of RECORDS) {
    let score = 0;
    let matchedAll = true;

    for (const word of words) {
      if (!record.haystack.includes(word)) {
        matchedAll = false;
        break;
      }
      if (record.title.toLowerCase().includes(word)) score += TITLE_WEIGHT;
      if (record.tags.some((tag) => tag.toLowerCase().includes(word))) {
        score += TAG_WEIGHT;
      }
      // An exact tag, e.g. searching "react" against the React chip.
      if (record.tags.some((tag) => tag.toLowerCase() === word)) {
        score += EXACT_TAG_BONUS;
      }
      score += record.body.toLowerCase().split(word).length - 1;
    }

    if (!matchedAll) continue;

    results.push({
      ...record,
      score: score + record.boost,
      snippet: snippetFor(record.body, words[0] ?? ''),
      matchedTags: record.tags.filter((tag) =>
        words.some((word) => tag.toLowerCase().includes(word))
      ),
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
};

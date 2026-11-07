import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './DeepDives.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import type { Challenge } from '../../types';
import Reveal from '../../components/Reveal/Reveal';
import { useWindowVirtualList } from '../../hooks/useWindowVirtualList';
import { highlight } from '../../utils/highlight';

const challenges = challengesData as Challenge[];

const ALL = 'All';

/**
 * Below this many rows, rendering everything costs less than the bookkeeping
 * windowing requires — and it keeps find-in-page working. Above it, the
 * list switches to windowing. Filtering can move the list across the
 * threshold in either direction.
 */
const VIRTUALIZE_ABOVE = 20;

/** Breathing room between the sticky bars and a linked-to card. */
const GAP_BELOW_BARS = 16;

/** A generous estimate; real heights replace it as rows are measured. */
const ESTIMATED_ROW_HEIGHT = 300;

const matches = (challenge: Challenge, query: string): boolean => {
  if (query.length === 0) return true;
  const haystack = (
    challenge.title +
    ' ' +
    challenge.description +
    ' ' +
    challenge.project +
    ' ' +
    challenge.stack.join(' ')
  ).toLowerCase();
  // Every word must appear somewhere, in any order.
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

interface CardProps {
  challenge: Challenge;
  position: number;
  total: number;
  /** Current search text, so matches can be marked in the card. */
  query: string;
  /** True while this is the write-up the visitor was linked to. */
  targeted: boolean;
}

const DeepDiveCard = ({
  challenge,
  position,
  total,
  query,
  targeted,
}: CardProps) => (
  <article
    id={'dive-' + String(challenge.id)}
    className={
      'deep-dives__card' + (targeted ? ' deep-dives__card--targeted' : '')
    }
    // A windowed list only has some of its rows in the DOM, so assistive
    // technology is told the real size and position explicitly.
    aria-setsize={total}
    aria-posinset={position}
  >
    <p className="chip chip--label deep-dives__card-tag">{challenge.project}</p>
    <h2 className="deep-dives__card-title">
      {highlight(challenge.title, query)}
    </h2>
    <p className="deep-dives__card-txt">
      {highlight(challenge.description, query)}
    </p>
    <ul className="deep-dives__card-stack" aria-label="Solved with">
      {challenge.stack.map((tech) => (
        <li className="chip" key={tech}>
          {highlight(tech, query)}
        </li>
      ))}
    </ul>
  </article>
);

const DeepDives = () => {
  // `?q=` lets the header search hand this page a term: the field arrives
  // filled in and the matches arrive highlighted, which also makes a
  // filtered view something you can link to or reload.
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState<string>(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // `?dive=` is how the home page's preview cards hand this page a specific
  // write-up. The whole list still renders — the other twenty-five are the
  // reason to be on this page — but the one that was clicked is scrolled to
  // and marked, so the click visibly arrives somewhere.
  const diveParam = searchParams.get('dive');
  const targetId = diveParam === null ? null : Number(diveParam);
  const [project, setProject] = useState<string>(ALL);
  const listRef = useRef<HTMLDivElement>(null);
  const searchId = useId();

  const projects = useMemo<string[]>(() => {
    const unique = new Set(challenges.map((challenge) => challenge.project));
    return [ALL, ...Array.from(unique)];
  }, []);

  const results = useMemo<Challenge[]>(
    () =>
      challenges.filter(
        (challenge) =>
          (project === ALL || challenge.project === project) &&
          matches(challenge, query.trim())
      ),
    [project, query]
  );

  const virtualize = results.length > VIRTUALIZE_ABOVE;
  // Hooks cannot be conditional, so the count is zeroed when windowing is
  // off rather than the hook being skipped.
  const virtual = useWindowVirtualList(
    listRef,
    virtualize ? results.length : 0,
    ESTIMATED_ROW_HEIGHT
  );

  const { scrollToIndex } = virtual;

  /**
   * Scrolls a linked-to write-up into view.
   *
   * Windowing is what makes this more than one `scrollIntoView` call: a row
   * far down the list is not in the DOM yet, so there is nothing to scroll
   * to. The virtualiser's estimated offset gets the window close enough for
   * that row to render, and only then can the real element correct the
   * landing — the estimate is 300px against cards that run from 220 to 400.
   */
  useEffect(() => {
    if (targetId === null) return;

    const index = results.findIndex((challenge) => challenge.id === targetId);
    // Filtered out, or not a real id: leave the page where it is rather
    // than scrolling somewhere arbitrary.
    if (index === -1) return;

    let frame = 0;
    let attempts = 0;
    let lastTop = Number.NaN;
    let stableFrames = 0;

    const settle = (): void => {
      attempts += 1;
      const node = document.getElementById('dive-' + String(targetId));

      if (node) {
        // Two things sit over the top of the list: the fixed header, and
        // the controls bar, which is sticky directly beneath it. Measuring
        // both beats a CSS guess, because the controls are one row on a
        // desktop and a taller stacked column on a phone.
        const header = document.querySelector('.menu');
        const controls = document.querySelector('.deep-dives__controls');
        const obscured =
          (header?.getBoundingClientRect().height ?? 0) +
          (controls?.getBoundingClientRect().height ?? 0);

        const top = node.getBoundingClientRect().top;
        window.scrollTo({
          top: Math.max(0, window.scrollY + top - obscured - GAP_BELOW_BARS),
          behavior: 'instant',
        });

        // One pass is not enough. Every row above this one is still being
        // measured, and each measurement that replaces the 300px estimate
        // with a real height moves this card — so anchoring once lands
        // close and then drifts. Re-anchor until the position holds still
        // for three frames, which is when the measurements have finished.
        const settled = node.getBoundingClientRect().top;
        stableFrames = Math.abs(settled - lastTop) < 1 ? stableFrames + 1 : 0;
        lastTop = settled;
        if (stableFrames >= 3) return;
      }

      // Roughly a second and a half at 60fps. A phone needs most of it:
      // the cards are two to three times taller there, so more of them are
      // re-measured before the offsets above the target stop moving.
      if (attempts < 90) frame = requestAnimationFrame(settle);
    };

    if (virtualize) scrollToIndex(index);
    frame = requestAnimationFrame(settle);

    return () => cancelAnimationFrame(frame);
  }, [targetId, results, virtualize, scrollToIndex]);

  return (
    <div className="deep-dives container section">
      <p className="eyebrow">Engineering notes</p>
      <h1 className="deep-dives__title">Deep Dives</h1>
      <p className="lede deep-dives__intro">
        Problems from my own work that took real digging to solve — what
        broke, why, and what I changed. The Rabva ones are the closest thing
        I have to a technical interview on paper.
      </p>

      <div className="deep-dives__controls">
        <div className="deep-dives__search">
          <label className="visually-hidden" htmlFor={searchId}>
            Search the write-ups
          </label>
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            id={searchId}
            type="search"
            className="deep-dives__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by anything"
            autoComplete="off"
          />
        </div>

        <div className="deep-dives__filters" role="group" aria-label="Filter by project">
          {projects.map((name) => (
            <button
              key={name}
              type="button"
              className={
                'deep-dives__filter' +
                (project === name ? ' deep-dives__filter--on' : '')
              }
              aria-pressed={project === name}
              onClick={() => setProject(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <p className="deep-dives__count" role="status">
        {String(results.length)}{' '}
        {results.length === 1 ? 'write-up' : 'write-ups'}
        {virtualize ? ' · windowed' : ''}
      </p>

      {virtualize ? (
        <div
          ref={listRef}
          className="deep-dives__list"
          role="list"
          style={{ height: String(virtual.totalHeight) + 'px' }}
        >
          {virtual.items.map((item) => {
            const challenge = results[item.index];
            if (!challenge) return null;
            return (
              <div
                key={challenge.id}
                role="listitem"
                ref={virtual.measureRef(item.index)}
                className="deep-dives__row"
                style={{ transform: 'translateY(' + String(item.start) + 'px)' }}
              >
                <DeepDiveCard
                  challenge={challenge}
                  position={item.index + 1}
                  total={results.length}
                  query={query}
                  targeted={challenge.id === targetId}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div ref={listRef} className="deep-dives__list-static" role="list">
          {results.map((challenge, index) => (
            <Reveal
              key={challenge.id}
              as="div"
              order={index}
              className="deep-dives__row-static"
            >
              <div role="listitem">
                <DeepDiveCard
                  challenge={challenge}
                  position={index + 1}
                  total={results.length}
                  query={query}
                  targeted={challenge.id === targetId}
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <p className="deep-dives__empty">
          Nothing matches that yet. Try “arabic”, “docker” or “agents”.
        </p>
      )}
    </div>
  );
};

export default DeepDives;

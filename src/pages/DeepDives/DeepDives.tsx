import { useId, useMemo, useRef, useState } from 'react';
import './DeepDives.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import type { Challenge } from '../../types';
import Reveal from '../../components/Reveal/Reveal';
import { useWindowVirtualList } from '../../hooks/useWindowVirtualList';

const challenges = challengesData as Challenge[];

const ALL = 'All';

/**
 * Below this many rows, rendering everything costs less than the bookkeeping
 * windowing requires — and it keeps find-in-page working. Above it, the
 * list switches to windowing. Filtering can move the list across the
 * threshold in either direction.
 */
const VIRTUALIZE_ABOVE = 20;

/** A generous estimate; real heights replace it as rows are measured. */
const ESTIMATED_ROW_HEIGHT = 260;

const matches = (challenge: Challenge, query: string): boolean => {
  if (query.length === 0) return true;
  const haystack = (
    challenge.title +
    ' ' +
    challenge.description +
    ' ' +
    challenge.project
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
}

const DeepDiveCard = ({ challenge, position, total }: CardProps) => (
  <article
    className="deep-dives__card"
    // A windowed list only has some of its rows in the DOM, so assistive
    // technology is told the real size and position explicitly.
    aria-setsize={total}
    aria-posinset={position}
  >
    <p className="deep-dives__card-tag">{challenge.project}</p>
    <h2 className="deep-dives__card-title">{challenge.title}</h2>
    <p className="deep-dives__card-txt">{challenge.description}</p>
  </article>
);

const DeepDives = () => {
  const [query, setQuery] = useState<string>('');
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
            placeholder="Search by anything — rtl, utf8mb4, agents…"
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

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import './SiteSearch.scss';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import { searchSite, type SearchResult } from '../../utils/searchIndex';
import { highlight } from '../../utils/highlight';

/**
 * Search across everything on the site — projects, written deep dives and
 * the tools — from a single field in the header.
 *
 * It is a real combobox, not an input with a div under it: the input keeps
 * focus the whole time while `aria-activedescendant` moves the selection, so
 * a screen reader reads each result as you arrow through it and typing never
 * stops working. That is the pattern the ARIA spec describes for this, and
 * the reason the arrow keys do not move the caret here.
 *
 * One instance, in the bar, at every width. It used to be hidden on phones
 * with a second copy inside the mobile menu, which meant the field was two
 * taps away on the devices most likely to be looking for it — and two
 * comboboxes on the page, only one of them reachable.
 */
const SiteSearch = () => {
  const transitionNavigate = useTransitionNavigate();
  const [query, setQuery] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [active, setActive] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const listId = 'site-search-list-' + uid;

  // The index is static, so this is only recomputed when the text changes.
  const results = useMemo<SearchResult[]>(() => searchSite(query), [query]);
  const expanded = open && query.trim().length > 0;

  const close = useCallback((): void => {
    setOpen(false);
    setActive(-1);
  }, []);

  const choose = useCallback(
    (result: SearchResult | undefined): void => {
      if (!result) return;
      // A write-up opens its page already filtered by what was typed, so
      // the words are highlighted in context and the neighbouring hits for
      // the same technology are right there rather than lost.
      const href =
        result.kind === 'Deep dive'
          ? result.href + '?q=' + encodeURIComponent(query.trim())
          : result.href;

      setQuery('');
      close();
      transitionNavigate(href);
    },
    [close, query, transitionNavigate]
  );

  // A click anywhere else dismisses the list. `pointerdown` rather than
  // `click`, so the list is gone before the click lands on whatever is
  // underneath it.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, close]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      // First Escape closes the list, a second clears the field — so the
      // key never feels like it did nothing.
      if (expanded) close();
      else setQuery('');
      return;
    }

    if (event.key === 'Enter') {
      if (expanded && active >= 0) {
        event.preventDefault();
        choose(results[active]);
      }
      return;
    }

    if (results.length === 0) return;

    const move = (next: number): void => {
      event.preventDefault();
      setOpen(true);
      setActive(next);
    };

    switch (event.key) {
      case 'ArrowDown':
        move(active + 1 >= results.length ? 0 : active + 1);
        break;
      case 'ArrowUp':
        move(active <= 0 ? results.length - 1 : active - 1);
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(results.length - 1);
        break;
      default:
        break;
    }
  };

  const activeId = active >= 0 ? listId + '-option-' + String(active) : undefined;

  return (
    <div className="site-search" ref={rootRef} role="search">
      <div className="site-search__field">
        <svg
          className="site-search__icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
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
          ref={inputRef}
          className="site-search__input"
          type="text"
          // `search` would add the browser's own clear button on top of
          // this one, in a style that cannot be themed.
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label="Search projects and deep dives by technology"
          placeholder="Search the stack…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {query.length > 0 && (
          <button
            type="button"
            className="site-search__clear"
            aria-label="Clear the search"
            onClick={() => {
              setQuery('');
              close();
              inputRef.current?.focus();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Announced without stealing focus, so a screen-reader user knows
          the list changed under them as they type.

          `aria-live` rather than `role="status"`: the two announce
          identically, but the role would put a second generic status region
          on every page of the site, where a page's own count already has
          one. */}
      <p className="visually-hidden" aria-live="polite">
        {expanded
          ? String(results.length) +
            (results.length === 1 ? ' result' : ' results') +
            ' for ' +
            query.trim()
          : ''}
      </p>

      <ul
        className="site-search__results"
        id={listId}
        role="listbox"
        aria-label="Search results"
        hidden={!expanded}
      >
        {results.map((result, index) => (
          <li
            key={result.id}
            id={listId + '-option-' + String(index)}
            role="option"
            aria-selected={index === active}
            className={
              'site-search__result' +
              (index === active ? ' site-search__result--active' : '')
            }
            // The input must keep focus for the combobox to work, so the
            // press is handled before the browser can move it away.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(result)}
            onMouseEnter={() => setActive(index)}
          >
            <span className="site-search__result-head">
              <span className="chip chip--label site-search__kind">
                {result.kind}
              </span>
              <span className="site-search__result-title">
                {highlight(result.title, query)}
              </span>
            </span>
            <span className="site-search__result-snippet">
              {highlight(result.snippet, query)}
            </span>

            {result.matchedTags.length > 0 && (
              // Without this, a result matched only through its stack would
              // show nothing highlighted and look like a mis-hit.
              <span className="site-search__tags">
                {result.matchedTags.slice(0, 4).map((tag) => (
                  <span className="chip site-search__tag" key={tag}>
                    {highlight(tag, query)}
                  </span>
                ))}
              </span>
            )}
            <span className="site-search__result-context">
              {result.kind === 'Deep dive'
                ? 'From ' + result.context
                : result.context}
            </span>
          </li>
        ))}

        {results.length === 0 && (
          // Not an option: there is nothing here to select.
          <li className="site-search__empty" role="presentation">
            {/* Named from what the index actually contains, so the
                suggestion cannot send someone to another empty result. */}
            Nothing matches <strong>{query.trim()}</strong>. Try React,
            Node, MySQL or Docker.
          </li>
        )}
      </ul>
    </div>
  );
};

export default SiteSearch;

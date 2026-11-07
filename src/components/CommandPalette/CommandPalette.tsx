import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import './CommandPalette.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import type { Challenge } from '../../types';
import { paletteStore, usePaletteOpen } from '../../store/paletteStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import { useThemeTransition } from '../../hooks/useThemeTransition';

interface Command {
  id: string;
  label: string;
  group: string;
  /** Extra words that should match but are not shown. */
  keywords?: string;
  hint?: string;
  run: () => void;
}

/**
 * Subsequence scoring: every character of the query must appear in order,
 * but not necessarily adjacently, so "dpdv" finds "Deep Dives".
 *
 * Returns null for no match. Higher is better. Consecutive hits and a
 * prefix match both score well, which is what keeps the obvious answer at
 * the top instead of a technically-valid but surprising one.
 */
const score = (text: string, query: string): number | null => {
  if (query.length === 0) return 0;
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();

  let cursor = 0;
  let total = 0;
  let streak = 0;

  for (const char of needle) {
    const found = haystack.indexOf(char, cursor);
    if (found === -1) return null;
    streak = found === cursor ? streak + 1 : 0;
    total += 1 + streak * 2 - Math.min(found - cursor, 6) * 0.15;
    cursor = found + 1;
  }

  if (haystack.startsWith(needle)) total += 12;
  if (haystack.includes(' ' + needle)) total += 6;
  return total;
};

const challenges = challengesData as Challenge[];

/**
 * A command palette, opened with Cmd/Ctrl-K.
 *
 * The parts that take the work are not the filtering:
 *
 * - it is a `combobox` driving a `listbox`, so the active option is tracked
 *   with `aria-activedescendant` and focus never leaves the input — moving
 *   real focus through the list would break typing
 * - Tab is trapped inside the dialog and focus returns to whatever opened it
 * - background scrolling is locked, with the scrollbar's width replaced as
 *   padding so the page behind does not shift sideways
 * - the result count goes through a live region, because a sighted user sees
 *   the list shrink and a screen reader otherwise gets nothing
 * - the active option is scrolled into view with `block: 'nearest'`, which
 *   moves the list only when it has to
 */
const CommandPalette = () => {
  const open = usePaletteOpen();
  const [query, setQuery] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const listId = useId();
  const titleId = useId();

  const navigate = useTransitionNavigate();
  const toggleTheme = useThemeTransition();

  useFocusTrap(dialogRef, open);

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => () => {
      paletteStore.close();
      navigate(path);
    };

    const pages: Command[] = [
      { id: 'home', label: 'Home', group: 'Go to', keywords: 'start index', run: go('/') },
      { id: 'dives', label: 'Engineering Deep Dives', group: 'Go to', keywords: 'challenges writing notes', run: go('/deep-dives') },
      { id: 'projects', label: 'Projects', group: 'Go to', keywords: 'work portfolio rabva', run: go('/projects') },
      { id: 'about', label: 'About', group: 'Go to', keywords: 'bio background story', run: go('/about-me') },
    ];

    const actions: Command[] = [
      {
        id: 'theme',
        label: 'Toggle light / dark theme',
        group: 'Actions',
        keywords: 'dark mode appearance colour color',
        hint: 'Theme',
        run: () => {
          paletteStore.close();
          toggleTheme();
        },
      },
      {
        id: 'email',
        label: 'Copy email address',
        group: 'Actions',
        keywords: 'contact mail reach',
        hint: 'fa.bagherzad@gmail.com',
        run: () => {
          void navigator.clipboard
            ?.writeText('fa.bagherzad@gmail.com')
            .catch(() => undefined);
          paletteStore.close();
        },
      },
      {
        id: 'resume',
        label: 'Open resume (PDF)',
        group: 'Actions',
        keywords: 'cv download',
        run: () => {
          paletteStore.close();
          window.open(
            '/Fatemeh-Bagherzad-Full-Stack-Developer-Resume.pdf',
            '_blank',
            'noopener,noreferrer'
          );
        },
      },
      {
        id: 'github',
        label: 'Open GitHub profile',
        group: 'Actions',
        keywords: 'code repos source',
        run: () => {
          paletteStore.close();
          window.open(
            'https://github.com/FatemeBagherzad',
            '_blank',
            'noopener,noreferrer'
          );
        },
      },
      {
        id: 'linkedin',
        label: 'Open LinkedIn profile',
        group: 'Actions',
        keywords: 'network hire contact',
        run: () => {
          paletteStore.close();
          window.open(
            'https://www.linkedin.com/in/fatemeh-bagherzad/',
            '_blank',
            'noopener,noreferrer'
          );
        },
      },
    ];

    // Every write-up is reachable from here, which is what makes the palette
    // worth opening rather than a gimmick over four nav links.
    const dives: Command[] = challenges.map((challenge) => ({
      id: 'dive-' + String(challenge.id),
      label: challenge.title,
      group: 'Deep dives',
      keywords: challenge.project,
      hint: challenge.project,
      run: go('/deep-dives'),
    }));

    return [...pages, ...actions, ...dives];
  }, [navigate, toggleTheme]);

  const results = useMemo(() => {
    if (query.trim().length === 0) return commands;
    return commands
      .map((command) => ({
        command,
        rank: score(command.label + ' ' + (command.keywords ?? ''), query.trim()),
      }))
      .filter(
        (entry): entry is { command: Command; rank: number } => entry.rank !== null
      )
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => entry.command);
  }, [commands, query]);

  // Reset when it opens, so it never reopens mid-search from last time.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    // The focus trap focuses the first focusable; make sure that is the input.
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Global shortcut. Cmd-K on macOS, Ctrl-K elsewhere.
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        paletteStore.toggle();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock background scroll, replacing the scrollbar width as padding so the
  // page behind the overlay does not jump sideways as it disappears.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = String(scrollbar) + 'px';
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  // Keep the active option visible without yanking the list around.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const active = list?.children[activeIndex];
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, results.length]);

  const runActive = useCallback((): void => {
    results[activeIndex]?.run();
  }, [activeIndex, results]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      paletteStore.close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : (index - 1 + results.length) % results.length
      );
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, results.length - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runActive();
    }
  };

  if (!open) return null;

  const activeId = results[activeIndex]
    ? listId + '-option-' + String(activeIndex)
    : undefined;

  return (
    <div className="palette" role="presentation" onKeyDown={handleKeyDown}>
      <div
        className="palette__backdrop"
        onClick={() => paletteStore.close()}
        role="presentation"
      />

      <div
        className="palette__dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="visually-hidden">
          Command palette
        </h2>

        <div className="palette__field">
          <svg
            className="palette__search-icon"
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
            ref={inputRef}
            className="palette__input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, actions and write-ups…"
            aria-label="Search pages, actions and write-ups"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Was a decorative <kbd>, which looked pressable and was not. */}
          <button
            type="button"
            className="palette__close"
            onClick={() => paletteStore.close()}
            aria-label="Close the command palette"
          >
            <span aria-hidden="true">Esc</span>
          </button>
        </div>

        <ul className="palette__list" id={listId} role="listbox" ref={listRef}>
          {results.map((command, index) => {
            const isActive = index === activeIndex;
            const previous = results[index - 1];
            const showGroup = !previous || previous.group !== command.group;

            return (
              <li
                key={command.id}
                id={listId + '-option-' + String(index)}
                role="option"
                aria-selected={isActive}
                className={
                  'palette__option' + (isActive ? ' palette__option--active' : '')
                }
                // Pointer, not click: this fires before the input can lose
                // focus, so the selection follows the mouse cleanly.
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => command.run()}
              >
                {showGroup && (
                  <span className="palette__group" aria-hidden="true">
                    {command.group}
                  </span>
                )}
                <span className="palette__label">{command.label}</span>
                {command.hint && (
                  <span className="palette__hint">{command.hint}</span>
                )}
              </li>
            );
          })}

          {results.length === 0 && (
            <li className="palette__empty" role="presentation">
              Nothing matches “{query}”.
            </li>
          )}
        </ul>

        {/* A sighted user watches the list shrink; without this a screen
            reader would get no feedback at all as they type. */}
        <p className="visually-hidden" role="status">
          {String(results.length)}{' '}
          {results.length === 1 ? 'result' : 'results'}
        </p>
      </div>
    </div>
  );
};

export default CommandPalette;

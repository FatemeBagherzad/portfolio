import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './Scratchpad.scss';
import { evaluateDocument, type LineResult } from './evaluate';
import { RATES_NOTE } from './rates';

interface ScratchpadProps {
  /** `compact` is the homepage embed: shorter, and it remembers nothing. */
  variant?: 'full' | 'compact';
  initialValue?: string;
  /** Omit to disable persistence. */
  storageKey?: string;
}

const FULL_EXAMPLE = [
  '# A trip',
  '3 nights at $180',
  '+ 13% tax',
  '',
  'flights = $420',
  'prev + flights',
  '',
  '# Anything else',
  '65 kg in lbs',
  '100 C in F',
  '1 GiB in MB',
  '240 CAD in EUR',
].join('\n');

const COMPACT_EXAMPLE = [
  '3 nights at $180',
  '+ 13% tax',
  '65 kg in lbs',
].join('\n');

const MIN_ROWS = 6;

/** Announcing on every keystroke would be unusable; this is a settle time. */
const ANNOUNCE_DELAY = 700;

const read = (key: string | undefined, fallback: string): string => {
  if (!key) return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    // Private windows and blocked site data both throw here.
    return fallback;
  }
};

/**
 * A calculating scratchpad: you write lines, it answers beside each one.
 *
 * The layout rests on one decision — the textarea does not wrap. With
 * `white-space: pre` every line of input occupies exactly one visual line,
 * so a results column with the same line height stays aligned with it for
 * free. Wrapping would mean measuring each line's rendered height and
 * positioning every result against it, which is a lot of machinery to buy
 * a behaviour nobody wants in a calculator anyway.
 */
const Scratchpad = ({
  variant = 'full',
  initialValue,
  storageKey,
}: ScratchpadProps) => {
  const fallback =
    initialValue ?? (variant === 'compact' ? COMPACT_EXAMPLE : FULL_EXAMPLE);

  const [source, setSource] = useState<string>(() => read(storageKey, fallback));
  const [announced, setAnnounced] = useState<string>('');
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const results = useMemo<LineResult[]>(
    () => evaluateDocument(source),
    [source]
  );

  const lines = useMemo<string[]>(() => source.split('\n'), [source]);

  const showsRatesNote = useMemo<boolean>(
    () => results.some((line) => line.usedCurrency),
    [results]
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, source);
    } catch {
      // Nothing to do, and nothing worth telling the visitor about.
    }
  }, [source, storageKey]);

  // One announcement once the typing stops, rather than a stream of them.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const values = results.filter((line) => line.kind === 'value');
      const latest = values[values.length - 1];
      setAnnounced(latest ? latest.display : '');
    }, ANNOUNCE_DELAY);
    return () => window.clearTimeout(timer);
  }, [results]);

  const rows = Math.max(MIN_ROWS, lines.length);

  return (
    <div className={'scratchpad scratchpad--' + variant}>
      <div className="scratchpad__pad">
        <label className="visually-hidden" htmlFor={inputId}>
          Scratchpad. Type a calculation on each line.
        </label>

        <textarea
          id={inputId}
          ref={textareaRef}
          className="scratchpad__input"
          value={source}
          rows={rows}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
          onChange={(event) => setSource(event.target.value)}
        />

        {/* Readable, but deliberately not a live region: it changes on
            every keystroke, and a screen reader narrating each half-typed
            intermediate result would make this unusable. It can be browsed
            at leisure, and the settled announcement is below. */}
        <ul className="scratchpad__results" aria-label="Results">
          {results.map((line, index) => (
            <li
              key={index}
              className={
                'scratchpad__result scratchpad__result--' + line.kind
              }
            >
              {/* Visible on a phone, where this column sits under the sums
                  rather than beside them — and read out everywhere, so an
                  answer is never announced without its question. */}
              {line.kind !== 'blank' && line.source.trim().length > 0 && (
                <span className="scratchpad__result-source">
                  {line.source.trim()}
                </span>
              )}
              <span className="scratchpad__result-value">{line.display}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {announced ? 'Result: ' + announced : ''}
      </p>

      <div className="scratchpad__footer">
        <p className="scratchpad__hint">
          Try <code>3 nights at $180</code>, <code>+ 13% tax</code>,{' '}
          <code>65 kg in lbs</code>, <code>240 CAD in EUR</code>. Name a line
          with <code>=</code> and use it below; start a line with{' '}
          <code>+</code> to continue the one above.
        </p>

        <div className="scratchpad__actions">
          <button
            type="button"
            className="btn btn--quiet scratchpad__action"
            onClick={() => {
              setSource(fallback);
              textareaRef.current?.focus();
            }}
          >
            Reset
          </button>
          {variant === 'full' && (
            <button
              type="button"
              className="btn btn--quiet scratchpad__action"
              onClick={() => {
                setSource('');
                textareaRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showsRatesNote && <p className="scratchpad__rates">{RATES_NOTE}</p>}
    </div>
  );
};

export default Scratchpad;

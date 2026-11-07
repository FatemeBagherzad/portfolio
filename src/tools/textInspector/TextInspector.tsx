import { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import './TextInspector.scss';
import { inspect, type Inspection } from './inspect';
import InspectorFindings from './InspectorFindings';
import InspectorTable from './InspectorTable';

const SAMPLE = 'بِسْمِ ٱللَّٰهِ';

interface StatProps {
  label: string;
  value: string | number;
  note?: string;
}

const Stat = ({ label, value, note }: StatProps) => (
  <div className="inspector__stat">
    <dt className="inspector__stat-label">{label}</dt>
    <dd className="inspector__stat-value">{value}</dd>
    {note && <dd className="inspector__stat-note">{note}</dd>}
  </div>
);

interface TextInspectorProps {
  /**
   * `compact` is the homepage embed: the field and the counts, and none of
   * the analysis under them. The counts are the part that fits in a glance;
   * the per-character table is as long as whatever was pasted in, and a
   * homepage section that grows without limit pushes everything below it
   * out of sight.
   */
  variant?: 'full' | 'compact';
  /**
   * Where the text is kept between visits. Both instances are given the
   * same key on purpose: it is what carries a paste from the homepage to
   * the full analysis on the tools page, with nothing in the URL. Omit it
   * to disable persistence. It stays in this browser either way.
   */
  storageKey?: string;
  /** Shown at the end of the compact variant — the link to the full tool. */
  children?: ReactNode;
}

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
 * Shows what a string is made of, for scripts where that is not obvious.
 *
 * This exists because of three bugs in Rabva that each cost a day. Arabic
 * diacritics are separate code points, so `length` changes when a reader
 * turns them on and any index built on it moves. The same word can be
 * stored in two normalisation forms that compare unequal while rendering
 * identically. And a right-to-left override pasted in from elsewhere is
 * invisible, survives a copy, and reorders everything after it.
 */
const TextInspector = ({
  variant = 'full',
  storageKey,
  children,
}: TextInspectorProps) => {
  const [text, setText] = useState<string>(() => read(storageKey, SAMPLE));
  const inputId = useId();

  const report = useMemo<Inspection>(() => inspect(text), [text]);
  const compact = variant === 'compact';

  // How many of the four counts actually differ. For plain ASCII they all
  // agree and there is nothing to point out; the moment they do not, that
  // is the finding.
  const distinctCounts = new Set([
    report.counts.utf16,
    report.counts.codePoints,
    report.counts.graphemes,
    report.counts.utf8Bytes,
  ]).size;

  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, text);
    } catch {
      // Nothing to do, and nothing worth telling the visitor about.
    }
  }, [text, storageKey]);

  return (
    <div className={'inspector inspector--' + variant}>
      <div className="inspector__field">
        <label className="inspector__label" htmlFor={inputId}>
          Paste any text — Arabic, Persian, Hebrew or Latin
        </label>
        <textarea
          id={inputId}
          className="inspector__input"
          value={text}
          rows={compact ? 2 : 3}
          spellCheck={false}
          dir="auto"
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      <dl className="inspector__stats">
        <Stat
          label="UTF-16 length"
          value={report.counts.utf16}
          note="what .length returns"
        />
        <Stat label="Code points" value={report.counts.codePoints} />
        <Stat
          label="Graphemes"
          value={report.counts.graphemes}
          note="what a reader counts"
        />
        <Stat
          label="Without diacritics"
          value={report.counts.withoutDiacritics}
        />
        <Stat label="UTF-8 bytes" value={report.counts.utf8Bytes} />
      </dl>

      {compact ? (
        <>
          {/* One line, and only when there is something to say. Anything
              longer here and the section below stops being visible, which
              is the whole reason the rest of the analysis is a click
              away. */}
          {distinctCounts > 1 && (
            <p className="inspector__headline">
              Four questions about one string, {distinctCounts} different
              answers — so <code>.length</code> is not the length.
            </p>
          )}
          {children}
        </>
      ) : (
        <>
          <InspectorFindings report={report} />

          {report.counts.withoutDiacritics !== report.counts.codePoints && (
            <div className="inspector__stripped">
              <p className="eyebrow">Diacritics removed</p>
              <p className="inspector__stripped-text" dir="auto" lang="ar">
                {report.strippedDiacritics}
              </p>
            </div>
          )}

          <InspectorTable characters={report.characters} />
        </>
      )}
    </div>
  );
};

export default TextInspector;

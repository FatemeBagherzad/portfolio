import { useId, useMemo, useState } from 'react';
import './TextInspector.scss';
import { inspect, type Inspection } from './inspect';

const SAMPLE = 'بِسْمِ ٱللَّٰهِ';

/** How many characters the per-character table will render before stopping. */
const TABLE_LIMIT = 120;

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
const TextInspector = () => {
  const [text, setText] = useState<string>(SAMPLE);
  const inputId = useId();

  const report = useMemo<Inspection>(() => inspect(text), [text]);
  const shown = report.characters.slice(0, TABLE_LIMIT);

  return (
    <div className="inspector">
      <div className="inspector__field">
        <label className="inspector__label" htmlFor={inputId}>
          Paste any text — Arabic, Persian, Hebrew or Latin
        </label>
        <textarea
          id={inputId}
          className="inspector__input"
          value={text}
          rows={3}
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

      <div className="inspector__findings">
        {report.counts.utf16 !== report.counts.graphemes && (
          <p className="inspector__finding">
            <strong>These disagree.</strong> Any index, slice or character
            limit built on <code>.length</code> will cut this text in the
            wrong place.
          </p>
        )}

        {report.normalisationMatters && (
          <p className="inspector__finding">
            <strong>Normalisation matters here.</strong> NFC is{' '}
            {report.nfcLength} code points, NFD is {report.nfdLength}. Two
            copies in different forms look identical and compare unequal —{' '}
            {report.isNfc
              ? 'this one is already NFC.'
              : 'this one is not NFC, so normalise before storing it.'}
          </p>
        )}

        {report.invisibles.length > 0 && (
          <p className="inspector__finding inspector__finding--warn">
            <strong>
              {report.invisibles.length} invisible character
              {report.invisibles.length === 1 ? '' : 's'}.
            </strong>{' '}
            {report.invisibles.map((entry) => entry.name).join(', ')}. These
            survive copy and paste and are a common source of &ldquo;the
            strings look the same but do not match&rdquo;.
          </p>
        )}

        {report.hasMixedDirection && (
          <p className="inspector__finding">
            <strong>Mixed direction.</strong> This has both right-to-left and
            left-to-right runs, so the visual order is not the stored order.
          </p>
        )}
      </div>

      {report.counts.withoutDiacritics !== report.counts.codePoints && (
        <div className="inspector__stripped">
          <p className="eyebrow">Diacritics removed</p>
          <p className="inspector__stripped-text" dir="auto" lang="ar">
            {report.strippedDiacritics}
          </p>
        </div>
      )}

      <div className="inspector__table-wrap">
        <table className="inspector__table">
          <caption className="visually-hidden">
            Every character, with its code point and script
          </caption>
          <thead>
            <tr>
              <th scope="col">Char</th>
              <th scope="col">Code point</th>
              <th scope="col">Script</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((entry, index) => (
              <tr
                key={String(index) + entry.codePoint}
                className={
                  entry.isInvisible ? 'inspector__row--invisible' : undefined
                }
              >
                <td className="inspector__char" dir="auto">
                  {entry.display}
                </td>
                <td className="inspector__code">{entry.codePoint}</td>
                <td>{entry.script}</td>
                <td className="inspector__note">
                  {entry.name ?? (entry.isDiacritic ? 'combining mark' : '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {report.characters.length > TABLE_LIMIT && (
          <p className="inspector__truncated">
            Showing the first {TABLE_LIMIT} of {report.characters.length}{' '}
            characters.
          </p>
        )}
      </div>
    </div>
  );
};

export default TextInspector;

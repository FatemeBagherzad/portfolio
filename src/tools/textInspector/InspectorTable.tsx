import type { CharInfo } from './inspect';

/** How many characters the table will render before it stops. */
export const TABLE_LIMIT = 120;

interface InspectorTableProps {
  characters: CharInfo[];
}

/**
 * Every character, one row each, with its code point and script.
 *
 * Kept apart from the inspector itself because this is the part that grows
 * without limit with what is pasted in, and the homepage embed deliberately
 * does not render it.
 */
const InspectorTable = ({ characters }: InspectorTableProps) => {
  const shown = characters.slice(0, TABLE_LIMIT);

  return (
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

      {characters.length > TABLE_LIMIT && (
        <p className="inspector__truncated">
          Showing the first {TABLE_LIMIT} of {characters.length} characters.
        </p>
      )}
    </div>
  );
};

export default InspectorTable;

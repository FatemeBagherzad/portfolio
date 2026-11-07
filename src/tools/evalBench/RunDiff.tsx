import { asPercent } from './run';
import type { Comparison } from './run';

interface RunDiffProps {
  comparison: Comparison;
}

const sign = (change: number): string =>
  (change > 0 ? '+' : '') + String(Math.round(change * 100)) + ' pts';

/**
 * What one prompt change did, case by case.
 *
 * The headline rate and the per-case rows disagree here on purpose: the
 * suite is better overall and one case is worse. That is the shape of
 * nearly every real prompt change, and it is invisible to anyone reporting
 * a single number — which is the argument for the whole bench.
 */
const RunDiff = ({ comparison }: RunDiffProps) => {
  const { before, after, regressions, improvements } = comparison;
  const overall = after.passRate - before.passRate;

  return (
    <div className="bench__diff">
      <p className="bench__diff-headline">
        Overall <strong>{asPercent(before.passRate)}</strong> →{' '}
        <strong>{asPercent(after.passRate)}</strong> ({sign(overall)}),{' '}
        {improvements} case{improvements === 1 ? '' : 's'} better and{' '}
        {regressions} worse.
        {regressions > 0 && (
          <>
            {' '}
            The summary says this change is an improvement. One case
            disagrees.
          </>
        )}
      </p>

      <table className="bench__diff-table">
        <caption className="visually-hidden">
          Pass rate per case, before and after the prompt change
        </caption>
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">{before.version.label}</th>
            <th scope="col">{after.version.label}</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {comparison.cases.map((delta) => (
            <tr
              key={delta.caseId}
              className={'bench__row bench__row--' + delta.movement}
            >
              <th scope="row">{delta.name}</th>
              <td>{asPercent(delta.before)}</td>
              <td>{asPercent(delta.after)}</td>
              <td className="bench__change">
                {delta.movement === 'unchanged' ? '—' : sign(delta.change)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The gate-level movement, which is the part a rate cannot tell
          you: which condition started failing, by name. */}
      <ul className="bench__moves">
        {comparison.cases.map((delta) => (
          <li key={delta.caseId}>
            {delta.newlyFailing.length > 0 && (
              <p className="bench__move bench__move--bad">
                <strong>{delta.name}</strong> — now failing:{' '}
                {delta.newlyFailing.join('; ')}.
              </p>
            )}
            {delta.newlyPassing.length > 0 && (
              <p className="bench__move bench__move--good">
                <strong>{delta.name}</strong> — now passing:{' '}
                {delta.newlyPassing.join('; ')}.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RunDiff;

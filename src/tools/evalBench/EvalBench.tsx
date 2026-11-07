import { useId, useMemo, useState } from 'react';
import './EvalBench.scss';
import RunDiff from './RunDiff';
import RunReport from './RunReport';
import { asPercent, compareRuns, runVersion, withNormalisation } from './run';
import { RABVA_SUITE } from './suite';

type View = 'run' | 'compare';

/**
 * A regression bench for prompts.
 *
 * The discipline it demonstrates is the one I used to build Rabva's API
 * with coding agents: an answer is not judged good or bad, it either
 * clears the gates written for it or it does not, and it has to clear them
 * on every run rather than on the run you happened to watch.
 *
 * No model is called. Nothing here needs a key, a backend or a network —
 * the outputs are fixed, written by hand to exercise the harness, and the
 * harness is the part worth looking at.
 */
const EvalBench = () => {
  const [view, setView] = useState<View>('run');
  const [versionId, setVersionId] = useState<string>('v1');
  const [normalise, setNormalise] = useState<boolean>(false);
  const uid = useId();

  const suite = useMemo(
    () => withNormalisation(RABVA_SUITE, normalise),
    [normalise]
  );

  const runs = useMemo(
    () => suite.versions.map((version) => runVersion(suite, version)),
    [suite]
  );

  const current = runs.find((run) => run.version.id === versionId) ?? runs[0];
  const comparison = useMemo(
    () => (runs[0] && runs[1] ? compareRuns(runs[0], runs[1]) : null),
    [runs]
  );

  if (!current) return null;

  const flakyCases = current.cases.filter(
    (entry) => entry.deviation > 0
  ).length;

  return (
    <div className="bench">
      <p className="bench__note">
        No model runs here. The outputs are fixed samples, written by hand to
        exercise the harness — the gates, the rate, the spread and the diff
        are the engineering, and inventing a record of real runs to dress
        that up is the one thing this discipline exists to prevent.
      </p>

      <div className="bench__controls">
        <fieldset className="bench__field">
          <legend className="bench__legend">Prompt version</legend>
          {suite.versions.map((version) => (
            <label className="bench__radio" key={version.id}>
              <input
                type="radio"
                name={'version-' + uid}
                value={version.id}
                checked={versionId === version.id && view === 'run'}
                onChange={() => {
                  setVersionId(version.id);
                  setView('run');
                }}
              />
              {version.label}
            </label>
          ))}
          <label className="bench__radio" key="compare">
            <input
              type="radio"
              name={'version-' + uid}
              value="compare"
              checked={view === 'compare'}
              onChange={() => setView('compare')}
            />
            Compare the two
          </label>
        </fieldset>

        {/* One adjustable gate, because moving it is the fastest way to
            see what a gate decides. */}
        <label className="bench__switch">
          <input
            type="checkbox"
            checked={normalise}
            onChange={(event) => setNormalise(event.target.checked)}
          />
          Normalise Arabic before comparing
        </label>
      </div>

      {view === 'run' ? (
        <>
          <div className="bench__summary">
            <p className="bench__score">
              <span className="bench__score-value">
                {asPercent(current.passRate)}
              </span>
              <span className="bench__score-label">
                {current.passed} of {current.total} runs cleared every gate
              </span>
            </p>
            <p className="bench__flaky">
              {flakyCases === 0
                ? 'Every case is decided: each one passes always or fails always.'
                : String(flakyCases) +
                  ' of ' +
                  String(current.cases.length) +
                  ' cases are flaky — they pass on some runs and fail on others, which is the failure mode a single green run hides.'}
            </p>
          </div>

          <details className="bench__prompt-wrap">
            <summary className="bench__samples-toggle">
              Show the prompt this version used
            </summary>
            <pre className="bench__prompt">{current.version.prompt}</pre>
          </details>

          <RunReport cases={current.cases} />
        </>
      ) : (
        comparison && <RunDiff comparison={comparison} />
      )}
    </div>
  );
};

export default EvalBench;

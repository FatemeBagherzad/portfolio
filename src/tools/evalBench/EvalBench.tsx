import { useEffect, useId, useMemo, useState } from 'react';
import './EvalBench.scss';
import OwnRuns, { type OwnState } from './OwnRuns';
import RunDiff from './RunDiff';
import RunReport from './RunReport';
import { EXAMPLE_RUNS } from './parseRuns';
import { asPercent, compareRuns, runVersion, withNormalisation } from './run';
import { RABVA_SUITE } from './suite';
import type { Assertion } from './types';

type View = 'run' | 'compare';
type Mode = 'demo' | 'own';

const STORAGE_KEY = 'eval-bench:own';

/**
 * What the "your own" panel starts with.
 *
 * Prefilled rather than empty: an empty harness looks like a form, and a
 * form asks you to do work before it has shown you anything. These three
 * answers score 33% straight away, and the run that fails is the one with
 * a code fence around it — which is the single most common way a reply that
 * looks like JSON turns out not to be.
 */
const DEFAULT_OWN: OwnState = {
  runsA: EXAMPLE_RUNS,
  runsB: '',
  gates: [
    { kind: 'json', requiredFields: ['ayah', 'word'] },
    { kind: 'numberWithin', path: 'ayah', min: 1, max: 286 },
  ],
};

const readOwn = (): OwnState => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_OWN;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_OWN;
    const value = parsed as Partial<OwnState>;
    // Anything could be in storage — an older shape, a hand-edited value,
    // another tab mid-write. A bad field falls back rather than throwing
    // inside a render.
    return {
      runsA: typeof value.runsA === 'string' ? value.runsA : DEFAULT_OWN.runsA,
      runsB: typeof value.runsB === 'string' ? value.runsB : '',
      gates: Array.isArray(value.gates)
        ? (value.gates as Assertion[])
        : DEFAULT_OWN.gates,
    };
  } catch {
    return DEFAULT_OWN;
  }
};

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
  const [mode, setMode] = useState<Mode>('demo');
  const [view, setView] = useState<View>('run');
  const [versionId, setVersionId] = useState<string>('v1');
  const [normalise, setNormalise] = useState<boolean>(false);
  const [own, setOwn] = useState<OwnState>(readOwn);
  const uid = useId();

  // Kept in this browser and nowhere else. Someone pasting model output
  // into a page on the internet should not have to wonder where it went.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(own));
    } catch {
      // Private windows refuse storage; the panel still works today.
    }
  }, [own]);

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
        No model runs here, in either mode. Bring the answers your own model
        gave you, or read the worked example — the gates, the rate, the spread
        and the diff are the engineering, and the demo outputs are written by
        hand to exercise them rather than passed off as a record of real runs.
        Nothing you paste leaves this tab.
      </p>

      <div className="bench__modes" role="group" aria-label="What to score">
        <button
          type="button"
          className={
            'bench__mode' + (mode === 'demo' ? ' bench__mode--on' : '')
          }
          aria-pressed={mode === 'demo'}
          onClick={() => setMode('demo')}
        >
          Worked example
        </button>
        <button
          type="button"
          className={'bench__mode' + (mode === 'own' ? ' bench__mode--on' : '')}
          aria-pressed={mode === 'own'}
          onClick={() => setMode('own')}
        >
          Score your own answers
        </button>
      </div>

      {mode === 'own' && (
        <>
          <label className="bench__switch bench__switch--loose">
            <input
              type="checkbox"
              checked={normalise}
              onChange={(event) => setNormalise(event.target.checked)}
            />
            Normalise text before comparing
          </label>
          <OwnRuns state={own} onChange={setOwn} normalise={normalise} />
        </>
      )}

      {mode === 'demo' && (
        <>
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
        </>
      )}
    </div>
  );
};

export default EvalBench;

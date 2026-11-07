import { useId, useMemo } from 'react';
import GateBuilder from './GateBuilder';
import RunDiff from './RunDiff';
import RunReport from './RunReport';
import { asPercent, compareRuns, runVersion } from './run';
import { splitRuns } from './parseRuns';
import type { Assertion, Suite } from './types';

export interface OwnState {
  runsA: string;
  runsB: string;
  gates: Assertion[];
}

interface OwnRunsProps {
  state: OwnState;
  onChange: (state: OwnState) => void;
  /** Applied to text gates, from the switch the whole bench shares. */
  normalise: boolean;
}

/**
 * The bench, pointed at whatever you paste into it.
 *
 * It checks answers, not prompts — nothing here calls a model, so there is
 * no way for it to produce an answer of its own. You bring the answers your
 * model gave you, several of them, and it does the part that is tedious and
 * easy to fool yourself about: applying the same rules to every one and
 * reporting how often they held.
 *
 * Several answers is the whole point. One answer gives a score of 0% or
 * 100% and tells you nothing, which is exactly the mistake the bench exists
 * to correct.
 */
const OwnRuns = ({ state, onChange, normalise }: OwnRunsProps) => {
  const uid = useId();

  const gates = useMemo<Assertion[]>(
    () =>
      state.gates.map((gate) =>
        gate.kind === 'contains' ? { ...gate, normalise } : gate
      ),
    [state.gates, normalise]
  );

  const samplesA = useMemo(() => splitRuns(state.runsA), [state.runsA]);
  const samplesB = useMemo(() => splitRuns(state.runsB), [state.runsB]);

  // One case, because the runs pasted in are all answers to the same
  // question. Shaped as a suite so the report and the diff are the same
  // components the demo uses — a second rendering path would be a second
  // thing to keep honest.
  const suite = useMemo<Suite>(
    () => ({
      id: 'own',
      name: 'Your runs',
      description: '',
      cases: [{ id: 'own', name: 'Your runs', input: '', assertions: gates }],
      versions: [
        {
          id: 'a',
          label: 'Set A',
          prompt: '',
          samples: { own: samplesA },
        },
        {
          id: 'b',
          label: 'Set B',
          prompt: '',
          samples: { own: samplesB },
        },
      ],
    }),
    [gates, samplesA, samplesB]
  );

  const runA = useMemo(() => runVersion(suite, suite.versions[0]!), [suite]);
  const runB = useMemo(() => runVersion(suite, suite.versions[1]!), [suite]);
  const comparing = samplesB.length > 0;

  const ready = samplesA.length > 0 && gates.length > 0;

  return (
    <div className="own">
      <div className="own__inputs">
        <div className="own__field">
          <label className="own__label" htmlFor={'runs-a-' + uid}>
            Paste your answers — one run per block, separated by a line of three
            dashes
          </label>
          <textarea
            id={'runs-a-' + uid}
            className="own__input"
            rows={8}
            spellCheck={false}
            value={state.runsA}
            onChange={(event) =>
              onChange({ ...state, runsA: event.target.value })
            }
          />
          <p className="own__count">
            {samplesA.length} run{samplesA.length === 1 ? '' : 's'} found
            {samplesA.length === 1 && (
              <>
                {' '}
                — paste a few more. One run scores 0% or 100% and tells you
                nothing about whether it holds.
              </>
            )}
          </p>
        </div>

        <details className="own__second">
          <summary className="bench__samples-toggle">
            Compare against a second set
          </summary>
          <div className="own__field">
            <label className="own__label" htmlFor={'runs-b-' + uid}>
              Answers from your other prompt, same gates
            </label>
            <textarea
              id={'runs-b-' + uid}
              className="own__input"
              rows={6}
              spellCheck={false}
              placeholder="Leave this empty to score one set on its own."
              value={state.runsB}
              onChange={(event) =>
                onChange({ ...state, runsB: event.target.value })
              }
            />
            <p className="own__count">
              {samplesB.length} run{samplesB.length === 1 ? '' : 's'} found
            </p>
          </div>
        </details>
      </div>

      <div className="own__gates">
        <h4 className="own__gates-title">The gates</h4>
        <p className="own__gates-intro">
          Rules every answer has to clear. One gate fails, the answer fails —
          they are conditions for shipping, not a score to average.
        </p>
        <GateBuilder
          gates={state.gates}
          onChange={(next) => onChange({ ...state, gates: next })}
        />
      </div>

      {!ready ? (
        <p className="own__empty">
          {samplesA.length === 0
            ? 'Paste at least one answer above to see a score.'
            : 'Add at least one gate to see a score.'}
        </p>
      ) : comparing ? (
        <RunDiff comparison={compareRuns(runA, runB)} />
      ) : (
        <>
          <div className="bench__summary">
            <p className="bench__score">
              <span className="bench__score-value">
                {asPercent(runA.passRate)}
              </span>
              <span className="bench__score-label">
                {runA.passed} of {runA.total} runs cleared every gate
              </span>
            </p>
          </div>
          <RunReport cases={runA.cases} />
        </>
      )}
    </div>
  );
};

export default OwnRuns;

import { describe } from './assertions';
import { asPercent } from './run';
import type { CaseResult } from './types';

interface RunReportProps {
  cases: CaseResult[];
}

/** A bar is faster to compare than a number; the number is still there. */
const Bar = ({ rate }: { rate: number }) => (
  <span
    className="bench__bar"
    aria-hidden="true"
    style={{ ['--rate' as string]: String(Math.round(rate * 100)) + '%' }}
  >
    <span className="bench__bar-fill" />
  </span>
);

/**
 * Per-case results, with every sample available underneath.
 *
 * The samples are behind a disclosure rather than on the page, because the
 * point of a harness is not having to read them — but a rate you cannot
 * drill into is a rate you end up taking on trust, which is the habit this
 * is supposed to replace.
 */
const RunReport = ({ cases }: RunReportProps) => (
  <ul className="bench__cases">
    {cases.map((result) => (
      <li className="bench__case" key={result.case.id}>
        <div className="bench__case-head">
          <h4 className="bench__case-name">{result.case.name}</h4>
          <p className="bench__case-rate">
            <strong>{asPercent(result.passRate)}</strong>
            <span className="bench__case-count">
              {' '}
              {result.passed} of {result.total} runs
            </span>
          </p>
        </div>

        <Bar rate={result.passRate} />

        <p className="bench__case-spread">
          {result.deviation === 0 ? (
            <>Decided — every run agreed.</>
          ) : (
            <>
              Spread ±{result.deviation.toFixed(2)}. Flaky:{' '}
              {result.flakyAssertions.length > 0
                ? result.flakyAssertions.map((a) => describe(a)).join('; ')
                : 'no single gate — the failures are spread across them'}
              .
            </>
          )}
        </p>

        <details className="bench__samples">
          <summary className="bench__samples-toggle">
            Show all {result.total} runs
          </summary>
          <ol className="bench__sample-list">
            {result.samples.map((sample, index) => (
              <li
                key={index}
                className={
                  'bench__sample' +
                  (sample.passed ? '' : ' bench__sample--failed')
                }
              >
                <p className="bench__sample-head">
                  Run {index + 1} —{' '}
                  <span
                    className={
                      sample.passed
                        ? 'bench__verdict bench__verdict--pass'
                        : 'bench__verdict bench__verdict--fail'
                    }
                  >
                    {sample.passed ? 'passed' : 'failed'}
                  </span>
                </p>
                {/* The raw output, since a failure is only arguable with
                    the thing that failed in front of you. */}
                <pre className="bench__output">{sample.output}</pre>
                <ul className="bench__gates">
                  {sample.assertions.map((entry, gate) => (
                    <li
                      key={gate}
                      className={
                        'bench__gate' +
                        (entry.passed ? '' : ' bench__gate--failed')
                      }
                    >
                      <span aria-hidden="true" className="bench__gate-mark">
                        {entry.passed ? '✓' : '✕'}
                      </span>
                      <span className="visually-hidden">
                        {entry.passed ? 'Passed: ' : 'Failed: '}
                      </span>
                      <span className="bench__gate-name">
                        {describe(entry.assertion)}
                      </span>
                      <span className="bench__gate-detail">
                        {' '}
                        — {entry.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      </li>
    ))}
  </ul>
);

export default RunReport;

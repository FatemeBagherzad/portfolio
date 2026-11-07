import { Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Tools.scss';
import { TOOLS } from '../../tools/registry';

/**
 * Both tools are code-split.
 *
 * The homepage also mounts the scratchpad lazily, and that only actually
 * splits if *every* importer is lazy — a single static import anywhere
 * pulls the module back into the main bundle and the dynamic one silently
 * becomes a no-op. Rollup warns about exactly this, which is how the first
 * version of this file was caught.
 */
const Scratchpad = lazy(() => import('../../tools/scratchpad/Scratchpad'));
const TextInspector = lazy(
  () => import('../../tools/textInspector/TextInspector')
);

const renderTool = (id: string): ReactNode => {
  if (id === 'scratchpad') {
    return <Scratchpad variant="full" storageKey="scratchpad:tools" />;
  }
  // The same storage key the homepage embed writes to, which is how a
  // paste made down there arrives up here with the analysis under it.
  if (id === 'text-inspector') {
    return <TextInspector variant="full" storageKey="text-inspector" />;
  }
  return null;
};

/**
 * The tools page.
 *
 * Each tool is mounted and usable on the page itself rather than behind a
 * "launch" button. A reviewer who has to click through to a demo usually
 * does not, and these are small enough that there is nothing to gain by
 * hiding them.
 */
const Tools = () => {
  const [searchParams] = useSearchParams();
  const wanted = searchParams.get('tool');
  const [active, setActive] = useState<string>(
    () => TOOLS.find((tool) => tool.id === wanted)?.id ?? TOOLS[0]?.id ?? ''
  );

  useEffect(() => {
    if (wanted && TOOLS.some((tool) => tool.id === wanted)) setActive(wanted);
  }, [wanted]);

  const current = TOOLS.find((tool) => tool.id === active) ?? TOOLS[0];

  return (
    <div className="tools container section">
      <p className="eyebrow">Things you can use</p>
      <h1 className="tools__title">Tools</h1>
      <p className="lede tools__intro">
        Small apps I built because I wanted them. Everything runs in your
        browser — there is no server behind any of this, and nothing you type
        leaves the page.
      </p>

      {/* A tab list rather than separate routes: these are small, and
          switching between them should not be a page load. */}
      <div className="tools__tabs" role="tablist" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            role="tab"
            id={'tool-tab-' + tool.id}
            aria-selected={tool.id === active}
            aria-controls={'tool-panel-' + tool.id}
            // Only the selected tab is in the tab order; the arrow keys
            // move between them, which is what the pattern requires.
            tabIndex={tool.id === active ? 0 : -1}
            className={
              'tools__tab' + (tool.id === active ? ' tools__tab--on' : '')
            }
            onClick={() => setActive(tool.id)}
            onKeyDown={(event) => {
              const step =
                event.key === 'ArrowRight'
                  ? 1
                  : event.key === 'ArrowLeft'
                    ? -1
                    : 0;
              if (step === 0) return;
              event.preventDefault();
              const index = TOOLS.findIndex((entry) => entry.id === active);
              const next = TOOLS[(index + step + TOOLS.length) % TOOLS.length];
              if (!next) return;
              setActive(next.id);
              document.getElementById('tool-tab-' + next.id)?.focus();
            }}
          >
            {tool.name}
          </button>
        ))}
      </div>

      {current && (
        <div
          className="tools__panel"
          role="tabpanel"
          id={'tool-panel-' + current.id}
          aria-labelledby={'tool-tab-' + current.id}
          tabIndex={-1}
        >
          <div className="tools__panel-head">
            <h2 className="tools__panel-title">{current.name}</h2>
            <p className="tools__panel-tagline">{current.tagline}</p>
            <ul className="tools__panel-stack" aria-label="Built with">
              {current.stack.map((tech) => (
                <li className="chip" key={tech}>
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          <div className="tools__panel-body">
            <Suspense
              fallback={
                <p className="tools__loading" role="status">
                  Loading {current.name}…
                </p>
              }
            >
              {renderTool(current.id)}
            </Suspense>
          </div>

          <p className="tools__panel-note">{current.note}</p>
        </div>
      )}
    </div>
  );
};

export default Tools;

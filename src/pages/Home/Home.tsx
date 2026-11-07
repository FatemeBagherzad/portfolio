import { Suspense, lazy } from 'react';
import Hero from '../../components/Hero/Hero';
import TransitionLink from '../../components/TransitionLink/TransitionLink';
import './Home.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import type { Challenge } from '../../types';

const featured: Challenge[] = (challengesData as Challenge[]).filter(
  (challenge) => challenge.featured
);

/**
 * The one thing on this page a visitor can *use*, so it is here rather than
 * only behind a nav link — but it carries a Unicode database, and none of
 * that belongs in the bundle that has to arrive before the hero paints.
 * Lazily loaded, it costs the first view nothing.
 *
 * One tool, not both. The scratchpad is a better toy and a worse argument:
 * everyone has seen a calculator, and nobody has seen the thing she keeps
 * being right about. The tools page is one click away for the rest.
 */
const TextInspector = lazy(
  () => import('../../tools/textInspector/TextInspector')
);

const Home = () => {
  return (
    <div className="home">
      <Hero />

      <section className="home__tools container" aria-labelledby="home-tools">
        <h2 id="home-tools" className="home__tools-title">
          Try something I built
        </h2>
        <p className="home__tools-intro">
          The Text Inspector. Paste Arabic, Persian, Hebrew or an emoji and
          watch four honest answers to &ldquo;how long is this?&rdquo;
          disagree with each other. It runs entirely in this tab.
        </p>

        <div className="home__tool">
          {/* A plain box of the right height, so the page does not jump
              when the real thing arrives. */}
          <Suspense
            fallback={
              <div className="home__tool-placeholder" aria-hidden="true" />
            }
          >
            {/* Counts only here. The per-character table is as long as
                whatever is pasted in, which would push the section below
                off the screen — so it waits on the tools page, where this
                same text is already in the field. */}
            <TextInspector variant="compact" storageKey="text-inspector">
              <TransitionLink
                className="home__tool-more"
                to="/tools?tool=text-inspector"
              >
                See the full analysis
                <span aria-hidden="true"> &rarr;</span>
              </TransitionLink>
            </TextInspector>
          </Suspense>
        </div>

        <TransitionLink className="btn btn--ghost home__tool-cta" to="/tools">
          All tools
        </TransitionLink>
      </section>

      {/* The deep dives are the strongest thing on the site, so a few of them
          appear here rather than only behind a nav link. */}
      <section className="home__dives container" aria-labelledby="home-dives">
        <h2 id="home-dives" className="home__dives-title">
          Engineering deep dives
        </h2>
        <p className="home__dives-intro">
          Problems from my own work that took real digging — what broke, why,
          and what I changed.
        </p>

        <div className="home__dives-grid">
          {featured.map((challenge) => (
            <article key={challenge.id} className="home__dive">
              <p className="chip chip--label home__dive-tag">
                {challenge.project}
              </p>
              {/* The link is on the heading, not wrapped around the card, so
                  it is announced as its title rather than as the whole
                  paragraph. A pseudo-element on it covers the tile, which is
                  what makes the entire card clickable. */}
              <h3 className="home__dive-title">
                <TransitionLink
                  className="home__dive-link"
                  to={'/deep-dives?dive=' + String(challenge.id)}
                >
                  {challenge.title}
                </TransitionLink>
              </h3>
              <p className="home__dive-txt">{challenge.description}</p>
              {/* Decorative: the heading above is already the link, so
                  announcing this too would just repeat it. */}
              <p className="home__dive-more" aria-hidden="true">
                Read more <span aria-hidden="true">&rarr;</span>
              </p>
            </article>
          ))}
        </div>

        <TransitionLink className="btn btn--ghost home__dives-cta" to="/deep-dives">
          Read all deep dives
        </TransitionLink>
      </section>
    </div>
  );
};
export default Home;

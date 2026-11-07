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
 * The scratchpad is the one thing on this page a visitor can *use*, so it
 * is here rather than only behind a nav link — but it carries a parser and
 * a unit table, and none of that belongs in the bundle that has to arrive
 * before the hero paints. Lazily loaded, it costs the first view nothing.
 */
const Scratchpad = lazy(() => import('../../tools/scratchpad/Scratchpad'));

const Home = () => {
  return (
    <div className="home">
      <Hero />

      <section className="home__tool container" aria-labelledby="home-tool">
        <h2 id="home-tool" className="home__tool-title">
          Try something I built
        </h2>
        <p className="home__tool-intro">
          A calculator you write in sentences — units, currencies and
          percentages, each line able to refer to the ones above it. Edit it;
          it runs entirely in this tab.
        </p>

        {/* A plain box of the right height, so the page does not jump when
            the real thing arrives. */}
        <Suspense
          fallback={<div className="home__tool-placeholder" aria-hidden="true" />}
        >
          <Scratchpad variant="compact" />
        </Suspense>

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

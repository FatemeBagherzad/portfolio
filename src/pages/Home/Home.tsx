import Hero from '../../components/Hero/Hero';
import TransitionLink from '../../components/TransitionLink/TransitionLink';
import './Home.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import type { Challenge } from '../../types';

const featured: Challenge[] = (challengesData as Challenge[]).filter(
  (challenge) => challenge.featured
);

const Home = () => {
  return (
    <div className="home">
      <Hero />

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
              <p className="home__dive-tag">{challenge.project}</p>
              <h3 className="home__dive-title">{challenge.title}</h3>
              <p className="home__dive-txt">{challenge.description}</p>
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

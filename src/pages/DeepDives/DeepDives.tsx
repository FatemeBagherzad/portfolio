import './DeepDives.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import challengesIcn from '../../assets/icons/challenges2.webp';
import type { Challenge } from '../../types';

const challenges: Challenge[] = challengesData as Challenge[];

const rabva = challenges.filter((c) => c.project === 'Rabva');
const earlier = challenges.filter((c) => c.project !== 'Rabva');

const DeepDiveCard = ({ challenge }: { challenge: Challenge }) => (
  <article className="deep-dives__card">
    <p className="deep-dives__card-tag">{challenge.project}</p>
    <h3 className="deep-dives__card-title">{challenge.title}</h3>
    <p className="deep-dives__card-txt">{challenge.description}</p>
  </article>
);

const DeepDives = () => {
  return (
    <div className="deep-dives container">
      <h1 className="deep-dives__title">
        <img
          src={challengesIcn}
          alt=""
          width={96}
          height={96}
          className="deep-dives__icn"
        />{' '}
        Engineering Deep Dives
      </h1>
      <p className="deep-dives__intro">
        Problems from my own work that took real digging to solve — what broke,
        why, and what I changed. The Rabva ones are the closest thing I have to
        a technical interview on paper.
      </p>

      <section className="deep-dives__section" aria-labelledby="dd-rabva">
        <h2 id="dd-rabva" className="deep-dives__section-title">
          Rabva
        </h2>
        <div className="deep-dives__grid">
          {rabva.map((challenge) => (
            <DeepDiveCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>

      <section className="deep-dives__section" aria-labelledby="dd-earlier">
        <h2 id="dd-earlier" className="deep-dives__section-title">
          Earlier work &amp; learning
        </h2>
        <div className="deep-dives__grid">
          {earlier.map((challenge) => (
            <DeepDiveCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </section>
    </div>
  );
};
export default DeepDives;

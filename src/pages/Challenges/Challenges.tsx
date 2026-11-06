import './Challenges.scss';
import challengesData from '../../assets/projects-data/challenges.json';
import challengesIcn from '../../assets/icons/challenges2.webp';
import type { Challenge } from '../../types';

const challenges: Challenge[] = challengesData;

const Challenges = () => {
  return (
    <div className="challenges container">
      <h1 className="challenges__title">
        <img
          src={challengesIcn}
          alt=""
          width={96}
          height={96}
          className="challenges__icn"
        />{' '}
        My Coding Challenges
      </h1>
      <div className="challenges__grid">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="challenges__card">
            <h2 className="challenges__card-title">{challenge.title}</h2>
            <p className="challenges__card-txt">{challenge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Challenges;

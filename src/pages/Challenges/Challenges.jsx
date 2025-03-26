import './Challenges.scss';
import challenges from '../../assets/projects-data/challenges.json';
import challengesIcn from '../../assets/icons/challenges2.png';

const Challenges = () => {
  return (
    <div className="challenges container">
      <h2 className="challenges__title">
        <img src={challengesIcn} className="challenges__icn" /> My Coding
        Challenges
      </h2>
      <div className="challenges__grid">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="challenges__card">
            <h4 className="challenges__card-title">{challenge.title}</h4>
            <p className="challenges__card-txt">{challenge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Challenges;

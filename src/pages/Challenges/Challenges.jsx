import './Challenges.scss';

const Challenges = () => {
  return (
    <div className="challenges">
      <div className="challenges__back1">
        <p className="container">
          <span className="challenges__bold">Migrating My App’s Database </span>
          – I worked on moving my app's database from MongoDB to MySQL, which
          involved updating some of the server-side code and adjusting the
          queries to make everything work smoothly.
        </p>
      </div>
      <div className="challenges__back2">
        <p className="container">
          <span className="challenges__bold">Using useRef in React </span>– I
          faced a challenge while working with useRef to persist values across
          renders without causing unnecessary re-renders, but I learned a lot
          through experimenting with it.
        </p>
      </div>
      <div className="challenges__back1">
        <p className="container">
          <span className="challenges__bold">Implementing OAuth </span>– I
          worked on adding OAuth authentication to my app, which was tricky at
          first, but it’s been really useful for securing user login.
        </p>
      </div>
      <div className="challenges__back2">
        <p className="container">
          <span className="challenges__bold">Fixing Bugs with useEffect </span>–
          I had to troubleshoot some issues with state management and useEffect
          in my app to make sure the suggestion page worked as expected.
        </p>
      </div>
      <div className="challenges__back1">
        <p className="container">
          <span className="challenges__bold">Learning MySQL </span>– I spent
          some time improving my skills with MySQL, adding new fields to tables
          and making sure everything was connected properly with foreign keys.
        </p>
      </div>
      <div className="challenges__back2">
        <p className="container">
          <span className="challenges__bold">Deploying My Project </span>– I
          successfully deployed my front-end on Netlify and my back-end on
          Heroku for my capstone project, which was a pretty rewarding
          experience.
        </p>
      </div>
      <div className="challenges__back1">
        <p className="container">
          <span className="challenges__bold">Integrating Google Maps </span>– I
          figured out how to use the Google Maps API in my app to show nearby
          providers based on specific information like postal codes and benefit
          types.
        </p>
      </div>
      <div className="challenges__back2">
        <p className="container">
          <span className="challenges__bold">
            Building a Quiz App with Students{' '}
          </span>
          – I helped my students create a quiz app where users could pick their
          own TV channels. It was a great way to practice React and state
          management.
        </p>
      </div>
      <div className="challenges__back1">
        <p className="container">
          <span className="challenges__bold">Finding a Free Database </span>– I
          initially thought I found a free database to deploy my app, only to
          get a bill later. It taught me a lot about researching and
          understanding database pricing before committing.
        </p>
      </div>
      <div className="challenges__back2">
        <p className="container">
          <span className="challenges__bold">Organizing My Code </span>– I made
          sure to keep my code organized across my UI and API repositories so
          that everything was clean and easy to manage.
        </p>
      </div>
    </div>
  );
};
export default Challenges;

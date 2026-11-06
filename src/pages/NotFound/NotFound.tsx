import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container">
      <h1>Page not found</h1>
      <p>
        That page does not exist. <Link to="/">Go back to the home page</Link>.
      </p>
    </div>
  );
};
export default NotFound;

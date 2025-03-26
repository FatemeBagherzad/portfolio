import linkedinIcn from '../../assets/icons/linkedin-icon.png';
import githubIcn from '../../assets/icons/github-icon.png';
import './Contact.scss';

const Contact = () => {
  const email = 'fa.bagherzad@gmailcom';

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(email);
    alert('Email copied to clipboard!');
  };
  return (
    <div className="contact container">
      <h2>Let's Connect! 🚀</h2>
      <div className="contact__links">
        <a
          href="https://www.linkedin.com/in/fatemeh-bagherzad/"
          target="_blank"
          className="contact__link"
        >
          <img
            src={linkedinIcn}
            alt="linkedin icon"
            className="contact__link-icon"
          />{' '}
          fatemeh-bagherzad
        </a>

        <a
          href="https://github.com/FatemeBagherzad"
          target="_blank"
          className="contact__link"
        >
          <img
            src={githubIcn}
            alt="github icon"
            className="contact__link-icon"
          />
          FatemeBagherzad
        </a>

        <div className="contact__email">
          <span>{email}</span>
          <button className="btn" onClick={copyEmailToClipboard}>
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};
export default Contact;

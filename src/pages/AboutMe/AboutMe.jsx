import './AboutMe.scss';
import { motion } from 'framer-motion';

const AboutMe = () => {
  return (
    <div className="about container">
      <p className="about__name">
        Fateme
        <br />
        Bagherzad
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-lg font-medium"
      >
        <p className="about__txt">
          Hi, I'm Fateme!👋 I'm a passionate software developer with a
          background in design, and I've recently earned a Software Engineering
          diploma from BrainStation. <br /> <br />
          <div className="about__animated-txt">
            My journey in tech began with working in the design field, where I
            used AutoCAD, 3ds Max, and CATIA to draw maps, create renders, and
            produce animations of processes. However, I quickly realized that
            software development was where I wanted to focus my career. Since
            then, I've been focused on building full-stack applications and
            refining my skills in both front-end and back-end development.
          </div>
          <br />
          <div className="about__highlight-yellow">
            I have experience working with a variety of technologies, including
            React, MySQL, MongoDB, Node.js, and Vite. One of my proudest
            achievements is successfully migrating an app’s database from
            MongoDB to MySQL, which involved a lot of learning and adapting.
            I’ve also had the opportunity to integrate Google Maps into apps and
            work with APIs like OAuth for authentication.
          </div>
          <br />
          When I'm not coding, I’m often thinking about user experience and how
          to make my apps both functional and visually appealing. I enjoy
          tackling challenges, whether it’s working through complex bugs,
          optimizing code for better performance, or finding creative solutions
          to real-world problems. Each hurdle is an opportunity for me to learn
          and grow. Currently, I'm building my portfolio to showcase my projects
          and actively seeking new opportunities in software engineering. I'm
          excited to continue learning and contributing to the tech community.
        </p>
      </motion.div>
    </div>
  );
};
export default AboutMe;

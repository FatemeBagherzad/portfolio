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
        <div className="about__txt">
          <p>
            Hi, I'm Fateme. I'm a full-stack developer in Toronto, and I build
            things that are hard to get right: interfaces in three languages,
            two of them right-to-left, on top of large data that has to stay
            fast on a cheap phone.
          </p>
          <br />
          <p className="about__animated-txt">
            I studied pure mathematics, then spent nine years as a 2D/3D
            technical designer in Tehran, where I ended up leading the design
            team and writing scripts to automate the boring parts of rendering.
            That is still how I work. When something is slow or repetitive, I
            find the pattern behind it and build a tool. After moving to Canada I
            taught myself to code, finished BrainStation's software engineering
            program at the top of my cohort, and came back the next year as a
            teaching assistant to help the following class debug their Node and
            React projects.
          </p>
          <br />
          <div className="about__highlight-yellow">
            <p>
              Most of what I know, I learned by getting stuck on Rabva, a Quran
              study platform I have been building for several years. The Arabic
              text broke in ways I did not expect: Safari rendered the layout
              differently from Chrome, diacritics changed the character counts
              my data model depended on, and a plain database export quietly
              corrupted characters until I rebuilt the export pipeline around
              utf8mb4 and wrote a script to catch it. The reading view scrolls
              continuously through all 6,236 verses, so I wrote the
              virtualization myself to keep the DOM small and restore the exact
              verse a reader left off on. The research canvas lets people drag
              verses around, draw connections between words, and undo it all,
              and it had to work the same with a mouse, a finger and a keyboard.
            </p>
            <br />
            <p>
              On the back end I designed the data model and REST contracts for a
              Django API, then used AI coding agents to implement it while I
              wrote the standards, the tests and the review gates that decide
              what gets merged. Running eight isolated Docker stacks in parallel
              on one machine, with Playwright suites across six browser
              profiles, taught me more about environments than any course did.
              Production runs on AWS behind Nginx, provisioned with Terraform,
              with certificates that renew themselves.
            </p>
          </div>
          <br />
          <p>
            Before Rabva there was CampHeaven, a campsite booking app where I
            moved the database from MongoDB to MySQL halfway through, added
            GitHub OAuth and Stripe payments, and learned to read the pricing
            page before trusting a "free" database tier. There was also
            FindFood, built with UX students in a 24-hour industry sprint.
          </p>
          <br />
          <p>
            What I bring to a team is simple. I do not stop at the first thing
            that works; I keep going until I understand why it works. The math
            background shows up less in formulas and more in how I break a messy
            problem into pieces that can each be proven. I like code review,
            I write things down, and I am happy to be the person who picks up
            the problem nobody else wants. I am looking for a full-time
            front-end or full-stack role in Toronto or remote. If that sounds
            like a fit, I would like to hear from you.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default AboutMe;

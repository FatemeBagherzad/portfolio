import { useState } from 'react';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import ProjectDetail from '../../components/ProjectDetail/ProjectDetail';
import TiltCard from '../../components/TiltCard/TiltCard';
import Reveal from '../../components/Reveal/Reveal';
import projectsData from '../../assets/projects-data/projects.json';
import './Projects.scss';
import type { Project } from '../../types';

const projects: Project[] = projectsData as Project[];

const selectedWork = projects.filter((p) => p.category === 'selected');
const educationWork = projects.filter((p) => p.category === 'education');

const Projects = () => {
  const [openProject, setOpenProject] = useState<Project | null>(null);

  if (openProject) {
    return (
      <div className="projects container section">
        <button
          type="button"
          className="btn btn--ghost projects__back"
          onClick={() => setOpenProject(null)}
        >
          &larr; Back to all projects
        </button>
        <ProjectDetail project={openProject} />
      </div>
    );
  }

  return (
    <div className="projects container section">
      <p className="eyebrow">Selected work</p>
      <h1 className="projects__title">Projects</h1>
      <p className="lede projects__intro">
        Three I would want to talk through in an interview, and the
        coursework that got me there.
      </p>

      <section className="projects__section" aria-labelledby="selected-work">
        <h2 id="selected-work" className="projects__section-title">
          Selected work
        </h2>
        <div className="projects__cards projects__cards--feature">
          {selectedWork.map((project, index) => (
            <Reveal key={project.id} order={index}>
              <TiltCard>
                <ProjectCard
                  project={project}
                  onViewDetails={() => setOpenProject(project)}
                />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="projects__section" aria-labelledby="education-work">
        <h2 id="education-work" className="projects__section-title">
          Education &amp; practice
        </h2>
        <p className="projects__section-note">
          Coursework and self-directed builds from my BrainStation diploma,
          kept here because the progression is part of the story.
        </p>
        <div className="projects__cards projects__cards--compact">
          {educationWork.map((project, index) => (
            <Reveal key={project.id} order={index}>
              <TiltCard>
                <ProjectCard
                  project={project}
                  onViewDetails={() => setOpenProject(project)}
                />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
};
export default Projects;

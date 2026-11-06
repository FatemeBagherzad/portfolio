import { useState } from 'react';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import projectsData from '../../assets/projects-data/projects.json';
import './Projects.scss';
import ProjectDetail from '../../components/ProjectDetail/ProjectDetail';
import type { Project } from '../../types';

const projects: Project[] = projectsData;

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="projects container">
      <h2>Some of my projects:</h2>
      <button
        onClick={() => setSelectedProject(null)}
        className="btn projects__btn"
      >
        See all
      </button>

      {!selectedProject && (
        <div className="projects__cards">
          {projects.map((project) => {
            return (
              <ProjectCard
                key={project.id}
                projectTitle={project.title}
                projectCoverImg={project.images[0]}
                icons={project.icons}
                onClick={() => setSelectedProject(project)}
              />
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};
export default Projects;

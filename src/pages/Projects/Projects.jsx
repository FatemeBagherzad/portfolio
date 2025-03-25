import React, { useState } from 'react';
import ProjectCard from '../../components/projectCard/projectCard';
import projectsData from '../../assets/projects-data/projects.json';
import './Projects.scss';
import ProjectDetail from '../../components/ProjectDetail/ProjectDetail';

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  if (!projectsData) return <p>data loading ...</p>;
  return (
    <div className="projects container">
      <h1>Some of my projects:</h1>
      <button onClick={() => setSelectedProject(null)} className="btn">
        SEE ALL
      </button>

      {!selectedProject && (
        <div className="projects__cards">
          {projectsData.map((project) => {
            return (
              <ProjectCard
                key={project.id}
                projectTitle={project.title}
                projectCoverImg={project.images[0]}
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

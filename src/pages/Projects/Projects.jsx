import React, { useState } from 'react';
import ProjectCard from '../../components/projectCard/projectCard';
import projectsData from '../../assets/projects-data/projects.json';
import './Projects.scss';

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  if (!projectsData) return <p>data loading ...</p>;
  return (
    <div className="projects container">
      <h1>Some of my projects:</h1>

      <div className="projects__cards">
        {projectsData.map((project) => {
          return (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          );
        })}
      </div>

      {setSelectedProject && <div>detail of project</div>}
    </div>
  );
};
export default Projects;

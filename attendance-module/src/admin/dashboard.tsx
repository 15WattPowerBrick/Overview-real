// ./login/choose-role.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Project {
  projectId: string;
  projectTitle: string;
  employedBy: string;
}

const AdminDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the project data from the backend API
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:3000/bridge/projects', { withCredentials: true });
        const getExisting = await axios.get('http://localhost:3000/api/admin/getExisting', { withCredentials: true });
        console.log("this is getexisting:",getExisting);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedProjectId) {
      navigate(`/admin/import?project=${selectedProjectId}`);
    }
  };

  return (
    <>
      <div>Admin Dashboard</div>
      <div>Add a new project</div>
      <br></br>
      <form onSubmit={handleSubmit}>
        <select onChange={handleSelectChange} value={selectedProjectId || ''}>
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.projectId} - {project.employedBy} - {project.projectTitle}
            </option>
          ))}
        </select>
        <button type="submit">Import project from ELOA</button>
      </form><br />
      <button>Create new project</button>
      <div>Select existing projects</div>
    </>
  );
};

export default AdminDashboard;
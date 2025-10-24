import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SavedProjects.css";
import RoomThumbnail from "./RoomThumbnail";

const SavedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) return;
    fetch(`http://localhost:8091/api/room-projects/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedProjects = data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setProjects(sortedProjects);
        setLoading(false);
      });
  }, []);

  const handleOpen = (project) => {
    localStorage.setItem("roomProject", JSON.stringify({
      ...project,
      projectId: project.id,
    }));
    navigate("/create-room");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await fetch(`http://localhost:8091/api/room-projects/${id}`, { method: "DELETE" });
    setProjects(projects.filter((p) => p.id !== id));
  };

  if (loading) return <div>Loading...</div>;
  if (!projects.length) return <div>No saved projects.</div>;

  return (
    <div className="saved-projects-container">
      <h2>Saved Projects</h2>
      <div className="projects-grid">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => handleOpen(project)}
          >
            <div className="project-thumbnail">
              <RoomThumbnail
                dimensions={project.dimensions}
                polygon={project.polygon}
                colors={project.colors}
                lighting={project.lighting}
                furniture={project.furniture}
                width={260}
                height={140}
              />
            </div>
            <div className="project-info">
              <h3>{project.name}</h3>
              <p><b>Last Updated:</b> {new Date(project.updatedAt).toLocaleString()}</p>
            </div>
            <button
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(project.id);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedProjects;

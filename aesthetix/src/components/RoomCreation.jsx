import React, { useState } from "react";
import Room from "./Room";
import FloorPlanEditor from "./FloorPlanEditor";
import SimpleModal from "./SimpleModal";
import FurnitureBrowser from "./FurnitureBrowser";
import { FaSave } from "react-icons/fa";
import "../styles/RoomCreation.css";

const RoomCreation = () => {
  const [roomDimensions, setRoomDimensions] = useState({ width: 10, height: 5, depth: 10 });
  const [roomColors, setRoomColors] = useState({
    floor: "#e0e0e0",
    walls: "#d6d6d6",
    ceiling: "#ffffff",
  });
  const [lighting, setLighting] = useState({ ambient: 0.6, directional: 0.8 });
  const [showCeiling, setShowCeiling] = useState(true);
  const [activeTab, setActiveTab] = useState("dimensions");
  const [projectName, setProjectName] = useState("");
  const [showAllWalls, setShowAllWalls] = useState(false);
  const [roomPolygon, setRoomPolygon] = useState([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [furniture, setFurniture] = useState([]);
  const [activeFurniture, setActiveFurniture] = useState(null);
  const [selectedFurnitureIndex, setSelectedFurnitureIndex] = useState(null);
  const [projectId, setProjectId] = useState(null);

  // Save project to backend
  const saveProjectToBackend = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      alert("You must be logged in to save a project.");
      return;
    }
    const projectData = {
      userId: user.id,
      name: projectName,
      dimensions: roomDimensions,
      polygon: roomPolygon,
      colors: roomColors,
      lighting: lighting,
      showCeiling,
      showAllWalls,
      furniture,
    };
    try {
      let res;
      if (projectId) {
        // Update existing project
        res = await fetch(`http://localhost:8091/api/room-projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...projectData, id: projectId }),
        });
      } else {
        // Create new project
        res = await fetch("http://localhost:8091/api/room-projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
      }
      if (!res.ok) throw new Error("Failed to save project");
      const saved = await res.json();
      setProjectId(saved.id); // Store project id after save
      alert(projectId ? "Project updated!" : "Project saved to backend!");
    } catch (err) {
      alert("Error saving project: " + err.message);
    }
  };

  // On mount, load from localStorage if present
  React.useEffect(() => {
    const saved = localStorage.getItem("roomProject");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setProjectName(data.name);
        if (data.dimensions) setRoomDimensions(data.dimensions);
        if (data.polygon) setRoomPolygon(data.polygon);
        if (data.colors) setRoomColors(data.colors);
        if (data.lighting) setLighting(data.lighting);
        if (typeof data.showCeiling === 'boolean') setShowCeiling(data.showCeiling);
        if (typeof data.showAllWalls === 'boolean') setShowAllWalls(data.showAllWalls);
        if (Array.isArray(data.furniture)) setFurniture(data.furniture);
        if (data.projectId) setProjectId(data.projectId); // Load projectId if present
      } catch (e) { /* ignore */ }
    }
  }, []);

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name before saving.");
      return;
    }
    localStorage.setItem("roomProject", JSON.stringify({
      name: projectName,
      dimensions: roomDimensions,
      polygon: roomPolygon,
      colors: roomColors,
      lighting,
      showCeiling,
      showAllWalls,
      furniture,
      projectId, // Save projectId in localStorage
    }));
    saveProjectToBackend();
  };

  const handleResetRoom = () => {
    setRoomDimensions({ width: 10, height: 5, depth: 10 });
    setRoomColors({ floor: "#e0e0e0", walls: "#d6d6d6", ceiling: "#ffffff" });
    setLighting({ ambient: 0.6, directional: 0.8 });
    setShowCeiling(true);
    setRoomPolygon([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ]);
    setFurniture([]);
    setProjectName("");
    setProjectId(null); // Clear projectId for new project
  };

  // Handler for furniture actions from Room
  const handleRotateFurniture = (idx, angle) => {
    setFurniture(furniture => furniture.map((item, i) =>
      i === idx ? { ...item, rotation: (item.rotation || 0) + angle } : item
    ));
  };
  const handleDeleteFurniture = (idx) => {
    setFurniture(furniture => furniture.filter((_, i) => i !== idx));
    setSelectedFurnitureIndex(null);
  };
  const handleScaleFurniture = (idx, scaleFactor) => {
    setFurniture(furniture => furniture.map((item, i) =>
      i === idx ? { ...item, scale: (item.scale || 1) * scaleFactor } : item
    ));
  };
  const handleMoveFurniture = (idx, newPos) => {
    setFurniture(furniture => furniture.map((item, i) =>
      i === idx ? { ...item, position: newPos } : item
    ));
  };

  return (
    <div className="room-creation-container">
      {/* Room Preview */}
      <div className="room-preview">
        <Room
          dimensions={roomDimensions}
          polygon={roomPolygon}
          colors={roomColors}
          lighting={lighting}
          showAllWalls={showAllWalls}
          furniture={furniture}
          activeFurniture={activeFurniture}
          selectedFurnitureIndex={selectedFurnitureIndex}
          onSelectFurniture={setSelectedFurnitureIndex}
          onPlaceFurniture={(item) => {
             if (!item) return;
            setFurniture([...furniture, item]);
            setActiveFurniture(null);
            setSelectedFurnitureIndex(furniture.length); // Select newly placed
          }}
          onRotateFurniture={handleRotateFurniture}
          onDeleteFurniture={handleDeleteFurniture}
          onScaleFurniture={handleScaleFurniture}
          onMoveFurniture={handleMoveFurniture}
        />
      </div>

      {/* Controls */}
      <div className="room-controls">
        {/* Save Icon Button */}
        <button
          className="save-icon-btn"
          title="Save Project"
          onClick={handleSaveProject}
        >
          <FaSave size={22} />
        </button>

        

        {/* Project Name */}
        <div className="project-name-input">
          <label>
            Project Name:
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            onClick={() => setActiveTab("dimensions")}
            className={activeTab === "dimensions" ? "active-tab" : ""}
          >
            Dimensions
          </button>
          <button
            onClick={() => setActiveTab("furniture")}
            className={activeTab === "furniture" ? "active-tab" : ""}
          >
            Furniture
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "dimensions" && (
          <div className="tab-content">
            <button onClick={() => setIsFloorPlanOpen(true)} style={{ marginBottom: 12 }}>
              Edit Floor Plan
            </button>
            <SimpleModal isOpen={isFloorPlanOpen} onClose={() => setIsFloorPlanOpen(false)}>
              <h4>Edit Room Shape (2D Floor Plan)</h4>
              <FloorPlanEditor polygon={roomPolygon} onPolygonChange={setRoomPolygon} />
              <button onClick={() => setRoomPolygon([])} style={{ marginBottom: 12 }}>Clear Shape</button>
              <button onClick={() => setIsFloorPlanOpen(false)}>Done</button>
            </SimpleModal>
            <label>
              Wall Height (m):
              <input
                type="number"
                value={roomDimensions.height}
                onChange={(e) =>
                  setRoomDimensions({ ...roomDimensions, height: parseFloat(e.target.value) })
                }
              />
            </label>
            <label>
              Show All Walls:
              <input
                type="checkbox"
                checked={showAllWalls}
                onChange={(e) => setShowAllWalls(e.target.checked)}
              />
            </label>
            <h4>Room Colors</h4>
            <label>
              Floor:
              <input
                type="color"
                value={roomColors.floor}
                onChange={(e) => setRoomColors({ ...roomColors, floor: e.target.value })}
              />
            </label>
            <label>
              Walls:
              <input
                type="color"
                value={roomColors.walls}
                onChange={(e) => setRoomColors({ ...roomColors, walls: e.target.value })}
              />
            </label>
            <label>
              Ceiling:
              <input
                type="color"
                value={roomColors.ceiling}
                onChange={(e) => setRoomColors({ ...roomColors, ceiling: e.target.value })}
              />
            </label>

            <h4>Lighting</h4>
            <label>
              Ambient:
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lighting.ambient}
                onChange={(e) =>
                  setLighting({ ...lighting, ambient: parseFloat(e.target.value) })
                }
              />
            </label>
            <label>
              Directional:
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lighting.directional}
                onChange={(e) =>
                  setLighting({ ...lighting, directional: parseFloat(e.target.value) })
                }
              />
            </label>
            <button onClick={handleResetRoom}>Reset Room</button>
          </div>
        )}

        {activeTab === "furniture" && (
          <div className="tab-content">
            <h3>Furniture</h3>
            <p>Search and add furniture here.</p>
            <FurnitureBrowser
              onSelectFurniture={(item) => setActiveFurniture(item)}
            />
            {activeFurniture && (
              <div style={{ marginTop: 12, color: '#007bff' }}>
                Click in the room to place: <b>{activeFurniture.name}</b>
                <button style={{ marginLeft: 12 }} onClick={() => setActiveFurniture(null)}>Cancel</button>
              </div>
            )}
            {selectedFurnitureIndex !== null &&
              selectedFurnitureIndex >= 0 &&
              furniture[selectedFurnitureIndex] && (
                <div style={{ margin: '12px 0', color: '#c00' }}>
                  <b>Selected:</b> {furniture[selectedFurnitureIndex].name || 'Furniture'}
                  <button
                    style={{ marginLeft: 12 }}
                    onClick={() => {
                      setFurniture(furniture.filter((_, i) => i !== selectedFurnitureIndex));
                      setSelectedFurnitureIndex(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => setSelectedFurnitureIndex(null)}
                  >
                    Deselect
                  </button>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCreation;
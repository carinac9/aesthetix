import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/PrettAI.css';

const SavedTemplates = () => {
  // Get user_id from localStorage (assuming user object is stored there)
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    axios.get('http://127.0.0.1:8000/get-templates', { params: { user_id: userId } })
      .then((res) => {
        // Do NOT reverse, backend already returns most recent first
        setTemplates(res.data);
      })
      .catch(() => {
        alert("Failed to load saved templates.");
      });
  };

  // Delete template
  const handleDelete = (name) => {
    if (!window.confirm("Delete this template?")) return;
    axios.post('http://127.0.0.1:8000/delete-template', { user_id: userId, name })
      .then(() => {
        fetchTemplates();
      })
      .catch(() => {
        alert("Failed to delete template.");
      });
  };

  return (
    <div className="prettai-container">
      <h1 className="page-title">Saved Templates</h1>
      <div className="design-grid">
        {templates.map((template, index) => (
          <div key={index} className="design-card">
            <div className="image-wrapper" onClick={() => setSelectedTemplate(template)}>
              <img src={template.design.image_url} alt={template.design.style} />
              <button
                className="icon-delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(template.name);
                }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          
          </div>
        ))}
      </div>

      {/* Popup for furniture */}
      {selectedTemplate && (
        <div className="popup">
          <div className="popup-content">
            <button
              className="close-button11"
              type="button"
              aria-label="Close"
              onClick={() => setSelectedTemplate(null)}
            >×</button>
            <h3>Furniture Recommendations</h3>
            <div className="ikea-grid">
              {selectedTemplate.furniture?.map((item, idx) => (
                <a
                  key={item.name + idx}
                  href={item.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ikea-card"
                >
                  <img src={item.image_url} alt={item.name} />
                  <div className="ikea-info">
                    <p>Name: {item.name}</p>
                    <p>Type: {item.type}</p>
                    <p>Color: {item.color}</p>
                    <p>Size: {item.size}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedTemplates;
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/PrettAI.css';

const PrettAI = () => {
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");

  // get user_id 
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const handleFetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://127.0.0.1:8000/recommend', { prompt });
      setRecommendations(response.data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignClick = (design) => {
    setSelectedDesign(design);
  };

  const closePopup = () => {
    setSelectedDesign(null);
  };

  return (
    <div className="prettai-container">
      <h1 className="page-title">PrettAI</h1>
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter a prompt (e.g., modern kitchen designs)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && prompt && !loading) {
              handleFetchRecommendations();
            }
          }}
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      {recommendations && recommendations.design_samples?.length > 0 && (
        <div className="recommendations">
          <div className="design-section">
            <h2>Design Recommendations</h2>
            {saveMessage && (
              <div className="save-message">{saveMessage}</div>
            )}
            <div className="design-grid">
              {recommendations.design_samples.map((design) => {
                const isSaved = savedDesigns.includes(design.filename);
                return (
                  <div key={design.filename} className="design-card">
                    <div className="image-wrapper">
                      <img
                        src={design.image_url}
                        alt={design.style}
                        onClick={() => handleDesignClick(design)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                      {!isSaved && (
                        <button
                          className="icon-save-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            axios.post('http://127.0.0.1:8000/saved-templates', {
                              user_id: userId,
                              name: `template-${Date.now()}`,
                              design: design,
                              furniture: recommendations.ikea_samples
                            }).then(() => {
                              setSavedDesigns((prev) => [...prev, design.filename]);
                              setSaveMessage('Template saved!');
                              setTimeout(() => setSaveMessage(""), 1500);
                            }).catch(() => {
                              alert('Failed to save template.');
                            });
                          }}
                          title="Save template"
                        >
                          ❤️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDesign && (
            <div className="popup">
              <div className="popup-content">
                <button className="close-button11" type="button" aria-label="Close" onClick={closePopup}>×</button>
                <h3>Furniture Recommendations</h3>
                <div className="ikea-grid">
                  {recommendations.ikea_samples?.map((ikea, index) => (
                    <a
                      key={`${ikea.name}-${index}`}
                      href={ikea.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ikea-card"
                    >
                      <img
                        src={ikea.image_url}
                        alt={ikea.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                      <div className="ikea-info">
                        <p>Name: {ikea.name}</p>
                        <p>Type: {ikea.type}</p>
                        <p>Color: {ikea.color}</p>
                        <p>Size: {ikea.size}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrettAI;

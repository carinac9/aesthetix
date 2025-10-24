import React from "react";
import "../styles/Sidebar.css";

const Sidebar = ({ setActiveSection, activeSection, unreadCount }) => {
  const sections = ["User Info", "Posts", "Security & Privacy", "Notifications"];

  return (
    <aside className="sidebar">
      <img src="/image.png" alt="Decorative Vine" className="account-title" />

      <ul>
        {sections.map((section) => (
          <li
            key={section}
            className={`sidebar-item ${activeSection === section ? "active" : ""}`}
            onClick={() => setActiveSection(section)}
          >
            {section}
            {section === "Notifications" && unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="sidebar-section">
        <h2>Social Links</h2>
        <div className="social-links">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-instagram instagram-icon"></i> Instagram
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-facebook facebook-icon"></i> Facebook
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-tiktok tiktok-icon"></i> TikTok
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

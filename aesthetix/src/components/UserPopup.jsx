import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/UserPopup.css";

const UserPopup = ({ userId, username, children }) => {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

      const endpoint = userId
        ? `http://localhost:8091/api/users/preview/${userId}?viewerId=${currentUserId}`
        : `http://localhost:8091/api/users/preview-by-username/${username}?viewerId=${currentUserId}`;
      

      try {
        const res = await axios.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUser(res.data);
      } catch (err) {
        console.error("❌ Error loading user preview:", err);
      }
    };

    if (userId || username) {
      fetchUserData();
    }
  }, [userId, username]);

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.bottom,
      left: rect.left,
    });
    setShowPopup(true);
  };

  const handleMouseLeave = () => {
    setShowPopup(false);
  };

  const popupElement = (
    <div
      className="user-popup-box"
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 99999999999,
      }}
    >
      {user?.isPrivate ? (
        <p>This profile is private.</p>
      ) : user ? (
        <>
          <img
            src={user.profile_picture || "/prf.jpg"}
            alt="Profile"
            className="user-popup-avatar"
          />
          <div className="user-popup-info">
            <p><strong>{user.name}</strong></p>
            <p>{user.description || "No bio yet."}</p>
            <div className={`user-popup-status ${!(user.show_online_status && user.is_online) ? "offline" : ""}`}>
              <div className="user-popup-status-dot"></div>
              {user.show_online_status && user.is_online ? "Online" : "Offline"}
            </div>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );

  return (
    <div
      className="user-popup-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={user?.isPrivate ? "#" : `/profile/${user?.id || userId}`} className="user-popup-link">
        {children || `@${username || "Unknown"}`}
      </Link>

      {showPopup && ReactDOM.createPortal(popupElement, document.getElementById("popup-root"))}
    </div>
  );
};

export default UserPopup;

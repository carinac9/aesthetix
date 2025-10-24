import React, { useState, useEffect } from "react";
import "../styles/SecurityPrivacy.css";
import "../styles/Modal.css";
import api from "../api";

const SecurityPrivacy = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

const [formData, setFormData] = useState({
    email: storedUser?.email || "",
});

  const userEmail = storedUser?.email || "";
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [step, setStep] = useState("email"); 

  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");

  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    const fetchLoginActivity = async () => {
      try {
        const response = await api.get(`/users/login-activity/${storedUser.id}`);
        setLoginHistory(response.data);
      } catch (error) {
        console.error("Failed to load login activity:", error);
      }
    };
  
    fetchLoginActivity();
  }, [storedUser.id]);

  useEffect(() => {
    if (storedUser?.email) {
        setFormData(prev => ({
            ...prev,
            email: storedUser.email,
        }));
        fetchPrivacySettings();
    }
}, [storedUser?.email]);


  const fetchPrivacySettings = async () => {
    try {
        const response = await api.get("/users/privacy-settings", {
            params: { email: formData.email },
        });
        setShowOnlineStatus(response.data.showOnlineStatus);
        setProfileVisibility(response.data.profileVisibility);
    } catch (error) {
        console.error("Failed to fetch privacy settings:", error);
    }
};

const updatePrivacySettings = async (updatedSettings) => {
  try {
      await api.put("/users/privacy-settings", {
          email: formData.email,
          ...updatedSettings,
      });
  } catch (error) {
      console.error("Failed to update privacy settings:", error);
  }
};



  const handleSendResetToken = async (e) => {
    e.preventDefault();
    setResetError("");

    try {
      await api.post("/users/forgot-password", { email: resetEmail });
      alert("If the email exists, a reset link has been sent!");
      setStep("reset");
    } catch {
      setResetError("Failed to send reset email.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/users/reset-password", {
        token: resetToken,
        newPassword: newPassword,
      });

      if (response.status === 200) {
        alert("Password has been reset successfully!");
        setShowResetModal(false);
        setStep("email");
        setResetEmail("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setResetError("Something went wrong. Try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/users/${storedUser.id}`);
      if (res.status === 200) {
        alert("Account deleted successfully");
        localStorage.removeItem("user");
        window.location.href = "/"; // or navigate("/") if using react-router
      } else {
        alert("Failed to delete account");
      }
    } catch (err) {
      alert("An error occurred");
    }
    setShowDeleteModal(false);
  };
  

  return (
    <div className="security-page">
      <h2 className="security-title">Security & Privacy Settings</h2>

      <div className="security-section inline">
        <h3>Change Password:</h3>
        <button className="security-button" onClick={() => setShowResetModal(true)}>
            Reset Password
        </button>
      </div>
      <div className="security-section">
      <h3>Privacy Preferences</h3>
      <div className="privacy-settings">
        <div className="privacy-option">
          <span className="privacy-label">Show Online Status</span>
          <input
            type="checkbox"
            className="privacy-toggle"
            checked={showOnlineStatus}
            onChange={(e) => {
              setShowOnlineStatus(e.target.checked);
              updatePrivacySettings({
                showOnlineStatus: e.target.checked,
                profileVisibility,
              });
            }}
          />
        </div>

        <div className="privacy-option">
          <span className="privacy-label">Profile Visibility</span>
          <select
            className="privacy-select"
            value={profileVisibility}
            onChange={(e) => {
              setProfileVisibility(e.target.value);
              updatePrivacySettings({
                showOnlineStatus,
                profileVisibility: e.target.value,
              });
            }}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
    </div>

      <div className="security-section">
          <h3>Login Activity</h3>
           {loginHistory.length === 0 ? (
            <p className="info-text">No recent login activity found.</p>
          ) : (
            <ul className="login-history-list">
            {loginHistory.slice(0,3).map((log) => (
              <li key={log.id} className="login-history-item">
              <span className="login-timestamp">
            {new Date(log.timestamp).toLocaleString()}
            </span>
            {log.ipAddress && <span className="login-ip">IP: {log.ipAddress}</span>}
            {log.userAgent && <span className="login-device">Device: {log.userAgent}</span>}
           </li>
          ))}
          </ul>
        )}
      </div>


      <div className="security-section danger-zone">
        <h3>Danger Zone</h3>
        <button className="delete-btn1" onClick={() => setShowDeleteModal(true)}>
          Delete My Account
        </button>
      </div>

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn1" onClick={() => setShowResetModal(false)}>
              &times;
            </button>

            {step === "email" ? (
              <>
                <h2>Forgot Password</h2>
                <p className="modal-subtext">Enter your email to receive a reset token.</p>
                {resetError && <p style={{ color: "red" }}>{resetError}</p>}
                <form onSubmit={handleSendResetToken}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="auth-btn">Send Reset Token</button>
                </form>
              </>
            ) : (
              <>
                <h2>Reset Password</h2>
                <p className="modal-subtext">Enter your reset token and new password.</p>
                {resetError && <p style={{ color: "red" }}>{resetError}</p>}
                <form onSubmit={handleResetPassword}>
                  <input
                    type="text"
                    placeholder="Reset Token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="submit" className="auth-btn">Reset Password</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

{showDeleteModal && (
  <div className="delete-modal-overlay">
    <div className="delete-modal">
      <h2>Are you sure?</h2>
      <p>This action cannot be undone.</p>
      <div className="delete-modal-buttons">
        <button className="confirm-delete-btn" onClick={handleDelete}>
          Yes, Delete
        </button>
        <button className="cancel-delete-btn" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default SecurityPrivacy;

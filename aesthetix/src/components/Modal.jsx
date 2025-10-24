import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../api";
import "../styles/Modal.css";

function Modal({ onClose, type, onAuthSuccess }) {
  const [formType, setFormType] = useState(type); 
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFormType(type);
  }, [type]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // handle forgot password 
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/users/forgot-password", { email: resetEmail });
      alert("If the email exists, a reset link has been sent!");
      setFormType("reset-password"); 
    } catch {
      setError("Failed to send reset email. Try again.");
    }
  };

  // handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/users/reset-password", {
        token: resetToken, 
        newPassword: newPassword,
      });

      if (response.status === 200) {
        alert("Password has been reset successfully!");
        setFormType("login"); // redirect to login 
      }
    } catch {
      setError("Error resetting password. Try again.");
    }
  };

  // handle Login / Sign up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formType === "signup" && formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      let response;
      if (formType === "signup") {
        const userData = {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          passwordHash: formData.password,
        };
        response = await api.post("/users", userData);
      } else {
        response = await api.post("/users/login", {
          email: formData.email,
          password: formData.password,
        });
      }

      console.log("Auth successful:", response.data);
      onAuthSuccess(response.data);
      onClose();
    } catch {
      setError("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn1" onClick={onClose}>&times;</button>

        {/*  forgot password form  */}
        {formType === "forgot-password" ? (
          <>
            <h2>Forgot Password</h2>
            <p className="modal-subtext">Enter your email to receive a reset token.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleForgotPassword}>
              <input type="email" name="resetEmail" placeholder="Enter your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              <button type="submit" className="auth-btn">Send Reset Token</button>
            </form>
            <button type="button" className="switch-btn" onClick={() => setFormType("login")}>
              Back to Login
            </button>
          </>
        ) : formType === "reset-password" ? (
          <>
            {/*  reset password form  */}
            <h2>Reset Password</h2>
            <p className="modal-subtext">Enter your reset token and new password.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleResetPassword}>
              <input type="text" name="resetToken" placeholder="Enter your reset token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
              <input type="password" name="newPassword" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <input type="password" name="confirmPassword" placeholder="Confirm new password" value={confirmPassword} onChange={handleConfirmPasswordChange} required />
              <button type="submit" className="auth-btn">Reset Password</button>
            </form>
            <button type="button" className="switch-btn" onClick={() => setFormType("login")}>
              Back to Login
            </button>
          </>
        ) : formType === "signup" ? (
          <>
            {/*  sign up form */}
            <h2>Create Your Account</h2>
            <p className="modal-subtext">Sign up and start designing.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={handleConfirmPasswordChange} required />
              <button type="submit" className="auth-btn">Sign Up</button>
            </form>
            <p className="switch-auth">
              Already have an account?
              <button type="button" className="switch-btn" onClick={() => setFormType("login")}>
                Log In
              </button>
            </p>
          </>
        ) : (
          <>
            {/* login form */}
            <h2>Welcome Back!</h2>
            <p className="modal-subtext">Log in to continue.</p>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <button type="submit" className="auth-btn">Log In</button>
            </form>
            <p className="switch-auth">
              Don&apos;t have an account?
              <button type="button" className="switch-btn" onClick={() => setFormType("signup")}>
                Sign Up
              </button>
            </p>
            <p className="forgot-password">
              <button type="button" className="forgot-password-btn" onClick={() => setFormType("forgot-password")}>
                Forgot Password?
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  onAuthSuccess: PropTypes.func.isRequired,
};

export default Modal;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/UserManagement.css";

function UserManagement() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      setMessage("⚠️ Password field cannot be empty.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await axios.put(
        `http://localhost:8080/api/users/${user.id}/password`,
        { password }
      );
      setMessage("✅ Password updated successfully!");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile-page">
      <div className="profile-container-card">
        {/* Profile Header */}
        <div className="profile-header-banner">
          <div className="profile-avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-header-text">
            <h2>{user?.name || "Safari Explorer"}</h2>
            <span className="profile-role-badge">
              {user?.role === "ADMIN" ? "⚡ System Admin" : "⚓ Registered Explorer"}
            </span>
          </div>
        </div>

        <div className="profile-body-content">
          {/* Section 1: Account Information */}
          <div className="profile-card-section">
            <h3>👤 Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user?.name || "N/A"}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">{user?.email || "N/A"}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Access Role</span>
                <span className="info-value">{user?.role || "USER"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Password Update */}
          <div className="profile-card-section">
            <h3>🔒 Account Security</h3>
            <p className="section-hint">Update your account password for enhanced account security.</p>
            
            <div className="password-update-form">
              <input
                type="password"
                placeholder="Enter new password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-password"
              />
              <button 
                className="btn-update-pass" 
                onClick={handleUpdatePassword}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
            {message && <p className="status-message">{message}</p>}
          </div>

          {/* Section 3: Account Actions */}
          <div className="profile-card-section danger">
            <h3>🚪 Account Session</h3>
            <p className="section-hint">Sign out of your active safari management session.</p>
            <button className="btn-logout-danger" onClick={handleLogout}>
              Logout of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;


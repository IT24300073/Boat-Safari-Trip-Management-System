import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/UserManagement.css";

const PASSWORD_CRITERIA = [
  {
    id: "length",
    label: "At least 8 characters",
    isValid: (pwd) => pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter (A-Z)",
    isValid: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter (a-z)",
    isValid: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: "number",
    label: "At least one number (0-9)",
    isValid: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: "special",
    label: "At least one special symbol (!@#$%...)",
    isValid: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd),
  },
];

function UserManagement() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  // Sync missing profile details (like id or phone) if user logged in via fallback
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.id && user.email) {
      axios
        .get("http://localhost:8080/api/users")
        .then((res) => {
          const matched = (res.data || []).find(
            (u) => u.email?.toLowerCase() === user.email?.toLowerCase()
          );
          if (matched) {
            updateUser(matched);
          }
        })
        .catch((err) => console.error("Could not sync user profile:", err));
    }
  }, [user, navigate, updateUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Calculate Password Strength Level
  const getPasswordStrength = () => {
    if (!password) {
      return { score: 0, label: "None", colorClass: "none", percent: 0 };
    }

    const metCount = PASSWORD_CRITERIA.filter((c) => c.isValid(password)).length;

    switch (metCount) {
      case 1:
        return { score: 1, label: "Very Weak", colorClass: "very-weak", percent: 20 };
      case 2:
        return { score: 2, label: "Weak", colorClass: "weak", percent: 40 };
      case 3:
        return { score: 3, label: "Moderate", colorClass: "moderate", percent: 60 };
      case 4:
        return { score: 4, label: "Strong", colorClass: "strong", percent: 80 };
      case 5:
        return { score: 5, label: "Optimal", colorClass: "optimal", percent: 100 };
      default:
        return { score: 0, label: "None", colorClass: "none", percent: 0 };
    }
  };

  const strength = getPasswordStrength();
  const allCriteriaMet = PASSWORD_CRITERIA.every((c) => c.isValid(password));
  const isConfirmMatching =
    confirmPassword.length > 0 && password === confirmPassword;
  const isConfirmMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setMessage({ type: "error", text: "⚠️ Password field cannot be empty." });
      return;
    }

    if (!allCriteriaMet) {
      setMessage({
        type: "error",
        text: "⚠️ Password is not strong enough. Please satisfy all 5 security requirements.",
      });
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setMessage({
        type: "error",
        text: "⚠️ Passwords do not match. Please ensure both fields match.",
      });
      return;
    }

    setLoading(true);

    // Auto-resolve user ID if missing in state
    let targetId = user?.id;
    if (!targetId && user?.email) {
      try {
        const res = await axios.get("http://localhost:8080/api/users");
        const matched = (res.data || []).find(
          (u) => u.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (matched?.id) {
          targetId = matched.id;
          updateUser(matched);
        }
      } catch (err) {
        console.error("Auto-resolving user ID failed:", err);
      }
    }

    try {
      // Use specific ID endpoint or generic fallback endpoint
      const url = targetId
        ? `http://localhost:8080/api/users/${targetId}/password`
        : "http://localhost:8080/api/users/password";

      const payload = {
        password: cleanPassword,
        email: user?.email,
      };

      const response = await axios.put(url, payload);

      setMessage({
        type: "success",
        text: response.data?.message || "✅ Password updated successfully!",
      });

      setPassword("");
      setConfirmPassword("");

      // Update auth context so current session reflects updated password
      if (updateUser) {
        updateUser({ password: cleanPassword });
      }
    } catch (err) {
      console.error("Password update error:", err);
      const serverMsg = err.response?.data?.message;
      setMessage({
        type: "error",
        text: serverMsg || "❌ Failed to update password. Please check connection and try again.",
      });
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
              {user?.role === "ADMIN"
                ? "⚡ System Admin"
                : user?.role === "STAFF"
                ? "🧭 Safari Staff"
                : "⚓ Registered Explorer"}
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
                <span className="info-label">Phone Number</span>
                <span className="info-value">{user?.phone || "N/A"}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Access Role</span>
                <span className="info-value">{user?.role || "USER"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Safari Bookings Quick Access */}
          {user?.role !== "STAFF" && (
            <div className="profile-card-section bookings-shortcut-section">
              <div className="section-title-row">
                <h3>🎟️ Safari Bookings & Passes</h3>
                <span className="shortcut-badge">Explorer Portal</span>
              </div>
              <p className="section-hint">
                View all your reserved river safaris, track upcoming expeditions, and download official booking invoices.
              </p>
              <button
                className="btn-view-my-bookings"
                onClick={() => navigate("/my-bookings")}
              >
                <span>View My Safari Bookings</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          )}

          {/* Section 3: Security & Password Update */}
          <div className="profile-card-section">
            <h3>🔒 Account Security</h3>
            <p className="section-hint">Update your account password with a strong, secure passphrase.</p>

            <form className="password-update-form" onSubmit={handleUpdatePassword}>
              <div
                className={`password-input-group ${
                  password.length > 0
                    ? allCriteriaMet
                      ? "valid"
                      : "invalid"
                    : ""
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new strong password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="eye-icon"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="eye-icon"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Modern Password Strength Meter & Interactive Checklist */}
              {password.length > 0 && (
                <div className="password-strength-container">
                  <div className="strength-header-row">
                    <span className="strength-title">
                      🛡️ Security Strength
                    </span>
                    <span className={`strength-pill ${strength.colorClass}`}>
                      {strength.label}
                    </span>
                  </div>

                  <div className="strength-bar-track">
                    <div
                      className={`strength-bar-fill ${strength.colorClass}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>

                  <div className="requirements-grid">
                    {PASSWORD_CRITERIA.map((criterion) => {
                      const isMet = criterion.isValid(password);
                      return (
                        <div
                          key={criterion.id}
                          className={`requirement-item ${isMet ? "met" : ""}`}
                        >
                          <span className="req-icon">{isMet ? "✓" : "○"}</span>
                          <span>{criterion.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div
                className={`password-input-group ${
                  isConfirmMatching ? "valid" : isConfirmMismatch ? "invalid" : ""
                }`}
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="eye-icon"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="eye-icon"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password Real-time Match Indicator */}
              {confirmPassword.length > 0 && (
                <div
                  className={`match-indicator ${
                    isConfirmMatching ? "match" : "mismatch"
                  }`}
                >
                  {isConfirmMatching ? "✓ Passwords match" : "✕ Passwords do not match"}
                </div>
              )}

              <button
                type="submit"
                className="btn-update-pass"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>

            {message.text && (
              <div className={`status-message ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Section 4: Account Actions */}
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

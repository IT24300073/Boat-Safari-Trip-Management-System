import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Login.css";
import "../Styles/Login.css";

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

function ResetPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) {
      return { score: 0, label: "None", colorClass: "none", percent: 0 };
    }

    const metCount = PASSWORD_CRITERIA.filter((c) => c.isValid(pwd)).length;

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
  const allCriteriaMet = PASSWORD_CRITERIA.every((c) => c.isValid(formData.password));
  const isConfirmMatching =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const isConfirmMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!allCriteriaMet) {
      setMessage({ type: "error", text: "⚠️ Password is not strong enough. Please satisfy all 5 security criteria." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "⚠️ Passwords do not match! Please verify both fields." });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put("http://localhost:8080/api/users/password", {
        email: formData.email.trim(),
        password: formData.password
      });
      
      setMessage({ type: "success", text: "Password reset successful! You can now login." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password. Check if email is correct."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-header">
          <div className="auth-brand-badge">🚤 ALOKA SAFARI</div>
          <h2>Reset Password</h2>
          <p>Enter your registered email and new password.</p>
        </div>

        {message.text && (
          <div className={`auth-error-alert ${message.type === 'success' ? 'success' : ''}`} style={{ backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div
              className={`input-with-icon ${
                formData.password.length > 0
                  ? allCriteriaMet
                    ? "valid"
                    : "invalid"
                  : ""
              }`}
            >
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a strong password..."
                className="has-toggle"
                required
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {formData.password.length > 0 && (
              <div className="password-strength-container">
                <div className="strength-header-row">
                  <span className="strength-title">🛡️ Security Strength</span>
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
                    const isMet = criterion.isValid(formData.password);
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
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div
              className={`input-with-icon ${
                isConfirmMatching ? "valid" : isConfirmMismatch ? "invalid" : ""
              }`}
            >
              <span className="input-icon">🔑</span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="has-toggle"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            
            {formData.confirmPassword.length > 0 && (
              <div
                className={`match-indicator ${
                  isConfirmMatching ? "match" : "mismatch"
                }`}
              >
                {isConfirmMatching ? "✓ Passwords match" : "✕ Passwords do not match"}
              </div>
            )}
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-card-footer">
          <button
            type="button"
            className="btn-auth-secondary"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Registration.css";

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

function Registration() {
  const navigate = useNavigate();
  const [regMode, setRegMode] = useState("email"); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle Input Changes & Enforce Strict 10-Digit Mobile Restriction
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Allow only digits (0-9) and strictly truncate to 10 characters maximum
      const cleanDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: cleanDigits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate Password Strength Level
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Name Validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    // Email Mode Validation
    if (regMode === "email") {
      if (!formData.email.trim()) {
        setError("Please enter your email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError("Please enter a valid email address (e.g. name@example.com).");
        return;
      }
      // If optional phone is entered, enforce 10 digits
      if (formData.phone && formData.phone.length !== 10) {
        setError("Mobile number must be exactly 10 digits (e.g. 0771234567).");
        return;
      }
    }

    // Phone Mode Validation
    if (regMode === "phone") {
      if (!formData.phone || formData.phone.length !== 10) {
        setError("Please enter a valid 10-digit mobile number (e.g. 0771234567).");
        return;
      }
      if (formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          setError("Optional email provided is not in a valid format.");
          return;
        }
      }
    }

    // Strong Password Validation
    if (!allCriteriaMet) {
      setError("⚠️ Password is not strong enough. Please satisfy all 5 security criteria.");
      return;
    }

    // Confirm Password Matching
    if (formData.password !== formData.confirmPassword) {
      setError("⚠️ Passwords do not match! Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/register",
        {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          password: formData.password.trim(),
        }
      );

      if (response.data) {
        alert("🎉 Registration successful! Please log in to continue.");
        navigate("/login");
      } else {
        setError("An account already exists with this Email or Mobile number.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.status === 409) {
        setError("Email or Mobile number is already registered. Try signing in instead.");
      } else {
        setError("Registration failed. Please verify your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper registration-card">
        <div className="auth-card-header">
          <div className="auth-brand-badge">🚤 ALOKA SAFARI</div>
          <h2>Create Account</h2>
          <p>Join ALOKA Safari to book unforgettable water adventures</p>
        </div>

        {/* Registration Mode Selector */}
        <div className="reg-mode-selector">
          <button
            type="button"
            className={`mode-tab ${regMode === "email" ? "active" : ""}`}
            onClick={() => {
              setRegMode("email");
              setError("");
            }}
          >
            📧 Register via Email
          </button>
          <button
            type="button"
            className={`mode-tab ${regMode === "phone" ? "active" : ""}`}
            onClick={() => {
              setRegMode("phone");
              setError("");
            }}
          >
            📱 Register via Phone
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* Primary Contact: Email Mode */}
          {regMode === "email" ? (
            <>
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
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Optional Phone Field */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="phone">Mobile Number (Optional)</label>
                  <span
                    className={`digit-counter-badge ${
                      formData.phone.length === 10 ? "complete" : ""
                    }`}
                  >
                    {formData.phone.length === 10
                      ? "✓ 10/10 digits"
                      : `${formData.phone.length}/10 digits`}
                  </span>
                </div>
                <div
                  className={`input-with-icon ${
                    formData.phone.length === 10 ? "valid" : ""
                  }`}
                >
                  <span className="input-icon">📱</span>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX (10 digits)"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                  />
                </div>
                <span className="input-hint">
                  Only numbers allowed. Sri Lankan standard 10 digits (e.g. 0771234567).
                </span>
              </div>
            </>
          ) : (
            /* Primary Contact: Phone Mode */
            <>
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="phone">Mobile Number</label>
                  <span
                    className={`digit-counter-badge ${
                      formData.phone.length === 10 ? "complete" : ""
                    }`}
                  >
                    {formData.phone.length === 10
                      ? "✓ 10/10 digits"
                      : `${formData.phone.length}/10 digits`}
                  </span>
                </div>
                <div
                  className={`input-with-icon ${
                    formData.phone.length === 10 ? "valid" : ""
                  }`}
                >
                  <span className="input-icon">📱</span>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX (10 digits)"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    autoComplete="tel"
                  />
                </div>
                <span className="input-hint">
                  Must be exactly 10 digits without spaces or symbols (e.g. 0771234567).
                </span>
              </div>

              {/* Optional Email Field */}
              <div className="form-group">
                <label htmlFor="email">Email Address (Optional)</label>
                <div className="input-with-icon">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password with Modern Strength UI */}
          <div className="form-group">
            <label htmlFor="password">Create Password</label>
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
            {formData.password.length > 0 && (
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

          {/* Confirm Password */}
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

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>Already have an account?</p>
          <button
            type="button"
            className="btn-auth-secondary"
            onClick={() => navigate("/login")}
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;

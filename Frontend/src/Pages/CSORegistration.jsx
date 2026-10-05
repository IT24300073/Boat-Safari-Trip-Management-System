import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Mail, Phone, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../Styles/CSORegistration.css';
import '../Styles/Registration.css'; // Import shared password strength styles

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

const CSORegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER', // Always register as standard USER (Tourist)
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.length < 3) {
      setError("Name must be at least 3 characters long");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid phone number (10-15 digits)");
      return false;
    }
    if (!allCriteriaMet) {
      setError("Password is not strong enough. Please satisfy all security criteria.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    return true;
  };

  const handleRegisterTourist = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/users/register', formData);
      setSuccess(`Tourist ${formData.name} has been successfully registered!`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'USER',
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.status === 409) {
        setError('A user with this email or phone number already exists.');
      } else {
        setError('Failed to register tourist. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cso-register-container">
      <div className="cso-register-header">
        <div className="cso-badge">Customer Service</div>
        <h1>Tourist Registration</h1>
        <p>Register walk-in or phone-in customers quickly so they can book safaris.</p>
      </div>

      <div className="cso-form-card">
        <form onSubmit={handleRegisterTourist} className="cso-form">
          
          {error && (
            <div className="cso-alert cso-alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="cso-alert cso-alert-success">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          <div className="cso-form-grid">
            <div className="cso-input-group">
              <label>Full Name</label>
              <div className="cso-input-wrapper">
                <UserPlus size={18} className="cso-icon" />
                <input 
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="cso-input-group">
              <label>Email Address</label>
              <div className="cso-input-wrapper">
                <Mail size={18} className="cso-icon" />
                <input 
                  type="email"
                  name="email"
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="cso-input-group">
              <label>Phone Number</label>
              <div className="cso-input-wrapper">
                <Phone size={18} className="cso-icon" />
                <input 
                  type="tel"
                  name="phone"
                  placeholder="e.g. 0712345678"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="cso-input-group">
              <label>Temporary Password</label>
              <div className="cso-input-wrapper">
                <Lock size={18} className="cso-icon" />
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Assign a temporary password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="cso-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Modern Password Strength Meter & Interactive Checklist */}
              {formData.password.length > 0 && (
                <div className="password-strength-container" style={{ marginTop: '10px' }}>
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

            <div className="cso-input-group">
              <label>Confirm Password</label>
              <div
                className={`cso-input-wrapper ${
                  isConfirmMatching ? "valid-match" : isConfirmMismatch ? "invalid-match" : ""
                }`}
              >
                <Lock size={18} className="cso-icon" />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter the password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="cso-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && (
                <div
                  className={`match-indicator ${
                    isConfirmMatching ? "match" : "mismatch"
                  }`}
                  style={{ marginTop: '8px' }}
                >
                  {isConfirmMatching ? (
                    <>
                      <CheckCircle size={14} /> Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> Passwords do not match
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cso-form-actions">
            <button type="submit" className="btn-cso-submit" disabled={loading}>
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <UserPlus size={20} />
                  Register Tourist
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CSORegistration;

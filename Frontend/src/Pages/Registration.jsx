import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Registration.css";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() && !formData.phone.trim()) {
      setError("Please provide either an Email address or a Phone number.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/register",
        {
          name: formData.name,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          password: formData.password,
        }
      );

      if (response.data) {
        alert("🎉 Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError("Account already exists with this Email or Phone number.");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setError("Email or Phone number is already registered. Try signing in instead.");
      } else {
        setError("Registration failed. Please verify your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-header">
          <div className="auth-brand-badge">🚤 ALOKA SAFARI</div>
          <h2>Create Account</h2>
          <p>Join ALOKA Safari to book unforgettable water adventures</p>
        </div>

        <div className="reg-mode-selector">
          <button
            type="button"
            className={`mode-tab ${regMode === "email" ? "active" : ""}`}
            onClick={() => setRegMode("email")}
          >
            📧 Register via Email
          </button>
          <button
            type="button"
            className={`mode-tab ${regMode === "phone" ? "active" : ""}`}
            onClick={() => setRegMode("phone")}
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
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {regMode === "email" ? (
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
          ) : (
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-with-icon">
                <span className="input-icon">📱</span>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  required
                />
              </div>
            </div>
          )}

          {/* Optional secondary field */}
          {regMode === "email" ? (
            <div className="form-group">
              <label htmlFor="phone" className="optional-label">
                Phone Number <span>(Optional)</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">📱</span>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="email" className="optional-label">
                Email Address <span>(Optional)</span>
              </label>
              <div className="input-with-icon">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔑</span>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
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


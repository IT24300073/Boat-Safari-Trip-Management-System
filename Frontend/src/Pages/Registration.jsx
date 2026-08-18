import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Registration.css";

function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/register",
        formData
      );

      if (response.data) {
        alert("🎉 Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError("Email already exists. Please use a different email address.");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setError("Email already registered. Try signing in instead.");
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


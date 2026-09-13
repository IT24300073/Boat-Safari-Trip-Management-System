import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (user?.role === "ADMIN") {
        navigate("/admin");
      } else if (user?.role === "STAFF") {
        navigate("/schedule");
      } else {
        navigate("/booktrip");
      }
    }
  }, [isLoggedIn, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const inputVal = formData.identifier.trim();

    // Hardcoded admin login fallback
    if (inputVal === "admin@gmail.com" && formData.password === "admin") {
      login({ email: "admin@gmail.com", name: "System Admin", role: "ADMIN" });
      setLoading(false);
      navigate("/admin");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/login",
        {
          email: inputVal,
          phone: inputVal,
          password: formData.password,
        },
        { validateStatus: () => true }
      );

      if (response.status === 200 && response.data) {
        login(response.data);

        if (response.data.role === "ADMIN") {
          navigate("/admin");
        } else if (response.data.role === "STAFF") {
          navigate("/schedule");
        } else {
          navigate("/booktrip");
        }
      } else if (response.status === 423) {
        setError(
          response.data?.message ||
            "🔒 Account Locked: Your account has been locked after 5 failed login attempts. Please contact administrator."
        );
      } else if (response.status === 401) {
        setError(
          response.data?.message ||
            "Invalid email/phone or password. Please check your credentials."
        );
      } else {
        setError("Login failed. Please verify connection and try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card-header">
          <div className="auth-brand-badge">🚤 ALOKA SAFARI</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to manage bookings & explore safaris</p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email Address or Phone Number</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="name@example.com or +94771234567"
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
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="has-toggle"
                required
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
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Account"}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>Don’t have an account yet?</p>
          <button
            type="button"
            className="btn-auth-secondary"
            onClick={() => navigate("/register")}
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;


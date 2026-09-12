import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (user?.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
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
        } else {
          navigate("/");
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
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
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


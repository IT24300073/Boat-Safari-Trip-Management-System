import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Login.css";

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Hardcoded admin login fallback
    if (formData.email === "admin@gmail.com" && formData.password === "admin") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify({ email: "admin", role: "ADMIN" }));
      setIsLoggedIn(true);
      setLoading(false);
      navigate("/admin");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/login",
        formData,
        { validateStatus: () => true }
      );

      if (response.status === 200 && response.data) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(response.data));
        setIsLoggedIn(true);

        if (response.data.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else if (response.status === 401) {
        setError("Invalid email or password. Please check your credentials.");
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


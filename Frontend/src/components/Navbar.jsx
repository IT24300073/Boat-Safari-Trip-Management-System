import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar({ isLoggedIn }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [isLoggedIn, location]);

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">🚤</span>
          <span className="brand-name">ALOKA <span className="brand-accent">Safari</span></span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Home
          </Link>
          <Link to="/booktrip" className={`nav-link ${isActive("/booktrip") ? "active" : ""}`}>
            Book Trip
          </Link>
          <Link to="/feedback" className={`nav-link ${isActive("/feedback") ? "active" : ""}`}>
            Feedback
          </Link>

          {!isLoggedIn ? (
            <Link to="/login" className="btn-nav-login">
              Sign In
            </Link>
          ) : (
            <div className="nav-user-group">
              {user?.role === "ADMIN" && (
                <Link to="/admin" className={`nav-link admin-pill ${isActive("/admin") ? "active" : ""}`}>
                  ⚡ Admin Panel
                </Link>
              )}
              <Link to="/usermanagement" className="user-profile-link" title="My Account">
                <span className="user-avatar-small">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;


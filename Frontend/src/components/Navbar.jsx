import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const isActive = (path) => location.pathname === path;
  const isHomePage = location.pathname === "/";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">🚤</span>
          <span className="brand-name">ALOKA <span className="brand-accent">Safari</span></span>
        </Link>
        
        <div className="nav-links">
          {/* Hide inner page links on homepage so only Sign In & Register appear */}
          {!isHomePage && (
            <>
              <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
                Home
              </Link>
              <Link to="/booktrip" className={`nav-link ${isActive("/booktrip") ? "active" : ""}`}>
                Book Trip
              </Link>
              <Link to="/feedback" className={`nav-link ${isActive("/feedback") ? "active" : ""}`}>
                Feedback
              </Link>
              {isLoggedIn && (
                <>
                  <Link to="/maintenance" className={`nav-link ${isActive("/maintenance") ? "active" : ""}`}>
                    🛠️ Maintenance
                  </Link>
                  <Link to="/schedule" className={`nav-link ${isActive("/schedule") ? "active" : ""}`}>
                    🧭 Schedule
                  </Link>
                </>
              )}
            </>
          )}

          {!isLoggedIn ? (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          ) : (
            <div className="nav-user-group">
              {user?.role === "ADMIN" && (
                <Link to="/admin" className={`nav-link admin-pill ${isActive("/admin") ? "active" : ""}`}>
                  ⚡ Admin Panel
                </Link>
              )}
              <NotificationBell />
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


import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";
  const isUser = user?.role === "USER";
  const isOpManager = user?.role === "OPERATION_MANAGER";
  const isMarketing = user?.role === "MARKETING_COORDINATOR";
  const isCSO = user?.role === "CUSTOMER_SERVICE_OFFICER";
  const isFinanceExecutive = user?.role === "FINANCE_EXECUTIVE";

  if (
    location.pathname.startsWith("/admin") ||
    (isAdmin && (location.pathname.startsWith("/schedule") || location.pathname.startsWith("/maintenance")))
  ) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  const brandTarget = isLoggedIn
    ? (isAdmin ? "/admin" : (isStaff ? "/schedule" : (isOpManager ? "/operations-dashboard" : (isMarketing ? "/marketing-dashboard" : (isCSO ? "/cso-register" : (isFinanceExecutive ? "/finance-executive" : "/booktrip"))))))
    : "/";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={brandTarget} className="brand-logo">
          <span className="brand-icon">🚤</span>
          <span className="brand-name">ALOKA <span className="brand-accent">Safari</span></span>
        </Link>
        
        <div className="nav-links">
          {!isLoggedIn ? (
            /* Logged out: strictly Sign In & Register */
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          ) : (
            /* Logged in: Role-based navigation */
            <>
              {/* Regular USER only tabs: Book Trip, My Bookings & Feedback */}
              {isUser && (
                <>
                  <Link to="/booktrip" className={`nav-link ${isActive("/booktrip") ? "active" : ""}`}>
                    Book Trip
                  </Link>
                  <Link to="/my-bookings" className={`nav-link ${isActive("/my-bookings") ? "active" : ""}`}>
                    My Bookings
                  </Link>
                  <Link to="/feedback" className={`nav-link ${isActive("/feedback") ? "active" : ""}`}>
                    Feedback
                  </Link>
                </>
              )}

              {/* STAFF only tabs: Maintenance (hidden for USER & ADMIN) */}
              {isStaff && (
                <>
                  <Link to="/maintenance" className={`nav-link ${isActive("/maintenance") ? "active" : ""}`}>
                    🛠️ Maintenance
                  </Link>
                </>
              )}

              {/* OPERATION_MANAGER only tabs */}
              {isOpManager && (
                <>
                  <Link to="/schedule" className={`nav-link ${isActive("/schedule") ? "active" : ""}`}>
                    🧭 Safari Fleet Schedules
                  </Link>
                  <Link to="/operations-dashboard" className={`nav-link ${isActive("/operations-dashboard") ? "active" : ""}`}>
                    📅 Upcoming Trips
                  </Link>
                  <Link to="/operations-group-bookings" className={`nav-link ${isActive("/operations-group-bookings") ? "active" : ""}`}>
                    👥 Group Bookings
                  </Link>
                  <Link to="/operations-feedback" className={`nav-link ${isActive("/operations-feedback") ? "active" : ""}`}>
                    ⭐ Customer Feedback
                  </Link>
                  <Link to="/report" className={`nav-link ${isActive("/report") ? "active" : ""}`}>
                    📊 Operations Audit
                  </Link>
                </>
              )}

              {/* MARKETING_COORDINATOR only tabs */}
              {isMarketing && (
                <Link to="/marketing-dashboard" className={`nav-link ${isActive("/marketing-dashboard") ? "active" : ""}`}>
                  📈 Demand Trends
                </Link>
              )}

              {/* CUSTOMER_SERVICE_OFFICER only tabs */}
              {isCSO && (
                <>
                  <Link to="/cso-register" className={`nav-link ${isActive("/cso-register") ? "active" : ""}`}>
                    👤 Register Tourist
                  </Link>
                  <Link to="/booktrip" className={`nav-link ${isActive("/booktrip") ? "active" : ""}`}>
                    🎫 Book Safari
                  </Link>
                </>
              )}

              {/* FINANCE_EXECUTIVE only tabs */}
              {isFinanceExecutive && (
                <Link to="/finance-executive" className={`nav-link ${isActive("/finance-executive") ? "active" : ""}`}>
                  💳 Finance Panel
                </Link>
              )}

              <div className="nav-user-group">
                {isAdmin && (
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;


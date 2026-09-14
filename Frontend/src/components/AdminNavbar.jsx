import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminPanel.css";

const ADMIN_TABS = [
  { id: "bookings", label: "📋 Bookings" },
  { id: "users", label: "👥 Users" },
  { id: "boats", label: "🚤 Boats" },
  { id: "trips", label: "🗺️ Trips" },
  { id: "feedbacks", label: "💬 Feedbacks" },
  { id: "reports", label: "📊 Reports & Audit" },
];

function AdminNavbar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleTabClick = (tabId) => {
    if (tabId === "reports") {
      if (location.pathname !== "/report") {
        navigate("/report");
      }
      return;
    }

    if (location.pathname === "/admin") {
      if (setActiveTab) {
        setActiveTab(tabId);
      }
      navigate(`/admin?tab=${tabId}`, { replace: true });
    } else {
      navigate(`/admin?tab=${tabId}`);
    }
  };

  return (
    <div className="admin-navbar-wrapper">
      {/* Top Header Bar */}
      <div className="admin-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link to="/admin" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 style={{ margin: 0, cursor: "pointer" }}>Admin Portal</h1>
          </Link>
          <span style={{
            fontSize: "0.75rem",
            background: "rgba(245, 158, 11, 0.15)",
            color: "var(--amber-light)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "4px 10px",
            borderRadius: "20px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Operations & Control
          </span>
        </div>

        <div className="admin-user-controls">
          {user && (
            <span className="admin-user-badge">
              ⚡ Logged as: <strong>{user.name || user.email}</strong>
            </span>
          )}

          <button className="btn-admin-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="admin-tabs">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active-tab" : ""}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminNavbar;

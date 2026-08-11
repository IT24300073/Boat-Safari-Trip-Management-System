import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar({ isLoggedIn }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Always call useEffect
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [isLoggedIn]);

  // Conditionally render navbar
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="navbar">
      <h1 className="logo">Boat Safari</h1>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/booktrip">Book Trip</Link>
        <Link to="/feedback">Feedback</Link>

        {!isLoggedIn ? (
          <Link to="/login">Login</Link>
        ) : (
          <>
            {/* Show Admin Panel link if user is admin */}
            {user?.role === "ADMIN" && <Link to="/admin">Admin Panel</Link>}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

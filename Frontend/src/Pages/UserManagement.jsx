import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/UserManagement.css";

function UserManagement() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ✅ Update Password
  const handleUpdatePassword = async () => {
    if (!password) {
      setMessage("⚠️ Password cannot be empty");
      return;
    }

    try {
      await axios.put(
        `http://localhost:8080/api/users/${user.id}/password`,
        { password }
      );
      setMessage("✅ Password updated successfully");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error updating password");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          alt="Profile"
          className="profile-image"
        />
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-container">

        <div className="profile-section">
          <h3>User Details</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>

        <div className="profile-section">
          <h3>Update Password</h3>
          <input
            type="password"
            placeholder="Enter new password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-update" onClick={handleUpdatePassword}>
            Update Password
          </button>
          {message && <p className="message">{message}</p>}
        </div>

        <div className="profile-section">
          <h3>Account Actions</h3>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./NotificationBell.css";

function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  const userEmail = user?.email;

  const fetchNotifications = () => {
    if (!isLoggedIn || !userEmail) return;

    axios
      .get(`http://localhost:8080/api/notifications?email=${encodeURIComponent(userEmail)}`)
      .then((res) => {
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      })
      .catch((err) => console.error("Error fetching notifications:", err));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [isLoggedIn, userEmail]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userEmail) return;
    try {
      await axios.put(`http://localhost:8080/api/notifications/read-all?email=${encodeURIComponent(userEmail)}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Schedule Alerts"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications & Alerts</h4>
            {unreadCount > 0 && (
              <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications or schedule alerts.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.read ? "read" : "unread"} ${n.type?.toLowerCase()}`}
                >
                  <div className="item-header">
                    <span className="item-title">{n.title}</span>
                    <span className="item-time">
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  <p className="item-message">{n.message}</p>
                  {!n.read && (
                    <button
                      className="btn-read"
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

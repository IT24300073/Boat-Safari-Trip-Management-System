import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/OperationsGroupBookings.css";

const OperationsGroupBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/bookings");
      // Filter for group bookings that are pending approval
      const pendingGroupBookings = response.data.filter(
        (b) => b.bookingStatus === "PENDING" && b.passengers > 5
      );
      setBookings(pendingGroupBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load group bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this group booking?")) return;
    try {
      // First get the booking
      const bRes = await axios.get(`http://localhost:8080/api/bookings/${id}`);
      const booking = bRes.data;
      booking.bookingStatus = "CONFIRMED";

      // Then update it
      await axios.put(`http://localhost:8080/api/bookings/${id}`, booking);
      alert("✅ Group booking approved successfully.");
      fetchBookings();
    } catch (err) {
      console.error("Error approving booking:", err);
      alert("❌ Failed to approve booking.");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Please enter a reason for rejecting this group booking:");
    if (reason === null) return; // User cancelled

    try {
      const bRes = await axios.get(`http://localhost:8080/api/bookings/${id}`);
      const booking = bRes.data;
      booking.bookingStatus = "REJECTED";
      booking.cancelReason = reason || "Rejected by Operations Manager.";

      await axios.put(`http://localhost:8080/api/bookings/${id}`, booking);
      alert("✅ Group booking rejected successfully.");
      fetchBookings();
    } catch (err) {
      console.error("Error rejecting booking:", err);
      alert("❌ Failed to reject booking.");
    }
  };

  return (
    <div className="operations-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Group Bookings Review</h1>
          <p>
            Welcome, {user?.name || "Manager"}. Review high-value group
            bookings (more than 5 passengers) before confirming capacity.
          </p>
        </div>
      </div>

      <div className="group-bookings-content">
        {loading ? (
          <div className="loading-state">Loading pending bookings...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <h3>All caught up!</h3>
            <p>There are no pending group bookings to review.</p>
          </div>
        ) : (
          <div className="group-booking-cards">
            {bookings.map((booking) => (
              <div key={booking.id} className="group-booking-card">
                <div className="gb-card-header">
                  <div className="gb-booking-id">Booking #{booking.id}</div>
                  <div className="gb-status">⏳ Pending Review</div>
                </div>
                
                <div className="gb-card-body">
                  <div className="gb-detail-row">
                    <span className="gb-label">Tourist Name:</span>
                    <span className="gb-value">{booking.name}</span>
                  </div>
                  <div className="gb-detail-row">
                    <span className="gb-label">Safari Date:</span>
                    <span className="gb-value">{booking.safariDate}</span>
                  </div>
                  <div className="gb-detail-row">
                    <span className="gb-label">Time Slot:</span>
                    <span className="gb-value">{booking.timeSlot}</span>
                  </div>
                  <div className="gb-detail-row highlight-row">
                    <span className="gb-label">Passengers:</span>
                    <span className="gb-value highlight-value">
                      {booking.passengers} (Group)
                    </span>
                  </div>
                  <div className="gb-detail-row">
                    <span className="gb-label">Trip:</span>
                    <span className="gb-value">{booking.trip?.name || "N/A"}</span>
                  </div>
                  <div className="gb-detail-row">
                    <span className="gb-label">Boat:</span>
                    <span className="gb-value">{booking.boat?.name || "N/A"}</span>
                  </div>
                </div>

                <div className="gb-card-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(booking.id)}
                  >
                    ✅ Approve Booking
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(booking.id)}
                  >
                    ❌ Reject Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsGroupBookings;

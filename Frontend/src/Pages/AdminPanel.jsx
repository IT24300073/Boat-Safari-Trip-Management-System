import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../Styles/AdminPanel.css";

const AdminPanel = () => {
  const { logout, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- at the top, add state for feedbacks ---
const [feedbacks, setFeedbacks] = useState([]);
const [feedbackForm, setFeedbackForm] = useState({
  id: null,
  name: "",
  userEmail: "",
  message: "",
  rating: 5,
});

// --- Fetch feedbacks along with dashboard ---
const fetchFeedbacks = () => {
  axios
    .get("http://localhost:8080/api/feedbacks")
    .then((res) => setFeedbacks(res.data))
    .catch(console.error);
};

// --- useEffect ---
useEffect(() => {
  fetchDashboard();
  fetchTrips();
  fetchFeedbacks();
}, []);

// --- Feedback Handlers ---
const handleFeedbackChange = (e) => {
  setFeedbackForm({ ...feedbackForm, [e.target.name]: e.target.value });
};

const handleSaveFeedback = () => {
  if (!feedbackForm.name || feedbackForm.name.trim().length < 3) return alert("Name must be at least 3 chars");
  if (!feedbackForm.message || feedbackForm.message.trim().length < 10) return alert("Message must be at least 10 chars");

  const payload = {
    name: feedbackForm.name,
    message: feedbackForm.message,
    rating: parseInt(feedbackForm.rating),
    userEmail: feedbackForm.userEmail || "", // optional
  };

  const apiCall = feedbackForm.id
    ? axios.put(`http://localhost:8080/api/feedbacks/${feedbackForm.id}`, payload)
    : axios.post("http://localhost:8080/api/feedbacks", payload);

  apiCall
    .then(() => {
      setFeedbackForm({ id: null, name: "", message: "", rating: 5, userEmail: "" });
      fetchFeedbacks();
    })
    .catch(console.error);
};

const handleEditFeedback = (f) => {
  setFeedbackForm({
    id: f.id,
    name: f.name,
    message: f.message,
    rating: f.rating,
    userEmail: f.userEmail,
  });
};

const handleDeleteFeedback = (id) => {
  if (!window.confirm("Are you sure you want to delete this feedback?")) return;
  axios
    .delete(`http://localhost:8080/api/feedbacks/${id}`)
    .then(fetchFeedbacks)
    .catch(console.error);
};

const handleReviewFeedback = (id) => {
  axios
    .put(`http://localhost:8080/api/feedbacks/${id}/review`)
    .then(fetchFeedbacks)
    .catch(console.error);
};

const [feedbackFilter, setFeedbackFilter] = useState("ALL"); // ALL, FLAGGED, REVIEWED


  // --- Booking Form ---
  const [bookingForm, setBookingForm] = useState({
    id: null,
    name: "",
    email: "",
    safariDate: "",
    adults: "",
    children: "",
    totalPrice: "",
    boatId: "",
    tripId: "",
  });
   // --- User Form ---
   const [userForm, setUserForm] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER"
  });

  // Handle user form change
  const handleUserChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  // Save User
  const handleSaveUser = () => {
    const payload = {
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      password: userForm.password,
      role: userForm.role
    };

    const apiCall = userForm.id
      ? axios.put(`http://localhost:8080/api/users/${userForm.id}`, payload)
      : axios.post("http://localhost:8080/api/users/register", payload);

    apiCall
      .then(() => {
        setUserForm({ id: null, name: "", email: "", phone: "", password: "", role: "USER" });
        fetchDashboard();
      })
      .catch(console.error);
  };

  // Edit User
  const handleEditUser = (user) => {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role
    });
  };

  // Delete User
  const handleDeleteUser = (id) => {
    axios
      .delete(`http://localhost:8080/api/users/${id}`)
      .then(fetchDashboard)
      .catch(console.error);
  };

  // Unlock User Account
  const handleUnlockUser = (id) => {
    axios
      .put(`http://localhost:8080/api/users/${id}/unlock`)
      .then(fetchDashboard)
      .catch(console.error);
  };

  // --- Boat Form ---
  const [boatForm, setBoatForm] = useState({
    id: null,
    name: "",
    capacity: "",
    price: "",
    boatType: "Luxury",
    status: "AVAILABLE",
  });
  const boatTypes = ["Luxury", "Standard", "Fishing", "Speed", "Catamaran", "Pontoon"];

  // --- Trip Form ---
  const [tripForm, setTripForm] = useState({
    id: null,
    name: "",
    type: "Shared",
    adultPrice: "",
    childPrice: "",
    description: "",
    startingTime: "Managed in Schedule",
    duration: "2 Hours",
  });

  // --- Fetch Data ---
  const fetchDashboard = () => {
    axios
      .get("http://localhost:8080/api/admin/dashboard")
      .then((res) => {
        const data = res.data;
        setBookings(data.bookings || []);
        setUsers(data.users || []);
        setBoats(data.boats || []);
      })
      .catch((err) => console.error(err));
  };

  const fetchTrips = () => {
    axios
      .get("http://localhost:8080/api/trips")
      .then((res) => setTrips(res.data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDashboard();
    fetchTrips();
  }, []);

  // --- Booking Validation ---
  const validateBooking = (b) => {
    if (!b.name || b.name.trim().length < 3)
      return "Name must be at least 3 characters.";
    if (!b.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))
      return "Invalid email address.";
    if (!b.safariDate) return "Safari Date is required.";
    if (!b.adults || isNaN(b.adults) || parseInt(b.adults) < 1)
      return "At least 1 adult is required.";
    if (isNaN(b.children) || parseInt(b.children) < 0)
      return "Children must be 0 or more.";
    if (!b.totalPrice || isNaN(b.totalPrice) || parseFloat(b.totalPrice) < 1)
      return "Total Price must be greater than 0.";
    if (!b.boatId) return "Please select a Boat.";
    if (!b.tripId) return "Please select a Trip.";
    return null;
  };

  // --- Booking Handlers & Auto-Calculation ---
  const calculateBookingTotal = (adultsVal, childrenVal, boatIdVal, tripIdVal) => {
    const adultCount = parseInt(adultsVal) || 0;
    const childCount = parseInt(childrenVal) || 0;

    const boat = boats.find((b) => String(b.id) === String(boatIdVal));
    const trip = trips.find((t) => String(t.id) === String(tripIdVal));

    const boatRate = boat ? Number(boat.price || 0) : 0;
    const adultRate = trip ? Number(trip.adultPrice || 0) : 0;
    const childRate = trip ? Number(trip.childPrice || 0) : 0;

    if (adultCount > 0 || childCount > 0 || boat || trip) {
      const sum = adultCount * adultRate + childCount * childRate + boatRate;
      return sum > 0 ? sum.toFixed(2) : "";
    }
    return "";
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...bookingForm, [name]: value };

    if (name === "adults" || name === "children" || name === "boatId" || name === "tripId") {
      const calc = calculateBookingTotal(
        name === "adults" ? value : updated.adults,
        name === "children" ? value : updated.children,
        name === "boatId" ? value : updated.boatId,
        name === "tripId" ? value : updated.tripId
      );
      if (calc) {
        updated.totalPrice = calc;
      }
    }

    setBookingForm(updated);
  };

  const handleSaveBooking = () => {
    let finalTotalPrice = parseFloat(bookingForm.totalPrice);
    if (isNaN(finalTotalPrice) || finalTotalPrice <= 0) {
      const computed = calculateBookingTotal(
        bookingForm.adults,
        bookingForm.children,
        bookingForm.boatId,
        bookingForm.tripId
      );
      finalTotalPrice = parseFloat(computed) || 0;
    }

    const formToValidate = {
      ...bookingForm,
      totalPrice: finalTotalPrice > 0 ? String(finalTotalPrice) : bookingForm.totalPrice,
    };

    const error = validateBooking(formToValidate);
    if (error) return alert(error);

    const adultsCount = parseInt(bookingForm.adults);
    const childrenCount = parseInt(bookingForm.children) || 0;

    const payload = {
      ...bookingForm,
      adults: adultsCount,
      children: childrenCount,
      passengers: adultsCount + childrenCount,
      totalPrice: finalTotalPrice,
      boat: bookingForm.boatId ? { id: parseInt(bookingForm.boatId) } : null,
      trip: bookingForm.tripId ? { id: parseInt(bookingForm.tripId) } : null,
    };

    const apiCall = bookingForm.id
      ? axios.put(
          `http://localhost:8080/api/bookings/${bookingForm.id}`,
          payload
        )
      : axios.post("http://localhost:8080/api/bookings", payload);

    apiCall
      .then(() => {
        setBookingForm({
          id: null,
          name: "",
          email: "",
          safariDate: "",
          adults: "",
          children: "",
          totalPrice: "",
          boatId: "",
          tripId: "",
        });
        fetchDashboard();
      })
      .catch((err) => {
        console.error(err);
        const msg = err.response?.data?.message || "Boat assignment conflicts with an existing booking or maintenance status.";
        alert("⚠️ Assignment Conflict: " + msg);
      });
  };

  const handleEditBooking = (booking) =>
    setBookingForm({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      safariDate: booking.safariDate || "",
      adults: booking.adults,
      children: booking.children,
      totalPrice: booking.totalPrice,
      boatId: booking.boat?.id || "",
      tripId: booking.trip?.id || "",
    });

  const handleDeleteBooking = (id) =>
    axios
      .delete(`http://localhost:8080/api/bookings/${id}`)
      .then(fetchDashboard)
      .catch(console.error);

  // --- Boat Validation ---
  const validateBoat = (b) => {
    if (!b.name || b.name.trim().length < 3)
      return "Boat name must be at least 3 characters.";
    if (!b.capacity || isNaN(b.capacity) || parseInt(b.capacity) < 1)
      return "Capacity must be at least 1.";
    if (!b.price || isNaN(b.price) || parseFloat(b.price) < 1)
      return "Price must be greater than 0.";
    return null;
  };

  // --- Boat Handlers ---
  const handleBoatChange = (e) =>
    setBoatForm({ ...boatForm, [e.target.name]: e.target.value });

  const handleSaveBoat = () => {
    const error = validateBoat(boatForm);
    if (error) return alert(error);

    const payload = {
      ...boatForm,
      capacity: parseInt(boatForm.capacity),
      price: parseFloat(boatForm.price),
    };

    const apiCall = boatForm.id
      ? axios.put(`http://localhost:8080/api/boats/${boatForm.id}`, payload)
      : axios.post("http://localhost:8080/api/boats", payload);

    apiCall
      .then(() => {
        setBoatForm({
          id: null,
          name: "",
          capacity: "",
          price: "",
          boatType: "Luxury",
          status: "AVAILABLE",
        });
        fetchDashboard();
      })
      .catch(console.error);
  };

  const handleEditBoat = (boat) => setBoatForm(boat);
  const handleDeleteBoat = (id) =>
    axios
      .delete(`http://localhost:8080/api/boats/${id}`)
      .then(fetchDashboard)
      .catch(console.error);

  // --- Trip Validation ---
  const validateTrip = (trip) => {
    if (!trip.name || trip.name.trim().length < 3)
      return "Trip name must be at least 3 characters.";
    if (trip.name.length > 50) return "Trip name cannot exceed 50 characters.";
    if (
      !trip.adultPrice ||
      isNaN(trip.adultPrice) ||
      parseFloat(trip.adultPrice) <= 1
    )
      return "Adult Price must be greater than 1.";
    if (
      !trip.childPrice ||
      isNaN(trip.childPrice) ||
      parseFloat(trip.childPrice) <= 1
    )
      return "Child Price must be greater than 1.";
    if (trip.description && trip.description.length > 250)
      return "Description cannot exceed 250 characters.";
    return null;
  };

  // --- Trip Handlers ---
  const handleTripChange = (e) =>
    setTripForm({ ...tripForm, [e.target.name]: e.target.value });

  const handleSaveTrip = () => {
    const errorMsg = validateTrip(tripForm);
    if (errorMsg) return alert(errorMsg);

    const payload = {
      ...tripForm,
      adultPrice: parseFloat(tripForm.adultPrice),
      childPrice: tripForm.childPrice ? parseFloat(tripForm.childPrice) : null,
      startingTime: "Managed in Schedule",
      duration: "2 Hours",
    };

    const apiCall = tripForm.id
      ? axios.put(`http://localhost:8080/api/trips/${tripForm.id}`, payload)
      : axios.post("http://localhost:8080/api/trips", payload);

    apiCall
      .then(() => {
        setTripForm({
          id: null,
          name: "",
          type: "Shared",
          adultPrice: "",
          childPrice: "",
          startingTime: "Managed in Schedule",
          duration: "2 Hours",
          description: "",
        });
        fetchTrips();
      })
      .catch(console.error);
  };

  const handleEditTrip = (trip) =>
    setTripForm({
      id: trip.id,
      name: trip.name,
      type: trip.type,
      adultPrice: trip.adultPrice,
      childPrice: trip.childPrice,
      startingTime: "Managed in Schedule",
      duration: "2 Hours",
      description: trip.description || "",
    });
  const handleDeleteTrip = (id) =>
    axios
      .delete(`http://localhost:8080/api/trips/${id}`)
      .then(fetchTrips)
      .catch(console.error);

  return (
    <div className="admin-container">
      <div className="admin-header-bar">
        <h1>Admin Panel</h1>
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
      <div className="admin-tabs">
      {["bookings", "users", "boats", "trips", "feedbacks"].map((tab) => (
  <button
    key={tab}
    className={activeTab === tab ? "active-tab" : ""}
    onClick={() => setActiveTab(tab)}
  >
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
))}

      </div>

      {/* ✅ BOOKINGS */}
      {activeTab === "bookings" && (
        <section>
          <h2>Bookings</h2>
          {/* --- REPORT BUTTON --- */}
          <div className="report-action">
            <button
              className="generate-report-btn"
              onClick={() => {
                axios
                  .post("http://localhost:8080/api/reports/generate")
                  .then((res) => {
                    console.log("Report generated:", res.data);
                    navigate("/report"); // ✅ now works
                  })
                  .catch((err) => console.error(err));
              }}
            >
              Generate Report
            </button>
          </div>

          {/* Table */}
          {bookings.length === 0 ? (
            <p>No bookings</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Safari Date</th>
                  <th>Time Slot</th>
                  <th>Adults</th>
                  <th>Children</th>
                  <th>Total Price</th>
                  <th>Boat</th>
                  <th>Trip</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.name}</td>
                    <td>{b.email}</td>
                    <td>{b.safariDate}</td>
                    <td>
                      <span className="badge-duration">
                        {b.timeSlot || "08:00 - 10:00 AM"}
                      </span>
                    </td>
                    <td>{b.adults}</td>
                    <td>{b.children}</td>
                    <td>{b.totalPrice}</td>
                    <td>{b.boat?.name || "N/A"}</td>
                    <td>{b.trip?.name || "N/A"}</td>
                    <td>
                      <button onClick={() => handleEditBooking(b)}>Edit</button>
                      <button onClick={() => handleDeleteBooking(b.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Form */}
          <div className="booking-form">
            <h3>{bookingForm.id ? "Update Booking" : "Add Booking"}</h3>
            <input
              name="name"
              value={bookingForm.name}
              onChange={handleBookingChange}
              placeholder="Name"
              required
            />
            <input
              name="email"
              value={bookingForm.email}
              onChange={handleBookingChange}
              placeholder="Email"
              required
            />
            <input
              type="date"
              name="safariDate"
              value={bookingForm.safariDate}
              onChange={handleBookingChange}
              required
            />
            <input
              type="number"
              min="1"
              name="adults"
              value={bookingForm.adults}
              onChange={handleBookingChange}
              placeholder="Adults"
              required
            />
            <input
              type="number"
              min="0"
              name="children"
              value={bookingForm.children}
              onChange={handleBookingChange}
              placeholder="Children"
            />
            <div className="total-price-wrapper">
              <input
                type="number"
                min="1"
                step="0.01"
                name="totalPrice"
                value={bookingForm.totalPrice}
                onChange={handleBookingChange}
                placeholder="Total Price (Auto)"
                readOnly
                className="total-price-auto-input"
                title="Automatically calculated based on: (Adults × Adult Price) + (Children × Child Price) + Boat Price"
                required
              />
              <span className="auto-calc-badge">⚡ Auto-calculated</span>
            </div>
            <select
              name="boatId"
              value={bookingForm.boatId}
              onChange={handleBookingChange}
              required
            >
              <option value="">Select Boat</option>
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.boatType}) — LKR {Number(b.price || 0).toLocaleString()}
                </option>
              ))}
            </select>
            <select
              name="tripId"
              value={bookingForm.tripId}
              onChange={handleBookingChange}
              required
            >
              <option value="">Select Trip</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type}) — Adult: LKR {Number(t.adultPrice || 0).toLocaleString()} | Child: LKR {Number(t.childPrice || 0).toLocaleString()}
                </option>
              ))}
            </select>
            <button onClick={handleSaveBooking}>
              {bookingForm.id ? "Update" : "Add"}
            </button>
            {bookingForm.id && (
              <button
                type="button"
                className="btn-cancel-edit-booking"
                onClick={() =>
                  setBookingForm({
                    id: null,
                    name: "",
                    email: "",
                    safariDate: "",
                    adults: "",
                    children: "",
                    totalPrice: "",
                    boatId: "",
                    tripId: "",
                  })
                }
              >
                Cancel
              </button>
            )}

            {/* Live Calculation Formula Breakdown */}
            {bookingForm.totalPrice && (
              <div className="price-breakdown-pill">
                <span>
                  💡 <strong>Auto-Calculated Total:</strong> ({bookingForm.adults || 0} Adults × LKR {Number(trips.find(t => String(t.id) === String(bookingForm.tripId))?.adultPrice || 0).toLocaleString()}) + ({bookingForm.children || 0} Children × LKR {Number(trips.find(t => String(t.id) === String(bookingForm.tripId))?.childPrice || 0).toLocaleString()}) + Boat: {boats.find(b => String(b.id) === String(bookingForm.boatId))?.name || "Selected Boat"} (LKR {Number(boats.find(b => String(b.id) === String(bookingForm.boatId))?.price || 0).toLocaleString()}) = <strong>LKR {Number(bookingForm.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </span>
              </div>
            )}
          </div>
        </section>
      )}

     {/* Users */}
     {activeTab === "users" && (
        <section>
          <h2>Users</h2>

          {/* User List Table */}
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email || "-"}</td>
                    <td>{u.phone || "-"}</td>
                    <td>{u.role}</td>
                    <td>
                      {u.accountLocked ? (
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>🔒 Locked</span>
                      ) : (
                        <span style={{ color: "#10b981", fontWeight: 600 }}>Active</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleEditUser(u)}>Edit</button>
                      {u.accountLocked && (
                        <button
                          onClick={() => handleUnlockUser(u.id)}
                          style={{ backgroundColor: "#0284c7", color: "#fff", marginLeft: "4px" }}
                        >
                          Unlock
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* User Form */}
          <div className="user-form">
            <h3>{userForm.id ? "Update User" : "Add User"}</h3>
            <input
              name="name"
              value={userForm.name}
              onChange={handleUserChange}
              placeholder="User Name"
            />
            <input
              name="email"
              value={userForm.email}
              onChange={handleUserChange}
              placeholder="Email Address"
            />
            <input
              name="phone"
              value={userForm.phone}
              onChange={handleUserChange}
              placeholder="Phone Number"
            />
            <input
              name="password"
              value={userForm.password}
              onChange={handleUserChange}
              placeholder="Password"
            />
            <select name="role" value={userForm.role} onChange={handleUserChange}>
              <option value="USER">USER</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button onClick={handleSaveUser}>
              {userForm.id ? "Update User" : "Add User"}
            </button>
          </div>
        </section>
      )}


      {/* ✅ BOATS */}
      {activeTab === "boats" && (
        <section className="admin-section-boats">
          <div className="section-header-flex">
            <h2>🚤 Fleet & Boat Resource Management</h2>
          </div>

          {/* Fleet Metrics Banner */}
          <div className="fleet-metrics-banner">
            <div className="fleet-metric-item">
              <span className="metric-icon">🚤</span>
              <div>
                <span className="metric-value">{boats.length}</span>
                <span className="metric-label">Total Fleet Boats</span>
              </div>
            </div>

            <div className="fleet-metric-item">
              <span className="metric-icon">👥</span>
              <div>
                <span className="metric-value">
                  {boats.reduce((acc, b) => acc + (parseInt(b.capacity) || 0), 0)} Seats
                </span>
                <span className="metric-label">Combined Seating Capacity</span>
              </div>
            </div>

            <div className="fleet-metric-item">
              <span className="metric-icon">✅</span>
              <div>
                <span className="metric-value">
                  {boats.filter((b) => b.status === "AVAILABLE" || !b.status).length}
                </span>
                <span className="metric-label">Active Available Boats</span>
              </div>
            </div>

            <div className="fleet-metric-item">
              <span className="metric-icon">🛠️</span>
              <div>
                <span className="metric-value">
                  {boats.filter((b) => b.status === "MAINTENANCE" || b.status === "UNAVAILABLE").length}
                </span>
                <span className="metric-label">Maintenance / Unavailable</span>
              </div>
            </div>
          </div>

          {/* Boat Registration Form */}
          <div className="boat-registration-form-card">
            <h3>{boatForm.id ? "✏️ Edit Boat Resource Record" : "➕ Register New Boat Resource"}</h3>
            <div className="form-fields-grid">
              <div className="input-group">
                <label>Boat Name *</label>
                <input
                  name="name"
                  value={boatForm.name}
                  onChange={handleBoatChange}
                  placeholder="e.g. Aloka Royal Cruise"
                  required
                />
              </div>

              <div className="input-group">
                <label>Seating Capacity (Seats) *</label>
                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={boatForm.capacity}
                  onChange={handleBoatChange}
                  placeholder="e.g. 12"
                  required
                />
              </div>

              <div className="input-group">
                <label>Base Price (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  name="price"
                  value={boatForm.price}
                  onChange={handleBoatChange}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              <div className="input-group">
                <label>Boat Vessel Type</label>
                <select
                  name="boatType"
                  value={boatForm.boatType}
                  onChange={handleBoatChange}
                >
                  {boatTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Operational Status</label>
                <select
                  name="status"
                  value={boatForm.status || "AVAILABLE"}
                  onChange={handleBoatChange}
                >
                  <option value="AVAILABLE">✅ Available for Trips</option>
                  <option value="MAINTENANCE">🛠️ Under Maintenance</option>
                  <option value="UNAVAILABLE">🚫 Unavailable</option>
                </select>
              </div>
            </div>

            <div className="form-actions-row">
              <button className="btn-save-boat" onClick={handleSaveBoat}>
                {boatForm.id ? "💾 Save Changes & Update Record" : "🚀 Register Boat to Fleet"}
              </button>
              {boatForm.id && (
                <button
                  className="btn-cancel-edit"
                  onClick={() =>
                    setBoatForm({
                      id: null,
                      name: "",
                      capacity: "",
                      price: "",
                      boatType: "Luxury",
                      status: "AVAILABLE",
                    })
                  }
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Registered Boats Records Table */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Boat Name</th>
                  <th>Seating Capacity</th>
                  <th>Base Price (LKR)</th>
                  <th>Vessel Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boats.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                      No boat records registered. Use the form above to add a boat.
                    </td>
                  </tr>
                ) : (
                  boats.map((b) => (
                    <tr key={b.id}>
                      <td><strong>#{b.id}</strong></td>
                      <td><strong>{b.name}</strong></td>
                      <td>
                        <span className="capacity-badge">🎟️ {b.capacity} Seats</span>
                      </td>
                      <td>LKR {Number(b.price).toLocaleString()}</td>
                      <td>{b.boatType}</td>
                      <td>
                        {b.status === "MAINTENANCE" || b.status === "UNAVAILABLE" ? (
                          <span className="status-badge maintenance">🛠️ Maintenance</span>
                        ) : (
                          <span className="status-badge available">✅ Available</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button className="btn-edit-action" onClick={() => handleEditBoat(b)}>
                            Edit
                          </button>
                          <button className="btn-delete-item" onClick={() => handleDeleteBoat(b.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {/* ✅ FEEDBACKS */}
{activeTab === "feedbacks" && (
  <section className="admin-section-feedbacks">
    <div className="section-header-flex">
      <h2>Guest Feedbacks & Quality Monitoring</h2>
      {feedbacks.filter((f) => f.flagged && !f.reviewed).length > 0 && (
        <div className="low-rating-alert-banner">
          ⚠️ <strong>{feedbacks.filter((f) => f.flagged && !f.reviewed).length} Pending Low-Rating Alerts</strong> (Rating ≤ 3 Stars require prompt review)
        </div>
      )}
    </div>

    {/* Filter Buttons */}
    <div className="feedback-filter-bar">
      <button
        className={`btn-filter ${feedbackFilter === "ALL" ? "active" : ""}`}
        onClick={() => setFeedbackFilter("ALL")}
      >
        All Reviews ({feedbacks.length})
      </button>
      <button
        className={`btn-filter alert ${feedbackFilter === "FLAGGED" ? "active" : ""}`}
        onClick={() => setFeedbackFilter("FLAGGED")}
      >
        ⚠️ Low Rating Alerts ({feedbacks.filter((f) => f.flagged && !f.reviewed).length})
      </button>
      <button
        className={`btn-filter ${feedbackFilter === "REVIEWED" ? "active" : ""}`}
        onClick={() => setFeedbackFilter("REVIEWED")}
      >
        ✓ Reviewed ({feedbacks.filter((f) => f.reviewed).length})
      </button>
    </div>

    {/* Feedback Table */}
    {feedbacks.length === 0 ? (
      <p className="no-data-text">No feedbacks available.</p>
    ) : (
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Guest Name</th>
            <th>Rating</th>
            <th>Message</th>
            <th>Email</th>
            <th>System Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks
            .filter((f) => {
              if (feedbackFilter === "FLAGGED") return f.flagged && !f.reviewed;
              if (feedbackFilter === "REVIEWED") return f.reviewed;
              return true;
            })
            .map((f) => (
              <tr key={f.id} className={f.flagged && !f.reviewed ? "row-flagged-alert" : ""}>
                <td><strong>#{f.id}</strong></td>
                <td>{f.name}</td>
                <td>
                  <span className="rating-stars">
                    {"⭐".repeat(Math.min(5, Math.max(1, f.rating || 5)))}
                  </span>
                  <span className="rating-num"> ({f.rating}/5)</span>
                </td>
                <td className="message-cell">{f.message}</td>
                <td>{f.email}</td>
                <td>
                  {f.flagged && !f.reviewed ? (
                    <span className="badge-flagged-alert" title={f.flagReason}>
                      ⚠️ FLAGGED (Low Rating)
                    </span>
                  ) : f.reviewed ? (
                    <span className="badge-reviewed">✓ Reviewed</span>
                  ) : (
                    <span className="badge-normal">Normal</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons-cell">
                    {f.flagged && !f.reviewed && (
                      <button
                        className="btn-mark-reviewed"
                        onClick={() => handleReviewFeedback(f.id)}
                        title="Mark alert as reviewed/resolved"
                      >
                        ✓ Mark Reviewed
                      </button>
                    )}
                    <button
                      className="btn-delete-item"
                      onClick={() => handleDeleteFeedback(f.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    )}
  </section>
)}


      {/* ✅ TRIPS */}
      {activeTab === "trips" && (
        <section>
          <h2>Trips</h2>
          <div className="trip-form">
            <input
              name="name"
              value={tripForm.name}
              onChange={handleTripChange}
              placeholder="Trip Name"
              required
            />
            <select
              name="type"
              value={tripForm.type}
              onChange={handleTripChange}
            >
              {["Shared", "Private", "Cabin"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2"
              step="0.01"
              name="adultPrice"
              value={tripForm.adultPrice}
              onChange={handleTripChange}
              placeholder="Adult Price"
              required
            />
            <input
              type="number"
              min="2"
              step="0.01"
              name="childPrice"
              value={tripForm.childPrice}
              onChange={handleTripChange}
              placeholder="Child Price"
              required
            />
            <div className="trip-fixed-info-tag">
              <span>⏱️ Standard Duration: <strong>2 Hours</strong></span>
              <span>📅 Departure Time: <strong>Managed in Operations Schedule</strong></span>
            </div>
            <textarea
              name="description"
              value={tripForm.description || ""}
              onChange={handleTripChange}
              placeholder="Description"
            />
            <button onClick={handleSaveTrip}>
              {tripForm.id ? "Update" : "Add"}
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Adult Price</th>
                <th>Child Price</th>
                <th>Duration</th>
                <th>Departure Time</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan="9">No trips available</td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.name}</td>
                    <td>{t.type}</td>
                    <td>{t.adultPrice}</td>
                    <td>{t.childPrice || "N/A"}</td>
                    <td>
                      <span className="badge-duration">2 Hours</span>
                    </td>
                    <td>
                      <span className="badge-schedule-managed">Managed in Schedule</span>
                    </td>
                    <td>{t.description}</td>
                    <td>
                      <button onClick={() => handleEditTrip(t)}>Edit</button>
                      <button onClick={() => handleDeleteTrip(t.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default AdminPanel;

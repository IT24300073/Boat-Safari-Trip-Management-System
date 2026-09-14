import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/MyBookings.css";

function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'all', 'upcoming', 'past'
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  // Supporting State for Edit & Delete
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    safariDate: "",
    adults: 1,
    children: 0,
    boatId: "",
  });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Fetch boats & trips for edit modal dropdowns and price calculation
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/boats")
      .then((res) => {
        const available = (res.data || []).filter(
          (b) => b.status !== "MAINTENANCE" && b.status !== "UNAVAILABLE"
        );
        setBoats(available);
      })
      .catch((err) => console.error("Error fetching boats:", err));

    axios
      .get("http://localhost:8080/api/trips")
      .then((res) => setTrips(res.data || []))
      .catch((err) => console.error("Error fetching trips:", err));
  }, []);

  // Fetch bookings for the logged-in user
  const fetchUserBookings = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try dedicated user endpoint, fallback to query param
      const url = `http://localhost:8080/api/bookings/user/${encodeURIComponent(user.email)}`;
      const res = await axios.get(url);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("User endpoint failed, trying query param filter:", err);
      try {
        const fallbackRes = await axios.get(
          `http://localhost:8080/api/bookings?email=${encodeURIComponent(user.email)}`
        );
        setBookings(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch (fallbackErr) {
        console.error("Failed to fetch user bookings:", fallbackErr);
        setError("Unable to load your safari bookings. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user?.email]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // --- Delete Booking Handler ---
  const handleDeleteBooking = async (id, tripName, safariDate) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to cancel your reservation for "${tripName || "Safari"}" on ${safariDate}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8080/api/bookings/${id}`);
      setActionSuccessMsg(`✅ Booking #${id} was successfully canceled.`);
      setTimeout(() => setActionSuccessMsg(""), 5000);
      fetchUserBookings();
    } catch (err) {
      console.error("Failed to delete booking:", err);
      alert("❌ Could not cancel booking. Please try again or contact support.");
    }
  };

  // --- Edit Booking Handlers ---
  const handleOpenEdit = (b) => {
    setEditingBooking(b);
    setEditFormData({
      safariDate: b.safariDate || todayStr,
      adults: b.adults || 1,
      children: b.children || 0,
      boatId: b.boat?.id ? String(b.boat.id) : "",
    });
    setEditError("");
  };

  const handleCloseEdit = () => {
    setEditingBooking(null);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    // Boat is restricted to the booking's assigned boat
    const assignedBoat = editingBooking.boat;
    const boatCapacity = assignedBoat?.capacity || 10;
    const totalPassengers = Number(editFormData.adults) + Number(editFormData.children);

    if (!editFormData.safariDate) {
      setEditError("Safari date is required.");
      return;
    }
    if (Number(editFormData.adults) < 1) {
      setEditError("At least 1 adult passenger is required.");
      return;
    }
    if (totalPassengers > boatCapacity) {
      setEditError(`Total passengers (${totalPassengers}) exceed assigned boat capacity (${boatCapacity} seats).`);
      return;
    }

    setSavingEdit(true);
    setEditError("");

    // Calculate updated price keeping the assigned boat price
    const matchedTrip = editingBooking.trip;
    const adultRate = matchedTrip?.adultPrice || 0;
    const childRate = matchedTrip?.childPrice || 0;
    const boatRate = assignedBoat?.price || 0;
    const recalculatedTotal =
      Number(editFormData.adults) * adultRate +
      Number(editFormData.children) * childRate +
      boatRate;

    const payload = {
      ...editingBooking,
      safariDate: editFormData.safariDate,
      adults: Number(editFormData.adults),
      children: Number(editFormData.children),
      passengers: totalPassengers,
      totalPrice: recalculatedTotal > 0 ? recalculatedTotal : editingBooking.totalPrice,
      boat: assignedBoat ? { id: assignedBoat.id } : null,
      trip: matchedTrip ? { id: matchedTrip.id } : null,
    };

    try {
      await axios.put(`http://localhost:8080/api/bookings/${editingBooking.id}`, payload);
      setActionSuccessMsg(`✅ Reservation #${editingBooking.id} has been updated successfully!`);
      setTimeout(() => setActionSuccessMsg(""), 5000);
      handleCloseEdit();
      fetchUserBookings();
    } catch (err) {
      console.error("Failed to update booking:", err);
      const msg = err.response?.data?.message || "Booking update conflicts with operational schedule.";
      setEditError("⚠️ Update Conflict: " + msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // Check if a booking is cancelled
  const checkIsCancelled = (b) => {
    return (
      b.bookingStatus === "CANCELLED" ||
      b.status === "CANCELLED" ||
      Boolean(b.cancelReason && b.cancelReason.trim())
    );
  };

  // Classify a booking as 'upcoming', 'today', or 'past'
  const getBookingTiming = (bookingDate) => {
    if (!bookingDate) return "upcoming";
    if (bookingDate === todayStr) return "today";
    return bookingDate > todayStr ? "upcoming" : "past";
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let upcomingCount = 0;
    let pastCount = 0;
    let cancelledCount = 0;
    let totalInvested = 0;

    bookings.forEach((b) => {
      const isCancelled = checkIsCancelled(b);
      const timing = getBookingTiming(b.safariDate);

      if (isCancelled) {
        cancelledCount++;
      } else if (timing === "upcoming" || timing === "today") {
        upcomingCount++;
      } else {
        pastCount++;
      }

      if (!isCancelled) {
        totalInvested += Number(b.totalPrice) || 0;
      }
    });

    return {
      total: bookings.length,
      upcoming: upcomingCount,
      past: pastCount,
      cancelled: cancelledCount,
      totalInvested,
    };
  }, [bookings, todayStr]);

  // Filter & Sort bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const timing = getBookingTiming(b.safariDate);
        const isCancelled = checkIsCancelled(b);

        // Tab filter
        if (activeTab === "upcoming") {
          // Show upcoming and today bookings (including cancelled ones so user sees notice immediately)
          if (timing !== "upcoming" && timing !== "today") return false;
        } else if (activeTab === "cancelled") {
          if (!isCancelled) return false;
        } else if (activeTab === "past") {
          if (timing !== "past" || isCancelled) return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const name = (b.name || "").toLowerCase();
          const email = (b.email || "").toLowerCase();
          const tripName = (b.trip?.name || "").toLowerCase();
          const boatName = (b.boat?.name || "").toLowerCase();
          const date = (b.safariDate || "").toLowerCase();
          const timeSlot = (b.timeSlot || "").toLowerCase();
          const id = String(b.id || "");
          const txn = (b.transactionReference || "").toLowerCase();
          const reason = (b.cancelReason || "").toLowerCase();
          const status = (b.bookingStatus || b.status || "").toLowerCase();
          const payment = (b.paymentMethod || "").toLowerCase();

          return (
            name.includes(q) ||
            email.includes(q) ||
            tripName.includes(q) ||
            boatName.includes(q) ||
            date.includes(q) ||
            timeSlot.includes(q) ||
            id.includes(q) ||
            `#${id}`.includes(q) ||
            txn.includes(q) ||
            reason.includes(q) ||
            status.includes(q) ||
            payment.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.safariDate || "";
        const dateB = b.safariDate || "";
        if (sortBy === "date-desc") return dateB.localeCompare(dateA);
        if (sortBy === "date-asc") return dateA.localeCompare(dateB);
        if (sortBy === "price-desc") return (b.totalPrice || 0) - (a.totalPrice || 0);
        if (sortBy === "price-asc") return (a.totalPrice || 0) - (b.totalPrice || 0);
        return 0;
      });
  }, [bookings, activeTab, searchTerm, sortBy, todayStr]);

  const totalSearchMatches = useMemo(() => {
    if (!searchTerm.trim()) return bookings.length;
    const q = searchTerm.toLowerCase().trim();
    return bookings.filter((b) => {
      const name = (b.name || "").toLowerCase();
      const email = (b.email || "").toLowerCase();
      const tripName = (b.trip?.name || "").toLowerCase();
      const boatName = (b.boat?.name || "").toLowerCase();
      const date = (b.safariDate || "").toLowerCase();
      const timeSlot = (b.timeSlot || "").toLowerCase();
      const id = String(b.id || "");
      const txn = (b.transactionReference || "").toLowerCase();
      const reason = (b.cancelReason || "").toLowerCase();
      const status = (b.bookingStatus || b.status || "").toLowerCase();
      const payment = (b.paymentMethod || "").toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        tripName.includes(q) ||
        boatName.includes(q) ||
        date.includes(q) ||
        timeSlot.includes(q) ||
        id.includes(q) ||
        `#${id}`.includes(q) ||
        txn.includes(q) ||
        reason.includes(q) ||
        status.includes(q) ||
        payment.includes(q)
      );
    }).length;
  }, [bookings, searchTerm]);

  // Dynamic match counts per tab when search query is typed
  const tabCounts = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        upcoming: metrics.upcoming,
        cancelled: metrics.cancelled,
        past: metrics.past,
        all: metrics.total,
      };
    }
    const q = searchTerm.toLowerCase().trim();
    let upcoming = 0;
    let cancelled = 0;
    let past = 0;
    let all = 0;

    bookings.forEach((b) => {
      const isCancelled = checkIsCancelled(b);
      const timing = getBookingTiming(b.safariDate);

      const name = (b.name || "").toLowerCase();
      const email = (b.email || "").toLowerCase();
      const tripName = (b.trip?.name || "").toLowerCase();
      const boatName = (b.boat?.name || "").toLowerCase();
      const date = (b.safariDate || "").toLowerCase();
      const timeSlot = (b.timeSlot || "").toLowerCase();
      const id = String(b.id || "");
      const txn = (b.transactionReference || "").toLowerCase();
      const reason = (b.cancelReason || "").toLowerCase();
      const status = (b.bookingStatus || b.status || "").toLowerCase();
      const payment = (b.paymentMethod || "").toLowerCase();

      const matches =
        name.includes(q) ||
        email.includes(q) ||
        tripName.includes(q) ||
        boatName.includes(q) ||
        date.includes(q) ||
        timeSlot.includes(q) ||
        id.includes(q) ||
        `#${id}`.includes(q) ||
        txn.includes(q) ||
        reason.includes(q) ||
        status.includes(q) ||
        payment.includes(q);

      if (matches) {
        all++;
        if (isCancelled) {
          cancelled++;
        } else if (timing === "upcoming" || timing === "today") {
          upcoming++;
        } else {
          past++;
        }
      }
    });

    return { upcoming, cancelled, past, all };
  }, [bookings, searchTerm, metrics, todayStr]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    // Submitting a search switches to 'all' so user sees all matching reservations
    if (activeTab !== "all") {
      setActiveTab("all");
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Date Pending";
    try {
      const [y, m, d] = dateString.split("-");
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        {/* Header Banner */}
        <div className="bookings-header-banner">
          <div className="header-info">
            <div className="header-pill">
              <span className="pill-dot"></span>
              <span>Safari Expedition Portal</span>
            </div>
            <h1>My Safari Bookings</h1>
            <p className="header-subtitle">
              Manage your upcoming river safaris, download official boarding passes, and review past journeys.
            </p>
          </div>

          <div className="header-user-tag">
            <span className="explorer-icon">⚓</span>
            <div className="explorer-details">
              <span className="explorer-title">Active Explorer</span>
              <span className="explorer-name">{user?.name || user?.email}</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="bookings-metrics-grid">
          <div
            className={`metric-card ${activeTab === "all" ? "metric-selected" : ""}`}
            onClick={() => setActiveTab("all")}
            role="button"
            tabIndex={0}
          >
            <div className="metric-icon-wrap icon-all">🎟️</div>
            <div className="metric-details">
              <span className="metric-value">{metrics.total}</span>
              <span className="metric-label">Total Reservations</span>
            </div>
          </div>

          <div
            className={`metric-card ${activeTab === "upcoming" ? "metric-selected" : ""}`}
            onClick={() => setActiveTab("upcoming")}
            role="button"
            tabIndex={0}
          >
            <div className="metric-icon-wrap icon-upcoming">⏳</div>
            <div className="metric-details">
              <span className="metric-value">{metrics.upcoming}</span>
              <span className="metric-label">Upcoming Safaris</span>
            </div>
          </div>

          {metrics.cancelled > 0 ? (
            <div
              className={`metric-card ${activeTab === "cancelled" ? "metric-selected" : ""}`}
              onClick={() => setActiveTab("cancelled")}
              role="button"
              tabIndex={0}
              style={{ borderColor: activeTab === "cancelled" ? "#f43f5e" : "rgba(244, 63, 94, 0.3)" }}
            >
              <div className="metric-icon-wrap" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e" }}>🚫</div>
              <div className="metric-details">
                <span className="metric-value" style={{ color: "#f43f5e" }}>{metrics.cancelled}</span>
                <span className="metric-label">Cancelled Safaris</span>
              </div>
            </div>
          ) : (
            <div
              className={`metric-card ${activeTab === "past" ? "metric-selected" : ""}`}
              onClick={() => setActiveTab("past")}
              role="button"
              tabIndex={0}
            >
              <div className="metric-icon-wrap icon-past">🚩</div>
              <div className="metric-details">
                <span className="metric-value">{metrics.past}</span>
                <span className="metric-label">Past Adventures</span>
              </div>
            </div>
          )}

          <div className="metric-card metric-static">
            <div className="metric-icon-wrap icon-money">💳</div>
            <div className="metric-details">
              <span className="metric-value">
                Rs. {metrics.totalInvested.toLocaleString()}
              </span>
              <span className="metric-label">Total Amount</span>
            </div>
          </div>
        </div>

        {/* Control Bar: Tabs, Search & Sort */}
        <div className="bookings-controls-bar">
          <div className="bookings-tabs-group">
            <button
              className={`booking-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              <span>Upcoming Safaris</span>
              <span className="tab-badge">{tabCounts.upcoming}</span>
            </button>

            {metrics.cancelled > 0 && (
              <button
                className={`booking-tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
                style={activeTab === "cancelled" ? { background: "#f43f5e", color: "#fff" } : { color: "#f43f5e" }}
              >
                <span>Cancelled</span>
                <span className="tab-badge" style={{ background: "rgba(244, 63, 94, 0.2)", color: activeTab === "cancelled" ? "#fff" : "#f43f5e" }}>
                  {tabCounts.cancelled}
                </span>
              </button>
            )}

            <button
              className={`booking-tab-btn ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              <span>Past Safaris</span>
              <span className="tab-badge">{tabCounts.past}</span>
            </button>

            <button
              className={`booking-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span>All Bookings</span>
              <span className="tab-badge">{tabCounts.all}</span>
            </button>
          </div>

          <div className="bookings-filters-group">
            <form className="search-form-wrap" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrapper">
                <button
                  type="submit"
                  className="search-icon-btn"
                  title="Click to search bookings"
                  aria-label="Search"
                >
                  🔍
                </button>
                <input
                  type="text"
                  placeholder="Search trip, name, boat, date, #id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bookings-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button type="submit" className="btn-search-action" title="Submit Search">
                Search
              </button>
            </form>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bookings-sort-select"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="price-asc">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bookings-loading-state">
            <div className="spinner"></div>
            <p>Loading your safari reservations...</p>
          </div>
        ) : error ? (
          <div className="bookings-error-state">
            <span className="error-icon">⚠️</span>
            <h3>Error Loading Bookings</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchUserBookings}>
              🔄 Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bookings-empty-state">
            <div className="empty-icon-wrap">🚤</div>
            <h3>
              {searchTerm
                ? `No Bookings Found Matching "${searchTerm}"`
                : activeTab === "upcoming"
                ? "No Upcoming Safaris Scheduled"
                : activeTab === "past"
                ? "No Past Expeditions Found"
                : activeTab === "cancelled"
                ? "No Cancelled Safaris"
                : "No Bookings Found"}
            </h3>
            <p>
              {searchTerm ? (
                totalSearchMatches > 0 && activeTab !== "all"
                  ? `Found ${totalSearchMatches} reservation(s) matching "${searchTerm}" in other tabs.`
                  : `No reservations match "${searchTerm}". Try searching by passenger name, boat name, date (YYYY-MM-DD), or booking #ID.`
              ) : activeTab === "upcoming" ? (
                "You don't have any upcoming boat safari trips planned right now. Discover our scenic Madu River tours and reserve your adventure!"
              ) : activeTab === "cancelled" ? (
                "You do not have any cancelled reservations."
              ) : (
                "Explore our mangrove tours, sunset cruises, and luxury boat packages to begin your journey."
              )}
            </p>

            {searchTerm && totalSearchMatches > 0 && activeTab !== "all" ? (
              <button
                type="button"
                className="btn-book-safari-cta"
                onClick={() => setActiveTab("all")}
                style={{ cursor: "pointer", border: "none" }}
              >
                <span>View Matching Bookings in All Bookings ({totalSearchMatches})</span>
                <span className="btn-arrow">→</span>
              </button>
            ) : searchTerm ? (
              <button
                type="button"
                className="btn-book-safari-cta"
                onClick={() => setSearchTerm("")}
                style={{ cursor: "pointer", border: "none" }}
              >
                <span>Clear Search Filter</span>
              </button>
            ) : (
              <Link to="/booktrip" className="btn-book-safari-cta">
                <span>Explore Trips & Book Safari</span>
                <span className="btn-arrow">→</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bookings-cards-list">
            {searchTerm.trim() && (
              <div className="search-active-pill-bar">
                <span>
                  🔍 Found <strong>{filteredBookings.length}</strong> matching safari reservation{filteredBookings.length === 1 ? "" : "s"} for "<strong>{searchTerm}</strong>"
                </span>
                <button
                  type="button"
                  className="btn-clear-active-search"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search ✕
                </button>
              </div>
            )}
            {filteredBookings.map((b) => {
              const timing = getBookingTiming(b.safariDate);
              const isCancelled = checkIsCancelled(b);
              const totalGuests =
                b.passengers > 0 ? b.passengers : (b.adults || 0) + (b.children || 0);

              return (
                <div
                  key={b.id}
                  className={`booking-card ${
                    isCancelled
                      ? "card-cancelled"
                      : timing === "today"
                      ? "card-today"
                      : timing === "upcoming"
                      ? "card-upcoming"
                      : "card-past"
                  }`}
                >
                  {/* Card Header */}
                  <div className="card-top-row">
                    <div className="card-date-badge">
                      <span className="date-icon">📅</span>
                      <span className="date-text">
                        {formatDateDisplay(b.safariDate)}
                      </span>
                    </div>

                    <div className="card-status-tags">
                      {isCancelled ? (
                        <span className="status-badge status-cancelled">
                          🚫 Cancelled
                        </span>
                      ) : (
                        <>
                          {timing === "today" && (
                            <span className="status-badge status-today">
                              🔥 Safari Today
                            </span>
                          )}
                          {timing === "upcoming" && (
                            <span className="status-badge status-upcoming">
                              🟢 Upcoming
                            </span>
                          )}
                          {timing === "past" && (
                            <span className="status-badge status-completed">
                              ✔️ Completed
                            </span>
                          )}
                        </>
                      )}

                      <span className="booking-ref-badge">
                        #{b.id}
                      </span>
                    </div>
                  </div>

                  {/* Operational Cancellation Banner */}
                  {isCancelled && (
                    <div className="booking-cancellation-card-banner">
                      <div className="cancellation-banner-header">
                        <div className="cancellation-pill-tag">
                          <span className="cancellation-dot-pulse"></span>
                          <span>EXPEDITION CANCELLED</span>
                        </div>
                        <span className="cancellation-source-tag">Operations Bulletin</span>
                      </div>

                      <div className="cancellation-banner-content">
                        <span className="cancellation-banner-icon">⚠️</span>
                        <div className="cancellation-text-block">
                          <div className="cancellation-heading">
                            Reason for Cancellation:
                          </div>
                          <div className="cancellation-reason-quote">
                            "{b.cancelReason || "Adverse weather or river navigation restrictions"}"
                          </div>
                          <div className="cancellation-subtext">
                            ℹ️ Your reservation is cancelled. Any collected payments are marked for refund, or you can contact Jetty Desk Operations to reschedule for an alternative date.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Main Body */}
                  <div className="card-main-grid">
                    {/* Left: Trip & Boat Details */}
                    <div className="card-trip-info">
                      <div className="trip-title-line">
                        <h3 className="trip-name">
                          {b.trip?.name || "Madu River Boat Safari"}
                        </h3>
                        {b.trip?.type && (
                          <span
                            className={`trip-type-tag ${
                              b.trip.type.toLowerCase() === "private"
                                ? "tag-private"
                                : "tag-shared"
                            }`}
                          >
                            {b.trip.type} Safari
                          </span>
                        )}
                      </div>

                      {b.trip?.description && (
                        <p className="trip-desc-snippet">
                          {b.trip.description}
                        </p>
                      )}

                      <div className="trip-quick-specs">
                        <div className="spec-item">
                          <span className="spec-label">🕒 Departure:</span>
                          <span className="spec-val">
                            {b.timeSlot || (b.trip?.startingTime && b.trip.startingTime !== "Managed in Schedule"
                              ? b.trip.startingTime
                              : "Scheduled Slot")}
                          </span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">⏱️ Duration:</span>
                          <span className="spec-val">
                            2 Hours
                          </span>
                        </div>

                        <div className="spec-item boat-spec">
                          <span className="spec-label">🚤 Boat:</span>
                          <span className="spec-val">
                            {b.boat?.name || "Assigned by Deck Captain"}{" "}
                            {b.boat?.boatType && (
                              <span className="boat-type-hint">
                                ({b.boat.boatType})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Passenger & Financial Info */}
                    <div className="card-party-finance">
                      <div className="party-summary-box">
                        <div className="party-icon">👥</div>
                        <div className="party-text">
                          <span className="party-head">
                            {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
                          </span>
                          <span className="party-sub">
                            {b.adults || 1} {(b.adults || 1) === 1 ? "Adult" : "Adults"}
                            {b.children > 0 && `, ${b.children} Child${b.children > 1 ? "ren" : ""}`}
                          </span>
                        </div>
                      </div>

                      <div className="finance-summary-box">
                        <div className="payment-meta">
                          <span className="payment-method-badge">
                            {b.paymentMethod === "cash"
                              ? "💵 Cash on Arrival"
                              : b.paymentMethod === "paypal"
                              ? "🅿️ PayPal"
                              : "💳 Card Payment"}
                          </span>
                          <span className="payment-status-badge">
                            {isCancelled
                              ? "Cancelled / Refundable"
                              : b.paymentStatus === "PAID_CONFIRMED" || !b.paymentStatus
                              ? "Confirmed"
                              : b.paymentStatus}
                          </span>
                        </div>

                        <div className="price-tag-wrap">
                          <span className="price-currency">LKR</span>
                          <span className="price-amount">
                            {Number(b.totalPrice || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="card-bottom-actions">
                    <div className="card-note">
                      {isCancelled ? (
                        <span style={{ color: "#fb7185" }}>
                          ⚠️ Expedition cancelled. For urgent assistance or rescheduling: <strong>Aloka Safari Jetty (+94 77 123 4567)</strong>.
                        </span>
                      ) : timing === "upcoming" || timing === "today" ? (
                        <span>
                          📍 Boarding point: <strong>Aloka Safari Jetty, Balapitiya</strong>. Please arrive 15 min early.
                        </span>
                      ) : (
                        <span>
                          Hope you enjoyed your journey through the mangroves!
                        </span>
                      )}
                    </div>

                    <div className="card-buttons-row">
                      <button
                        className="btn-card-invoice"
                        onClick={() => navigate(`/invoice/${b.id}`)}
                      >
                        📄 Ticket / Invoice
                      </button>

                      {isCancelled ? (
                        <button
                          className="btn-card-rebook"
                          onClick={() => navigate("/booktrip")}
                          style={{
                            background: "linear-gradient(135deg, var(--amber-primary), var(--amber-hover))",
                            color: "var(--text-dark)",
                            fontWeight: 700,
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          🔄 Rebook Safari
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn-card-edit"
                            onClick={() => handleOpenEdit(b)}
                            title="Modify reservation date or passengers"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            className="btn-card-delete"
                            onClick={() => handleDeleteBooking(b.id, b.trip?.name, b.safariDate)}
                            title="Cancel this reservation"
                          >
                            🗑️ Cancel
                          </button>
                        </>
                      )}

                      {timing === "past" && !isCancelled && (
                        <button
                          className="btn-card-feedback"
                          onClick={() => navigate("/feedback")}
                        >
                          ⭐ Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="booking-toast-alert">
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="edit-modal-backdrop" onClick={handleCloseEdit}>
          <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <div className="edit-modal-title-wrap">
                <span className="edit-modal-icon">✏️</span>
                <h3>Modify Reservation #{editingBooking.id}</h3>
              </div>
              <button className="btn-modal-close" onClick={handleCloseEdit}>✕</button>
            </div>

            <div className="edit-modal-body">
              <div className="edit-trip-summary">
                <span className="summary-label">Trip Package:</span>
                <span className="summary-val">{editingBooking.trip?.name || "Madu River Safari"}</span>
              </div>

              {editError && <div className="edit-error-alert">{editError}</div>}

              <div className="edit-form-grid">
                <div className="edit-form-group">
                  <label htmlFor="editSafariDate">📅 Safari Date</label>
                  <input
                    type="date"
                    id="editSafariDate"
                    min={todayStr}
                    value={editFormData.safariDate}
                    onChange={(e) => setEditFormData({ ...editFormData, safariDate: e.target.value })}
                    required
                  />
                </div>

                <div className="edit-form-group">
                  <div className="label-with-badge">
                    <label htmlFor="editBoat">🚤 Assigned Boat</label>
                    <span className="badge-locked" title="Boat is allocated by operational schedule and cannot be changed by users">
                      🔒 Fixed Assignment
                    </span>
                  </div>
                  <input
                    type="text"
                    id="editBoat"
                    value={
                      editingBooking.boat
                        ? `${editingBooking.boat.name} (${editingBooking.boat.boatType || "Vessel"}) — Max ${editingBooking.boat.capacity || 10} seats`
                        : "Assigned Safari Vessel"
                    }
                    disabled
                    readOnly
                    className="input-locked"
                    title="Assigned boat cannot be altered. Contact operations desk for vessel reallocations."
                  />
                  <small className="field-hint-locked">
                    🔒 Boat is fixed to this scheduled trip and cannot be modified.
                  </small>
                </div>

                <div className="edit-form-group">
                  <label htmlFor="editAdults">👥 Adults (Min 1)</label>
                  <input
                    type="number"
                    id="editAdults"
                    min="1"
                    max="30"
                    value={editFormData.adults}
                    onChange={(e) => setEditFormData({ ...editFormData, adults: e.target.value })}
                    required
                  />
                </div>

                <div className="edit-form-group">
                  <label htmlFor="editChildren">👶 Children (Age 0-12)</label>
                  <input
                    type="number"
                    id="editChildren"
                    min="0"
                    max="20"
                    value={editFormData.children}
                    onChange={(e) => setEditFormData({ ...editFormData, children: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="edit-preview-box">
                <div className="preview-stat">
                  <span className="p-label">Total Guests:</span>
                  <span className="p-val">{Number(editFormData.adults) + Number(editFormData.children)} Guests</span>
                </div>
                {editingBooking.boat && (
                  <div className="preview-stat">
                    <span className="p-label">Boat Capacity:</span>
                    <span className="p-val">
                      {editingBooking.boat.capacity} Max
                    </span>
                  </div>
                )}
                <div className="preview-stat price-stat">
                  <span className="p-label">Estimated Total:</span>
                  <span className="p-val price-highlight">
                    LKR {(
                      Number(editFormData.adults) * (editingBooking.trip?.adultPrice || 0) +
                      Number(editFormData.children) * (editingBooking.trip?.childPrice || 0) +
                      (editingBooking.boat?.price || 0)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="edit-modal-footer">
              <button className="btn-cancel-edit" onClick={handleCloseEdit} disabled={savingEdit}>
                Cancel
              </button>
              <button className="btn-save-edit" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;

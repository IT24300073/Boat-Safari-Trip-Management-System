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
    let totalInvested = 0;

    bookings.forEach((b) => {
      const timing = getBookingTiming(b.safariDate);
      if (timing === "upcoming" || timing === "today") {
        upcomingCount++;
      } else {
        pastCount++;
      }
      totalInvested += Number(b.totalPrice) || 0;
    });

    return {
      total: bookings.length,
      upcoming: upcomingCount,
      past: pastCount,
      totalInvested,
    };
  }, [bookings, todayStr]);

  // Filter & Sort bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const timing = getBookingTiming(b.safariDate);

        // Tab filter
        if (activeTab === "upcoming") {
          if (timing !== "upcoming" && timing !== "today") return false;
        } else if (activeTab === "past") {
          if (timing !== "past") return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const tripName = (b.trip?.name || "").toLowerCase();
          const boatName = (b.boat?.name || "").toLowerCase();
          const date = (b.safariDate || "").toLowerCase();
          const id = String(b.id || "");
          const txn = (b.transactionReference || "").toLowerCase();

          return (
            tripName.includes(q) ||
            boatName.includes(q) ||
            date.includes(q) ||
            id.includes(q) ||
            txn.includes(q)
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
              <span className="tab-badge">{metrics.upcoming}</span>
            </button>

            <button
              className={`booking-tab-btn ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              <span>Past Safaris</span>
              <span className="tab-badge">{metrics.past}</span>
            </button>

            <button
              className={`booking-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span>All Bookings</span>
              <span className="tab-badge">{metrics.total}</span>
            </button>
          </div>

          <div className="bookings-filters-group">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search trip, boat, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bookings-search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

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
              {activeTab === "upcoming"
                ? "No Upcoming Safaris Scheduled"
                : activeTab === "past"
                ? "No Past Expeditions Found"
                : "No Bookings Found"}
            </h3>
            <p>
              {searchTerm
                ? "No reservations match your current search criteria. Try a different keyword."
                : activeTab === "upcoming"
                ? "You don't have any upcoming boat safari trips planned right now. Discover our scenic Madu River tours and reserve your adventure!"
                : "Explore our mangrove tours, sunset cruises, and luxury boat packages to begin your journey."}
            </p>
            <Link to="/booktrip" className="btn-book-safari-cta">
              <span>Explore Trips & Book Safari</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="bookings-cards-list">
            {filteredBookings.map((b) => {
              const timing = getBookingTiming(b.safariDate);
              const totalGuests =
                b.passengers > 0 ? b.passengers : (b.adults || 0) + (b.children || 0);

              return (
                <div
                  key={b.id}
                  className={`booking-card ${
                    timing === "today"
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

                      <span className="booking-ref-badge">
                        #{b.id}
                      </span>
                    </div>
                  </div>

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
                        {b.trip?.startingTime && (
                          <div className="spec-item">
                            <span className="spec-label">🕒 Departure:</span>
                            <span className="spec-val">
                              {b.trip.startingTime}
                            </span>
                          </div>
                        )}

                        {b.trip?.duration && (
                          <div className="spec-item">
                            <span className="spec-label">⏱️ Duration:</span>
                            <span className="spec-val">
                              {b.trip.duration}
                            </span>
                          </div>
                        )}

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
                            {b.paymentStatus === "PAID_CONFIRMED" || !b.paymentStatus
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
                      {timing === "upcoming" || timing === "today" ? (
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
                      {timing === "past" && (
                        <button
                          className="btn-card-feedback"
                          onClick={() => navigate("/feedback")}
                        >
                          ⭐ Write Feedback
                        </button>
                      )}

                      <button
                        className="btn-card-invoice"
                        onClick={() => navigate(`/invoice/${b.id}`)}
                      >
                        📄 View Ticket & Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;

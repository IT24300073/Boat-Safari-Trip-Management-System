import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Booking from "./Booking";
import "../Styles/BookTrip.css";

function BookTrip() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  // Search State - Default to today's date so users immediately see available slots
  const [searchDate, setSearchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchTimeSlot, setSearchTimeSlot] = useState("ALL");
  const [scheduledSlots, setScheduledSlots] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookingPrefillDate, setBookingPrefillDate] = useState("");
  const [bookingPrefillBoatId, setBookingPrefillBoatId] = useState("");
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null);

  // Redirect if user not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Fetch all packages
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/trips")
      .then((res) => {
        setTrips(res.data || []);
        setLoadingTrips(false);
      })
      .catch((err) => {
        console.error("Error fetching trips:", err);
        setLoadingTrips(false);
      });
  }, []);

  // Auto-fetch today's schedules on initial load
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSearchDate(today);
    setIsSearching(true);

    axios
      .get(`http://localhost:8080/api/schedules/search?date=${today}`)
      .then((res) => {
        setScheduledSlots(res.data || []);
        setHasSearched(true);
        setIsSearching(false);
      })
      .catch((err) => {
        console.error("Error fetching initial schedules:", err);
        setIsSearching(false);
      });
  }, []);

  // Handle Search Execution
  const handleSearchSchedules = (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (searchDate) params.append("date", searchDate);
    if (searchTimeSlot && searchTimeSlot !== "ALL") params.append("timeSlot", searchTimeSlot);

    axios
      .get(`http://localhost:8080/api/schedules/search?${params.toString()}`)
      .then((res) => {
        setScheduledSlots(res.data || []);
        setIsSearching(false);
      })
      .catch((err) => {
        console.error("Error searching schedules:", err);
        setIsSearching(false);
      });
  };

  const handleResetSearch = () => {
    const today = new Date().toISOString().split("T")[0];
    setSearchDate(today);
    setSearchTimeSlot("ALL");
    handleSearchSchedules();
  };

  const handleSelectTrip = (trip) => {
    // Check if there are active schedule slots for this trip in currently loaded slots
    const matchingSlots = scheduledSlots.filter(
      (s) => s.tripName?.toLowerCase().trim() === trip.name.toLowerCase().trim()
    );

    if (matchingSlots.length === 1 && matchingSlots[0].seatStatus !== "FULL" && matchingSlots[0].seatStatus !== "MAINTENANCE") {
      handleSelectScheduleSlot(matchingSlots[0]);
      return;
    }

    if (matchingSlots.length > 1) {
      const resultsEl = document.querySelector(".search-results-section");
      if (resultsEl) resultsEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setBookingPrefillDate(searchDate || "");
    setBookingPrefillBoatId("");
    setSelectedScheduleSlot(null);
    setSelectedTrip(trip);
    setShowBooking(true);
  };

  const handleSelectScheduleSlot = (slot) => {
    // Find matching package or construct custom trip object from schedule
    const matchedTrip = trips.find(
      (t) => t.name.toLowerCase() === slot.tripName?.toLowerCase()
    ) || {
      id: 1,
      name: slot.tripName || "Scheduled Safari Trip",
      adultPrice: 3500,
      childPrice: 1800,
      startingTime: slot.timeSlot,
      duration: "2 Hours",
    };

    setBookingPrefillDate(slot.scheduleDate || searchDate || "");
    setBookingPrefillBoatId(slot.boatId ? String(slot.boatId) : "");
    setSelectedScheduleSlot(slot);
    setSelectedTrip(matchedTrip);
    setShowBooking(true);
  };

  return (
    <div className="book-trip-page">
      {/* Header Banner */}
      <div className="trip-banner-section">
        <div className="trip-banner-content">
          <span className="banner-subtitle">RESERVE YOUR WATER SAFARI</span>
          <h1>Search & Book Available Safari Slots</h1>
          <p>Filter active boat tours by date and time slot to find an adventure that perfectly fits your schedule.</p>
        </div>

        {/* Search Bar Widget */}
        <form className="schedule-search-bar-widget" onSubmit={handleSearchSchedules}>
          <div className="search-field-group">
            <label htmlFor="searchDate">📅 Select Date</label>
            <input
              type="date"
              id="searchDate"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="search-date-input"
            />
          </div>

          <div className="search-field-group">
            <label htmlFor="searchTimeSlot">⏰ Preferred Time Slot</label>
            <select
              id="searchTimeSlot"
              value={searchTimeSlot}
              onChange={(e) => setSearchTimeSlot(e.target.value)}
              className="search-select-input"
            >
              <option value="ALL">All Time Slots (Anytime)</option>
              <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Morning Safari)</option>
              <option value="10:30 AM - 12:30 PM">10:30 AM - 12:30 PM (Midday Cruise)</option>
              <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM (Afternoon Tour)</option>
              <option value="03:30 PM - 05:30 PM">03:30 PM - 05:30 PM (Sunset Expedition)</option>
            </select>
          </div>

          <div className="search-actions-group">
            <button type="submit" className="btn-execute-search" disabled={isSearching}>
              {isSearching ? "Searching..." : "🔍 Find Slots"}
            </button>
            {hasSearched && (
              <button type="button" className="btn-reset-search" onClick={handleResetSearch}>
                🔄 Clear Filter
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="trip-content-container">
        {/* Render Search Results if user searched */}
        {hasSearched ? (
          <div className="search-results-section">
            <div className="search-results-header">
              <h2>
                🎯 Available Slots Matching Criteria{" "}
                <span className="results-count">({scheduledSlots.length} Found)</span>
              </h2>
              {searchDate && (
                <span className="active-filter-tag">Date: {searchDate}</span>
              )}
              {searchTimeSlot !== "ALL" && (
                <span className="active-filter-tag">Slot: {searchTimeSlot}</span>
              )}
            </div>

            {isSearching ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching real-time schedule slots...</p>
              </div>
            ) : scheduledSlots.length === 0 ? (
              <div className="empty-trips-card">
                <div className="empty-icon">🗓️</div>
                <h3>No Specific Safari Departures Found</h3>
                <p>No departures match your selected time slot on {searchDate || "this date"}. Clear the time filter to browse all available daily safari packages.</p>
                <button
                  type="button"
                  className="btn-reset-search"
                  onClick={handleResetSearch}
                  style={{ marginTop: "14px", display: "inline-flex", marginInline: "auto" }}
                >
                  🔄 View All Daily Safari Packages
                </button>
              </div>
            ) : (
              <div className="trip-cards-grid">
                {scheduledSlots.map((slot) => (
                  <div key={slot.id} className="modern-trip-card slot-card">
                    <div className="trip-card-top">
                      <div className="slot-date-badge">📅 {slot.scheduleDate}</div>
                      <h2 className="trip-title">{slot.tripName}</h2>
                    </div>

                    <div className="trip-card-body">
                      <div className="slot-details-list">
                        <div className="info-pill">
                          <span className="pill-icon">⏰</span>
                          <span><strong>Time Slot:</strong> {slot.timeSlot}</span>
                        </div>
                        <div className="info-pill">
                          <span className="pill-icon">🚤</span>
                          <span><strong>Boat:</strong> {slot.boatName || "Standard Safari Boat"}</span>
                        </div>
                        <div className="info-pill">
                          <span className="pill-icon">⚓</span>
                          <span><strong>Captain / Guide:</strong> {slot.guideName || "Certified Guide"}</span>
                        </div>
                        
                        {/* Real-time Seat Availability Metric */}
                        <div className="info-pill seat-availability-pill">
                          <span className="pill-icon">🎟️</span>
                          <span><strong>Live Seat Availability:</strong></span>
                          {slot.seatStatus === "MAINTENANCE" ? (
                            <span className="seat-badge maintenance">🛠️ Maintenance</span>
                          ) : slot.seatStatus === "FULL" || slot.remainingSeats === 0 ? (
                            <span className="seat-badge full">🔴 SOLD OUT (0 Seats)</span>
                          ) : slot.seatStatus === "LIMITED" ? (
                            <span className="seat-badge limited">🟡 {slot.remainingSeats} / {slot.totalCapacity || 10} Seats Available ({slot.bookedSeats} Booked)</span>
                          ) : (
                            <span className="seat-badge available">🟢 {slot.remainingSeats} / {slot.totalCapacity || 10} Seats Available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="trip-card-footer">
                      <button
                        className={`btn-select-trip ${slot.seatStatus === "FULL" || slot.seatStatus === "MAINTENANCE" ? "disabled" : ""}`}
                        onClick={() => handleSelectScheduleSlot(slot)}
                        disabled={slot.seatStatus === "FULL" || slot.seatStatus === "MAINTENANCE"}
                      >
                        {slot.seatStatus === "FULL"
                          ? "🔴 Trip Full (Sold Out)"
                          : slot.seatStatus === "MAINTENANCE"
                          ? "🛠️ Unavailable (Maintenance)"
                          : "Reserve This Slot ➔"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Safari Packages List */
          <div className="all-packages-section">
            <div className="packages-header">
              <h2>🚤 All Safari Packages & Tour Options</h2>
              <p>Select any of our premier boat safari packages below to customize your reservation.</p>
            </div>

            {loadingTrips ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading available safari packages...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="empty-trips-card">
                <div className="empty-icon">⛵</div>
                <h3>No Safari Trips Listed</h3>
                <p>There are no active packages listed right now. Please check back soon.</p>
              </div>
            ) : (
              <div className="trip-cards-grid">
                {trips.map((trip) => (
                  <div key={trip.id} className="modern-trip-card">
                    <div className="trip-card-top">
                      <div className="trip-type-badge">{trip.type || "Shared"} Safari</div>
                      <h2 className="trip-title">{trip.name}</h2>
                    </div>

                    <div className="trip-card-body">
                      <p className="trip-description">{trip.description || "Experience scenic nature views with certified captains."}</p>

                      <div className="trip-info-pills">
                        <div className="info-pill">
                          <span className="pill-icon">⏰</span>
                          <span><strong>Time:</strong> {trip.startingTime && trip.startingTime !== "Managed in Schedule" ? trip.startingTime : "Scheduled Slots"}</span>
                        </div>
                        <div className="info-pill">
                          <span className="pill-icon">⏱️</span>
                          <span><strong>Duration:</strong> 2 Hours</span>
                        </div>
                      </div>

                      <div className="trip-price-box">
                        <div className="price-tag">
                          <span className="price-label">Adult Price</span>
                          <span className="price-value">LKR {trip.adultPrice}</span>
                        </div>
                        {trip.childPrice && (
                          <div className="price-tag child">
                            <span className="price-label">Child Price</span>
                            <span className="price-value">LKR {trip.childPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="trip-card-footer">
                      <button
                        className="btn-select-trip"
                        onClick={() => handleSelectTrip(trip)}
                      >
                        Check Schedule & Reserve ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showBooking && selectedTrip && (
        <Booking
          trip={selectedTrip}
          initialDate={bookingPrefillDate}
          initialBoatId={bookingPrefillBoatId}
          scheduledSlot={selectedScheduleSlot}
          setShowBooking={setShowBooking}
        />
      )}
    </div>
  );
}

export default BookTrip;

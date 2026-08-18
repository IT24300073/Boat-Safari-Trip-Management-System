import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Booking from "./Booking";
import "../Styles/BookTrip.css";

function BookTrip() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  // Redirect if user not logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:8080/api/trips")
      .then((res) => res.json())
      .then((data) => {
        setTrips(data);
        setLoadingTrips(false);
      })
      .catch((err) => {
        console.error("Error fetching trips:", err);
        setLoadingTrips(false);
      });
  }, []);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setShowBooking(true);
  };

  return (
    <div className="book-trip-page">
      {/* Header Banner */}
      <div className="trip-banner-section">
        <div className="trip-banner-content">
          <span className="banner-subtitle">SELECT YOUR ADVENTURE</span>
          <h1>Available Safari Packages</h1>
          <p>Choose your preferred boat tour schedule, price tier, and duration for an amazing water safari.</p>
        </div>
      </div>

      <div className="trip-content-container">
        {loadingTrips ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading available safari packages...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-trips-card">
            <div className="empty-icon">⛵</div>
            <h3>No Safari Trips Scheduled</h3>
            <p>There are no active trips listed right now. Please check back soon or contact support.</p>
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
                      <span><strong>Time:</strong> {trip.startingTime || "Flexible"}</span>
                    </div>
                    <div className="info-pill">
                      <span className="pill-icon">⏱️</span>
                      <span><strong>Duration:</strong> {trip.duration || "2 Hours"}</span>
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
                    Select & Reserve Seat ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBooking && selectedTrip && (
        <Booking trip={selectedTrip} setShowBooking={setShowBooking} />
      )}
    </div>
  );
}

export default BookTrip;


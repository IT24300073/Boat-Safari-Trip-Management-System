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

  // 🔹 Redirect if user not logged in
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
    <div className="book-trip-container">
      <h1 className="title">Available Trips</h1>

      {loadingTrips ? (
        <p className="loading">Loading trips...</p>
      ) : trips.length === 0 ? (
        <p className="no-trips">No trips available.</p>
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div className="trip-header">
                <h2>{trip.name}</h2>
                <span className="trip-type">{trip.type}</span>
              </div>
              <div className="trip-details">
                <p>
                  <strong>Adult Price:</strong> LKR {trip.adultPrice}
                </p>
                {trip.childPrice && (
                  <p>
                    <strong>Child Price:</strong> LKR {trip.childPrice}
                  </p>
                )}
                <p>
                  <strong>Starting Time:</strong> {trip.startingTime}
                </p>
                <p>
                  <strong>Duration:</strong> {trip.duration}
                </p>
                <p className="description">{trip.description}</p>
              </div>
              <button
                className="book-btn"
                onClick={() => handleSelectTrip(trip)}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}

      {showBooking && selectedTrip && (
        <div className="modal-overlay">
          <Booking trip={selectedTrip} setShowBooking={setShowBooking} />
        </div>
      )}
    </div>
  );
}

export default BookTrip;

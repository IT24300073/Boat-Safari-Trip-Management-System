import "../Styles/Booking.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Booking({ setShowBooking, trip }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    adults: 1,
    children: 0,
    boatId: "",
    tripId: trip?.id ? String(trip.id) : "",
    paymentMethod: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [loading, setLoading] = useState(false);
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/boats")
      .then((res) => res.json())
      .then((data) => setBoats(data))
      .catch((err) => console.error("Error fetching boats:", err));

    fetch("http://localhost:8080/api/trips")
      .then((res) => res.json())
      .then((data) => setTrips(data))
      .catch((err) => console.error("Error fetching trips:", err));
  }, []);

  const selectedBoat = boats.find((b) => b.id === Number(formData.boatId));
  const boatCapacity = selectedBoat ? selectedBoat.capacity : 0;

  const totalPrice =
    formData.adults * (trip?.adultPrice || 0) +
    formData.children * (trip?.childPrice || 0) +
    (selectedBoat?.price || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue =
      name === "adults" || name === "children" ? Number(value) : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (selectedBoat && (name === "adults" || name === "children")) {
      const total =
        name === "adults"
          ? newValue + formData.children
          : formData.adults + newValue;

      if (total > boatCapacity) {
        setErrorMessage(
          `Total passengers (${total}) exceed boat capacity (${boatCapacity})`
        );
      } else {
        setErrorMessage("");
      }
    }
  };

  const validateForm = () => {
    const today = new Date().toISOString().split("T")[0];

    if (!/^[A-Za-z\s]{3,50}$/.test(formData.name)) {
      return "Name must be 3–50 letters only.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (!formData.date || formData.date < today) {
      return "Safari date must be today or a future date.";
    }

    if (!selectedBoat) {
      return "Please select a boat for your trip.";
    }

    if (formData.adults < 1) return "At least 1 adult passenger is required.";
    if (formData.children < 0) return "Number of children cannot be negative.";

    if (formData.adults + formData.children > boatCapacity) {
      return `Total passengers (${
        formData.adults + formData.children
      }) cannot exceed boat capacity (${boatCapacity}).`;
    }

    if (
      !formData.tripId ||
      !trips.some((t) => t.id === Number(formData.tripId))
    ) {
      return "Please select a valid safari trip option.";
    }

    if (formData.paymentMethod === "card") {
      if (!/^\d{16}$/.test(formData.cardNumber)) {
        return "Card number must be exactly 16 digits.";
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
        return "Expiry must be in MM/YY format.";
      }

      if (!/^\d{3,4}$/.test(formData.cvv)) {
        return "CVV must be 3 or 4 digits.";
      }
    }

    if (totalPrice <= 0 || isNaN(totalPrice)) {
      return "Invalid total price calculation.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert("❌ " + error);
      return;
    }

    setLoading(true);

    const selectedTrip =
      trips.find((t) => t.id === Number(formData.tripId)) || trip;

    const bookingData = {
      name: formData.name,
      email: formData.email,
      safariDate: formData.date,
      adults: formData.adults,
      children: formData.children,
      totalPrice,
      paymentMethod: formData.paymentMethod,
      boat: selectedBoat ? { id: selectedBoat.id } : null,
      trip: selectedTrip ? { id: selectedTrip.id } : null,
    };

    try {
      const response = await fetch("http://localhost:8080/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const savedBooking = await response.json();
        alert(
          `✅ Booking successful! Invoice #${savedBooking.id} generated.`
        );
        setShowBooking(false);
        navigate(`/invoice/${savedBooking.id}`);
      } else {
        const errMsg = await response.text();
        alert("❌ Booking Error: " + errMsg);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("⚠️ Server connection error!");
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="modal-overlay">
      <div className="booking-modal-card">
        <button className="modal-close-btn" onClick={() => setShowBooking(false)}>
          ✕
        </button>

        <div className="booking-modal-header">
          <span className="modal-badge">RESERVATION</span>
          <h2>Book Trip: {trip.name}</h2>
        </div>

        <form className="booking-form-grid" onSubmit={handleSubmit}>
          {/* Section 1: Customer Details */}
          <div className="form-section">
            <h3>1. Passenger Details</h3>
            <div className="form-row dual">
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="form-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row dual">
              <div className="form-field">
                <label>Safari Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label>Select Boat</label>
                <select
                  name="boatId"
                  value={formData.boatId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose Boat --</option>
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.boatType}) - Cap: {b.capacity} (LKR {b.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row dual">
              <div className="form-field">
                <label>Adult Passengers</label>
                <input
                  type="number"
                  name="adults"
                  min="1"
                  value={formData.adults}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label>Child Passengers</label>
                <input
                  type="number"
                  name="children"
                  min="0"
                  value={formData.children}
                  onChange={handleChange}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="form-error-banner">⚠️ {errorMessage}</div>
            )}
          </div>

          {/* Section 2: Summary Card */}
          <div className="price-summary-banner">
            <div className="summary-info">
              <span>Total Reservation Price:</span>
              <span className="total-amount">LKR {totalPrice.toLocaleString()}</span>
            </div>
            <span className="summary-note">Includes boat fee & passenger counts</span>
          </div>

          {/* Section 3: Payment Method */}
          <div className="form-section">
            <h3>2. Select Payment Method</h3>
            <div className="payment-method-selector">
              <label className={`payment-tab ${formData.paymentMethod === "card" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleChange}
                />
                <span>💳 Credit / Debit Card</span>
              </label>

              <label className={`payment-tab ${formData.paymentMethod === "cash" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === "cash"}
                  onChange={handleChange}
                />
                <span>💵 Pay Cash On Arrival</span>
              </label>

              <label className={`payment-tab ${formData.paymentMethod === "paypal" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={formData.paymentMethod === "paypal"}
                  onChange={handleChange}
                />
                <span>🅿️ PayPal</span>
              </label>
            </div>

            {formData.paymentMethod === "card" && (
              <div className="card-fields-box">
                <div className="form-field">
                  <label>16-Digit Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    maxLength="16"
                    placeholder="1234 5678 9101 1121"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row dual">
                  <div className="form-field">
                    <label>Expiry (MM/YY)</label>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>CVV Security Code</label>
                    <input
                      type="text"
                      name="cvv"
                      maxLength="4"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === "cash" && (
              <div className="payment-notice-box">
                💵 You can present cash payment upon arrival at the safari boarding deck.
              </div>
            )}

            {formData.paymentMethod === "paypal" && (
              <div className="payment-notice-box">
                🅿️ You will be redirected to complete PayPal authorization after clicking confirm.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-confirm-booking"
            disabled={loading || !!errorMessage}
          >
            {loading ? "Processing Reservation..." : `Confirm & Pay LKR ${totalPrice.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Booking;


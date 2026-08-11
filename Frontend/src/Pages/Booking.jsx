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
    tripId: "",
    paymentMethod: "card", // ✅ Added payment method
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
          `Total passengers (${total}) cannot exceed boat capacity (${boatCapacity})`
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
      return "Date must be today or a future date.";
    }

    if (!selectedBoat) {
      return "Please select a valid boat.";
    }

    if (formData.adults < 1) return "At least 1 adult is required.";
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
      return "Please select a valid trip.";
    }

    // ✅ Validate only if Card payment is selected
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
      trips.find((t) => t.id === Number(formData.tripId)) || null;

    const bookingData = {
      name: formData.name,
      email: formData.email,
      safariDate: formData.date,
      adults: formData.adults,
      children: formData.children,
      totalPrice,
      paymentMethod: formData.paymentMethod, // ✅ Send payment method
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
          `✅ Booking successful using ${formData.paymentMethod.toUpperCase()} payment!`
        );
        setShowBooking(false);
        navigate(`/invoice/${savedBooking.id}`);
      } else {
        const errMsg = await response.text();
        alert("❌ Error: " + errMsg);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("⚠️ Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="modal-overlay">
      <div className="booking-container">
        <button className="close-btn" onClick={() => setShowBooking(false)}>
          ×
        </button>
        <h2>Booking: {trip.name}</h2>

        <form className="booking-form" onSubmit={handleSubmit}>
          {/* Boat */}
          <label>Select Boat:</label>
          <select
            name="boatId"
            value={formData.boatId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Boat --</option>
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.boatType}) - LKR {b.price}
              </option>
            ))}
          </select>

          {/* Adults/Children */}
          <label>Number of Adults:</label>
          <input
            type="number"
            name="adults"
            min="1"
            value={formData.adults}
            onChange={handleChange}
            required
          />

          <label>Number of Children:</label>
          <input
            type="number"
            name="children"
            min="0"
            value={formData.children}
            onChange={handleChange}
          />

          {errorMessage && <p className="error-msg">{errorMessage}</p>}

          {/* Customer Info */}
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Date of Safari:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          {/* Trip */}
          <label>Select Trip:</label>
          <select
            name="tripId"
            value={formData.tripId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Trip --</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - LKR {t.adultPrice} (Adult) / LKR {t.childPrice || 0}{" "}
                (Child)
              </option>
            ))}
          </select>

          <p>
            Total Price: <strong>LKR {totalPrice}</strong>
          </p>

          {/* ✅ Payment Section */}
          <h3>Payment Method</h3>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <option value="card">💳 Card Payment</option>
            <option value="cash">💵 Cash</option>
            <option value="paypal">🅿️ PayPal</option>
          </select>

          {formData.paymentMethod === "card" && (
            <>
              <label>Card Number:</label>
              <input
                type="text"
                name="cardNumber"
                maxLength="16"
                value={formData.cardNumber}
                onChange={handleChange}
                required
              />

              <label>Expiry (MM/YY):</label>
              <input
                type="text"
                name="expiry"
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={handleChange}
                required
              />

              <label>CVV:</label>
              <input
                type="text"
                name="cvv"
                maxLength="4"
                value={formData.cvv}
                onChange={handleChange}
                required
              />
            </>
          )}

          {formData.paymentMethod === "cash" && (
            <p style={{ color: "green" }}>
              💵 You can pay by cash when you arrive at the safari location.
            </p>
          )}

          {formData.paymentMethod === "paypal" && (
            <p style={{ color: "green" }}>
              🅿️ You will be redirected to PayPal after booking.
            </p>
          )}

          <button type="submit" disabled={loading || !!errorMessage}>
            {loading ? "Processing..." : `Pay LKR ${totalPrice}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Booking;

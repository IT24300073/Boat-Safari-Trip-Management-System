import "../Styles/Booking.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Booking({ setShowBooking, trip, initialDate, initialBoatId, scheduledSlot }) {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: initialDate || (scheduledSlot?.scheduleDate || new Date().toISOString().split("T")[0]),
    timeSlot: scheduledSlot?.timeSlot || "08:00 AM - 10:00 AM",
    scheduleId: scheduledSlot?.id ? Number(scheduledSlot.id) : null,
    adults: 1,
    children: 0,
    boatId: initialBoatId ? String(initialBoatId) : (scheduledSlot?.boatId ? String(scheduledSlot.boatId) : ""),
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
  const [cardError, setCardError] = useState("");

  // Auto-fill logged in user details
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetch("http://localhost:8080/api/boats")
      .then((res) => res.json())
      .then((data) => {
        const availableBoats = (data || []).filter(
          (b) => b.status !== "MAINTENANCE" && b.status !== "UNAVAILABLE"
        );
        setBoats(availableBoats);
        if (availableBoats.length > 0) {
          setFormData((prev) => {
            const targetId = scheduledSlot?.boatId || initialBoatId;
            const chosenId =
              targetId && availableBoats.some((b) => b.id === Number(targetId))
                ? String(targetId)
                : prev.boatId || String(availableBoats[0].id);
            return { ...prev, boatId: chosenId };
          });
        }
      })
      .catch((err) => console.error("Error fetching boats:", err));

    fetch("http://localhost:8080/api/trips")
      .then((res) => res.json())
      .then((data) => setTrips(data || []))
      .catch((err) => console.error("Error fetching trips:", err));
  }, [initialBoatId, scheduledSlot]);

  const selectedBoat =
    boats.find((b) => b.id === Number(formData.boatId)) ||
    (scheduledSlot
      ? {
          id: scheduledSlot.boatId,
          name: scheduledSlot.boatName,
          boatType: "Safari Vessel",
          capacity: scheduledSlot.totalCapacity || 10,
          price: 0,
        }
      : boats[0] || null);

  const boatCapacity = selectedBoat ? selectedBoat.capacity : (scheduledSlot?.totalCapacity || 10);

  const totalPrice =
    formData.adults * (trip?.adultPrice || 0) +
    formData.children * (trip?.childPrice || 0) +
    (selectedBoat?.price || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-adjust Credit Card Number 4 by 4 (e.g. 1234 5678 9012 3456)
    if (name === "cardNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
      const formattedCard = digitsOnly.match(/.{1,4}/g)?.join(" ") || "";
      setFormData((prev) => ({ ...prev, cardNumber: formattedCard }));
      return;
    }

    // Auto-adjust Expiry Date with slash after month and validate against past dates
    if (name === "expiry") {
      // Handle backspacing cleanly
      if (e.nativeEvent && e.nativeEvent.inputType === "deleteContentBackward") {
        let val = value;
        if (val.length === 2 && formData.expiry.endsWith("/")) {
          val = val.slice(0, 1);
        }
        setFormData((prev) => ({ ...prev, expiry: val }));
        setCardError("");
        return;
      }

      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      let formattedExpiry = digitsOnly;
      if (digitsOnly.length === 1 && Number(digitsOnly) > 1) {
        // Single digit month > 1 (e.g. 2-9) auto pads with 0 and appends slash
        formattedExpiry = `0${digitsOnly}/`;
      } else if (digitsOnly.length >= 2) {
        formattedExpiry = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
      }

      setFormData((prev) => ({ ...prev, expiry: formattedExpiry }));

      // Real-time Expiry Validation when MM/YY is fully typed
      if (formattedExpiry.length === 5) {
        const match = formattedExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) {
          setCardError("Invalid month. Month must be between 01 and 12.");
        } else {
          const expM = parseInt(match[1], 10);
          const expY = 2000 + parseInt(match[2], 10);
          const now = new Date();
          const curY = now.getFullYear();
          const curM = now.getMonth() + 1;

          if (expY < curY || (expY === curY && expM < curM)) {
            setCardError("Card has expired. Expiry date cannot be in the past.");
          } else if (expY > curY + 25) {
            setCardError("Expiry year cannot be more than 25 years in the future.");
          } else {
            setCardError("");
          }
        }
      } else {
        setCardError("");
      }
      return;
    }

    // CVV security code (digits only, max 4)
    if (name === "cvv") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({ ...prev, cvv: digitsOnly }));
      return;
    }

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
      const rawCard = (formData.cardNumber || "").replace(/\s+/g, "");
      if (!/^\d{16}$/.test(rawCard)) {
        return "Card number must be exactly 16 digits.";
      }

      const match = (formData.expiry || "").match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      if (!match) {
        return "Expiry must be in MM/YY format with a valid month (01-12).";
      }

      const expMonth = parseInt(match[1], 10);
      const expYear = 2000 + parseInt(match[2], 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-indexed

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return "Credit card has expired. Expiry date cannot be in the past.";
      }

      if (expYear > currentYear + 25) {
        return "Expiry year cannot be more than 25 years in the future.";
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
      timeSlot: formData.timeSlot || scheduledSlot?.timeSlot || "08:00 AM - 10:00 AM",
      scheduleId: formData.scheduleId || (scheduledSlot?.id ? Number(scheduledSlot.id) : null),
      adults: formData.adults,
      children: formData.children,
      passengers: Number(formData.adults) + Number(formData.children),
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
        const data = await response.json().catch(() => null);
        const msg = data?.message || "Booking failed. Please try a different boat or date.";
        setErrorMessage("⚠️ Assignment Conflict: " + msg);
        alert("⚠️ Assignment Conflict: " + msg);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("⚠️ Server connection error!");
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
                <label>Safari Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label>Departure Time Slot *</label>
                {scheduledSlot ? (
                  <div className="locked-time-slot-pill">
                    <span>⏰ <strong>{scheduledSlot.timeSlot}</strong></span>
                    <span className="slot-locked-tag">Confirmed Slot</span>
                  </div>
                ) : (
                  <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleChange}
                    required
                  >
                    <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Morning Safari)</option>
                    <option value="10:30 AM - 12:30 PM">10:30 AM - 12:30 PM (Midday Cruise)</option>
                    <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM (Afternoon Tour)</option>
                    <option value="03:30 PM - 05:30 PM">03:30 PM - 05:30 PM (Sunset Expedition)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Expedition Vessel Allocation (Managed by Operations) */}
            <div className="vessel-assignment-banner">
              <div className="vessel-badge-row">
                <span className="vessel-tag">
                  {scheduledSlot ? "⛵ ASSIGNED EXPEDITION VESSEL" : "⛵ FLEET DISPATCH ALLOCATION"}
                </span>
                <span className="operations-pill">Managed by Safari Operations</span>
              </div>

              <div className="vessel-details-grid">
                <div className="vessel-main-info">
                  <span className="vessel-name-txt">
                    {selectedBoat ? selectedBoat.name : (scheduledSlot?.boatName || "Safari Expedition Boat")}
                  </span>
                  <span className="vessel-type-txt">
                    {selectedBoat?.boatType ? `${selectedBoat.boatType} Class` : "Certified River Class"}
                  </span>
                </div>

                <div className="vessel-attributes">
                  <span className="attr-item">👥 Vessel Capacity: <strong>{boatCapacity} Passengers</strong></span>
                  {scheduledSlot?.guideName && (
                    <span className="attr-item">🧭 Certified Captain: <strong>{scheduledSlot.guideName}</strong></span>
                  )}
                  {scheduledSlot?.timeSlot && (
                    <span className="attr-item">⏰ Departure Slot: <strong>{scheduledSlot.timeSlot}</strong></span>
                  )}
                  <span className="attr-item">🛡️ Life jackets & safety gear inspected</span>
                </div>
              </div>

              <p className="vessel-dispatch-note">
                {scheduledSlot
                  ? "This vessel and certified captain are formally locked and assigned to your scheduled expedition slot."
                  : "Expedition vessels and certified captains are dispatched by Safari Operations based on river safety conditions."}
              </p>
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
            <div className="summary-breakdown-grid">
              <div className="summary-row">
                <span>Adult Seats ({formData.adults}x):</span>
                <span>LKR {(formData.adults * (trip?.adultPrice || 0)).toLocaleString()}</span>
              </div>
              {formData.children > 0 && (
                <div className="summary-row">
                  <span>Child Seats ({formData.children}x):</span>
                  <span>LKR {(formData.children * (trip?.childPrice || 0)).toLocaleString()}</span>
                </div>
              )}
              {selectedBoat && selectedBoat.price > 0 && (
                <div className="summary-row">
                  <span>Boat Fee ({selectedBoat.name}):</span>
                  <span>LKR {selectedBoat.price.toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total Reservation Price:</span>
                <span className="total-amount">LKR {totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <span className="summary-note">Instant Online Confirmation & Invoice Issued Upon Reservation</span>
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
                    maxLength="19"
                    placeholder="1234 5678 9101 1121"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="form-row dual">
                  <div className="form-field">
                    <label>Expiry (MM/YY)</label>
                    <input
                      type="text"
                      name="expiry"
                      maxLength="5"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleChange}
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      className={cardError ? "input-invalid" : ""}
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
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                {cardError && (
                  <div className="card-error-hint">
                    ⚠️ {cardError}
                  </div>
                )}
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
            disabled={loading || !!errorMessage || (formData.paymentMethod === "card" && !!cardError)}
          >
            {loading ? "Processing Reservation..." : `Confirm & Pay LKR ${totalPrice.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Booking;


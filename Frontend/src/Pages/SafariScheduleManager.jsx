import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/SafariScheduleManager.css";

function SafariScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    tripName: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    timeSlot: "08:00 AM - 10:00 AM",
    boatId: "",
    guideName: "",
  });

  const [availability, setAvailability] = useState(null);

  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:30 AM - 12:30 PM",
    "01:00 PM - 03:00 PM",
    "03:30 PM - 05:30 PM",
  ];

  const commonGuides = [
    "Captain Sunimal",
    "Captain Nimal",
    "Captain Perera",
    "Captain Fernando",
    "Captain Silva",
  ];

  const fetchInitialData = () => {
    axios
      .get("http://localhost:8080/api/boats")
      .then((res) => setBoats(res.data || []))
      .catch((err) => console.error("Error fetching boats:", err));

    axios
      .get("http://localhost:8080/api/trips")
      .then((res) => setTrips(res.data || []))
      .catch((err) => console.error("Error fetching trips:", err));

    axios
      .get("http://localhost:8080/api/schedules")
      .then((res) => setSchedules(res.data || []))
      .catch((err) => console.error("Error fetching schedules:", err));
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Real-time availability checker
  useEffect(() => {
    if (formData.scheduleDate && formData.timeSlot && (formData.boatId || formData.guideName)) {
      axios
        .get("http://localhost:8080/api/schedules/check-availability", {
          params: {
            boatId: formData.boatId || 0,
            guideName: formData.guideName || "",
            date: formData.scheduleDate,
            timeSlot: formData.timeSlot,
          },
        })
        .then((res) => setAvailability(res.data))
        .catch((err) => console.error("Error checking availability:", err));
    } else {
      setAvailability(null);
    }
  }, [formData.boatId, formData.guideName, formData.scheduleDate, formData.timeSlot]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTripSelect = (e) => {
    const selectedTripName = e.target.value;
    setFormData({ ...formData, tripName: selectedTripName });
  };

  const [editingId, setEditingId] = useState(null);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState("⛈️ Adverse Weather / Heavy Rain");
  const [customCancelReason, setCustomCancelReason] = useState("");

  const cancelReasonPresets = [
    "⛈️ Adverse Weather / Heavy Rain",
    "🛠️ Sudden Boat Maintenance",
    "🌊 High Water Level / River Safety Warning",
    "👤 Customer Request / Reschedule",
    "✏️ Custom Reason",
  ];

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      tripName: schedule.tripName,
      scheduleDate: schedule.scheduleDate,
      timeSlot: schedule.timeSlot,
      boatId: schedule.boatId ? String(schedule.boatId) : "",
      guideName: schedule.guideName || "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      tripName: "",
      scheduleDate: new Date().toISOString().split("T")[0],
      timeSlot: "08:00 AM - 10:00 AM",
      boatId: "",
      guideName: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.tripName) {
      setError("Please select or enter a Safari Trip Name.");
      return;
    }

    if (!formData.boatId) {
      setError("Please select a boat for this safari schedule.");
      return;
    }

    if (!formData.guideName.trim()) {
      setError("Please specify an assigned Safari Guide.");
      return;
    }

    setLoading(true);

    try {
      const selectedBoat = boats.find((b) => b.id === Number(formData.boatId));
      const payload = {
        tripName: formData.tripName,
        scheduleDate: formData.scheduleDate,
        timeSlot: formData.timeSlot,
        boatId: Number(formData.boatId),
        boatName: selectedBoat?.name || "",
        guideName: formData.guideName.trim(),
      };

      let response;
      if (editingId) {
        response = await axios.put(`http://localhost:8080/api/schedules/${editingId}`, payload);
        setMessage(`✅ Safari schedule #${editingId} updated successfully!`);
      } else {
        response = await axios.post("http://localhost:8080/api/schedules", payload);
        setMessage(
          `🎉 Safari schedule created successfully! Trip "${formData.tripName}" scheduled with Boat "${selectedBoat?.name}" & Guide "${formData.guideName}" for ${formData.scheduleDate} (${formData.timeSlot}).`
        );
      }

      if (response.data) {
        handleCancelEdit();
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setError("⚠️ " + (err.response.data?.message || "Scheduling Conflict detected."));
      } else {
        setError("Failed to save safari schedule. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelSchedule = async () => {
    if (!cancellingItem) return;

    const finalReason =
      selectedCancelReason === "✏️ Custom Reason"
        ? customCancelReason.trim() || "Cancelled by Operations Manager"
        : selectedCancelReason;

    try {
      await axios.put(`http://localhost:8080/api/schedules/${cancellingItem.id}/cancel`, {
        reason: finalReason,
      });
      setMessage(
        `🚫 Schedule #${cancellingItem.id} marked CANCELLED (${finalReason}). Boat and Guide time slots are now UNLOCKED and available!`
      );
      setCancellingItem(null);
      setCustomCancelReason("");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError("Failed to cancel schedule.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this safari schedule record?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/schedules/${id}`);
      setMessage("Safari schedule deleted successfully.");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete schedule.");
    }
  };

  return (
    <div className="schedule-page-wrapper">
      <div className="schedule-container">
        <div className="schedule-header">
          <div className="schedule-badge">🧭 OPERATIONS MANAGEMENT</div>
          <h2>Safari Schedule & Real-Time Availability Manager</h2>
          <p>
            Create, edit, or cancel safari schedules in response to weather, water levels, or maintenance.
            Cancelling a trip instantly unlocks boat and guide time slots.
          </p>
        </div>

        {message && <div className="alert-box success">{message}</div>}
        {error && <div className="alert-box error">{error}</div>}

        {/* Schedule Form Card */}
        <div className="schedule-card">
          <h3>
            {editingId ? `✏️ Edit Safari Trip Schedule #${editingId}` : "📅 Create New Safari Trip Schedule"}
          </h3>
          <form onSubmit={handleSubmit} className="schedule-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tripName">Safari Trip Package *</label>
                <select onChange={handleTripSelect} value={formData.tripName}>
                  <option value="">-- Choose Existing Package or Type Below --</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.type || "Safari"}) - LKR {t.adultPrice}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="tripName"
                  value={formData.tripName}
                  onChange={handleChange}
                  placeholder="Or enter custom Safari Name..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="scheduleDate">Schedule Date *</label>
                <input
                  type="date"
                  id="scheduleDate"
                  name="scheduleDate"
                  value={formData.scheduleDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="timeSlot">Time Slot *</label>
                <select
                  id="timeSlot"
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleChange}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="boatId">Assign Boat *</label>
                <select
                  id="boatId"
                  name="boatId"
                  value={formData.boatId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Available Boat --</option>
                  {boats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.boatType}, Cap: {b.capacity}) - Status: {b.status || "AVAILABLE"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="guideName">Assign Safari Guide *</label>
                <input
                  type="text"
                  id="guideName"
                  name="guideName"
                  list="guide-options"
                  value={formData.guideName}
                  onChange={handleChange}
                  placeholder="Enter or select Guide Name"
                  required
                />
                <datalist id="guide-options">
                  {commonGuides.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Real-time availability status indicators */}
            {availability && (
              <div className="availability-preview">
                <div className={`status-pill ${availability.boatAvailable ? "green" : "red"}`}>
                  {availability.boatAvailable ? "✅ Boat Available" : "❌ " + availability.boatMessage}
                </div>
                <div className={`status-pill ${availability.guideAvailable ? "green" : "red"}`}>
                  {availability.guideAvailable ? "✅ Guide Free" : "❌ " + availability.guideMessage}
                </div>
              </div>
            )}

            <div className="form-actions-row">
              <button type="submit" className="btn-submit-schedule" disabled={loading}>
                {loading
                  ? "Verifying & Saving..."
                  : editingId
                  ? "💾 Update Schedule"
                  : "🚀 Validate & Confirm Safari Schedule"}
              </button>
              {editingId && (
                <button type="button" className="btn-cancel-edit" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Cancel Reason Modal */}
        {cancellingItem && (
          <div className="modal-backdrop">
            <div className="cancel-modal">
              <h3>🚫 Cancel Safari Schedule #{cancellingItem.id}</h3>
              <p>
                Cancelling trip <strong>"{cancellingItem.tripName}"</strong> will unlock Boat{" "}
                <strong>"{cancellingItem.boatName}"</strong> and Guide <strong>"{cancellingItem.guideName}"</strong>.
              </p>

              <div className="form-group">
                <label>Select Reason for Cancellation *</label>
                <select
                  value={selectedCancelReason}
                  onChange={(e) => setSelectedCancelReason(e.target.value)}
                >
                  {cancelReasonPresets.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCancelReason === "✏️ Custom Reason" && (
                <div className="form-group">
                  <label>Specify Custom Reason</label>
                  <input
                    type="text"
                    placeholder="Enter custom cancellation notes..."
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-button-row">
                <button className="btn-confirm-cancel" onClick={confirmCancelSchedule}>
                  Confirm Cancellation & Release Slot
                </button>
                <button className="btn-close-modal" onClick={() => setCancellingItem(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master Schedule Table */}
        <div className="schedule-card table-section">
          <h3>📋 Master Safari Schedule Registry</h3>
          {schedules.length === 0 ? (
            <p className="no-records">No safari schedules registered.</p>
          ) : (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trip Name</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Assigned Boat</th>
                  <th>Assigned Guide</th>
                  <th>Status & Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td><strong>{s.tripName}</strong></td>
                    <td>{s.scheduleDate}</td>
                    <td><span className="time-pill">{s.timeSlot}</span></td>
                    <td>⛵ {s.boatName || `Boat #${s.boatId}`}</td>
                    <td>👤 {s.guideName}</td>
                    <td>
                      <span className={`schedule-status ${s.status?.toLowerCase()}`}>
                        {s.status}
                      </span>
                      {s.status === "CANCELLED" && s.cancelReason && (
                        <div className="cancel-reason-tag">
                          Reason: {s.cancelReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-button-group">
                        {s.status !== "CANCELLED" && (
                          <>
                            <button className="btn-edit-schedule" onClick={() => handleEdit(s)}>
                              Edit
                            </button>
                            <button
                              className="btn-cancel-schedule"
                              onClick={() => setCancellingItem(s)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="btn-delete-schedule" onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SafariScheduleManager;

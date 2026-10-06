import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/SafariScheduleManager.css";

const SLOT_ORDER = {
  "08:00 AM - 10:00 AM": 1,
  "10:30 AM - 12:30 PM": 2,
  "01:00 PM - 03:00 PM": 3,
  "03:30 PM - 05:30 PM": 4,
};

function SafariScheduleManager() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "ADMIN" && window.location.pathname === "/schedule") {
      navigate("/admin?tab=schedule", { replace: true });
    }
  }, [user, navigate]);
  const [schedules, setSchedules] = useState([]);
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("all"); // "all", "confirmed", "missing"

  // Pagination & Sorting State
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" for earliest first, "desc" for latest first
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    tripName: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    timeSlot: "08:00 AM - 10:00 AM",
    boatId: "",
    guideId: "",
    guideName: "",
    guideLicense: "",
  });

  const [availability, setAvailability] = useState(null);

  // Quick Assign Operator Modal State
  const [assigningSchedule, setAssigningSchedule] = useState(null);
  const [assignGuideId, setAssignGuideId] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Qualified Operators Registry Modal State
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [newGuide, setNewGuide] = useState({
    name: "",
    licenseNumber: "",
    qualification: "",
    certifiedBoatTypes: "Standard, Luxury, Speed Boat",
    experienceYears: 5,
    contactPhone: "",
    rating: 5.0,
  });
  const [creatingGuide, setCreatingGuide] = useState(false);

  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:30 AM - 12:30 PM",
    "01:00 PM - 03:00 PM",
    "03:30 PM - 05:30 PM",
  ];

  const fetchInitialData = () => {
    setFetchingData(true);
    Promise.all([
      axios.get("http://localhost:8080/api/boats"),
      axios.get("http://localhost:8080/api/trips"),
      axios.get("http://localhost:8080/api/schedules"),
      axios.get("http://localhost:8080/api/guides").catch(() => ({ data: [] })),
    ])
      .then(([boatsRes, tripsRes, schedulesRes, guidesRes]) => {
        setBoats(boatsRes.data || []);
        setTrips(tripsRes.data || []);
        setSchedules(schedulesRes.data || []);
        setGuides(guidesRes.data || []);
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setFetchingData(false));
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

  // Qualified Guide Selection in Form
  const handleGuideSelect = (e) => {
    const val = e.target.value;
    if (!val) {
      setFormData({
        ...formData,
        guideId: "",
        guideName: "",
        guideLicense: "",
      });
      return;
    }

    const matched = guides.find((g) => String(g.id) === String(val) || g.name === val);
    if (matched) {
      setFormData({
        ...formData,
        guideId: String(matched.id),
        guideName: matched.name,
        guideLicense: matched.licenseNumber,
      });
    } else {
      setFormData({
        ...formData,
        guideId: "",
        guideName: val,
        guideLicense: "",
      });
    }
  };

  // Live qualification match check for the form
  const selectedFormBoat = boats.find((b) => b.id === Number(formData.boatId));
  const selectedFormGuide = guides.find(
    (g) => (formData.guideId && String(g.id) === String(formData.guideId)) ||
           (formData.guideName && g.name.toLowerCase() === formData.guideName.toLowerCase())
  );

  let formQualificationAlert = null;
  if (selectedFormBoat && selectedFormGuide) {
    const boatType = (selectedFormBoat.boatType || "").toLowerCase();
    const certTypes = (selectedFormGuide.certifiedBoatTypes || "").toLowerCase();
    const isCert =
      certTypes.includes(boatType) ||
      (boatType.includes("catamaran") && certTypes.includes("standard")) ||
      (boatType.includes("pontoon") && certTypes.includes("standard"));

    formQualificationAlert = {
      isCertified: isCert,
      licenseNumber: selectedFormGuide.licenseNumber,
      experienceYears: selectedFormGuide.experienceYears,
      guideName: selectedFormGuide.name,
      boatType: selectedFormBoat.boatType,
      certifiedTypes: selectedFormGuide.certifiedBoatTypes,
    };
  }

  const [editingId, setEditingId] = useState(null);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState("⛈️ Adverse Weather / Heavy Rain");
  const [customCancelReason, setCustomCancelReason] = useState("");

  const cancelReasons = [
    {
      value: "⛈️ Adverse Weather / Heavy Rain",
      icon: "⛈️",
      label: "Adverse Weather / Heavy Rain",
      badge: "Weather Alert",
      desc: "Monsoon storms, lightning, or heavy downpour making river navigation unsafe.",
    },
    {
      value: "🛠️ Sudden Boat Maintenance",
      icon: "🛠️",
      label: "Sudden Boat Maintenance",
      badge: "Vessel Inspection",
      desc: "Engine inspection, rudder check, or critical safety equipment repair required.",
    },
    {
      value: "🌊 High Water Level / River Safety Warning",
      icon: "🌊",
      label: "High Water Level / River Safety Warning",
      badge: "River Safety",
      desc: "Water level or current speed exceeds authorized safe safari parameters.",
    },
    {
      value: "👤 Customer Request / Reschedule",
      icon: "👤",
      label: "Customer Request / Reschedule",
      badge: "Guest Request",
      desc: "Charter guest requested delay, cancellation, or schedule rescheduling.",
    },
    {
      value: "✏️ Custom Reason",
      icon: "✏️",
      label: "Custom Operational Reason",
      badge: "Custom",
      desc: "Specify a custom cancellation message to be delivered to all booked tourists.",
    },
  ];

  // Sort and filter schedules according to date, search query, and operator filter
  const sortedAndFilteredSchedules = useMemo(() => {
    const filtered = schedules.filter((s) => {
      // Operator status filter
      if (operatorFilter === "confirmed" && (!s.guideName || !s.guideName.trim())) {
        return false;
      }
      if (operatorFilter === "missing" && s.guideName && s.guideName.trim()) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.tripName?.toLowerCase().includes(q) ||
        s.boatName?.toLowerCase().includes(q) ||
        s.guideName?.toLowerCase().includes(q) ||
        s.guideLicense?.toLowerCase().includes(q) ||
        s.scheduleDate?.toLowerCase().includes(q) ||
        s.timeSlot?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.scheduleDate || "";
      const dateB = b.scheduleDate || "";
      const dateComp = dateA.localeCompare(dateB);
      if (dateComp !== 0) {
        return sortOrder === "asc" ? dateComp : -dateComp;
      }
      const slotA = SLOT_ORDER[a.timeSlot] || 99;
      const slotB = SLOT_ORDER[b.timeSlot] || 99;
      return slotA - slotB;
    });
  }, [schedules, searchQuery, sortOrder, operatorFilter]);

  // Reset to first page when search, sort, or recordsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder, recordsPerPage, operatorFilter]);

  const totalRecords = sortedAndFilteredSchedules.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  const paginatedSchedules = sortedAndFilteredSchedules.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      tripName: schedule.tripName,
      scheduleDate: schedule.scheduleDate,
      timeSlot: schedule.timeSlot,
      boatId: schedule.boatId ? String(schedule.boatId) : "",
      guideId: schedule.guideId ? String(schedule.guideId) : "",
      guideName: schedule.guideName || "",
      guideLicense: schedule.guideLicense || "",
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
      guideId: "",
      guideName: "",
      guideLicense: "",
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
      setError("Please assign a qualified Safari Guide operator.");
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
        guideId: formData.guideId ? Number(formData.guideId) : null,
        guideName: formData.guideName.trim(),
        guideLicense: formData.guideLicense || "",
        operatorConfirmed: Boolean(formData.guideName.trim()),
      };

      let response;
      if (editingId) {
        response = await axios.put(`http://localhost:8080/api/schedules/${editingId}`, payload);
        setMessage(`✅ Safari schedule #${editingId} updated successfully with confirmed operator!`);
      } else {
        response = await axios.post("http://localhost:8080/api/schedules", payload);
        setMessage(
          `🎉 Safari schedule created successfully! Trip "${formData.tripName}" scheduled with Boat "${selectedBoat?.name}" & Qualified Operator "${formData.guideName}" for ${formData.scheduleDate} (${formData.timeSlot}).`
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

  // Quick Operator Assignment Handler
  const openAssignModal = (schedule) => {
    setAssigningSchedule(schedule);
    const existingGuide = guides.find((g) => g.name === schedule.guideName);
    setAssignGuideId(existingGuide ? String(existingGuide.id) : "");
  };

  const handleConfirmQuickAssign = async (e) => {
    e.preventDefault();
    if (!assigningSchedule || !assignGuideId) {
      setError("Please select a qualified guide to assign.");
      return;
    }

    const selectedGuide = guides.find((g) => String(g.id) === String(assignGuideId));
    if (!selectedGuide) return;

    setAssigningLoading(true);
    try {
      await axios.put(`http://localhost:8080/api/schedules/${assigningSchedule.id}/assign-guide`, {
        guideId: selectedGuide.id,
        guideName: selectedGuide.name,
        guideLicense: selectedGuide.licenseNumber,
      });

      setMessage(
        `🎖️ Qualified Operator "${selectedGuide.name}" (Lic: ${selectedGuide.licenseNumber}) confirmed for Safari #${assigningSchedule.id}!`
      );
      setAssigningSchedule(null);
      setAssignGuideId("");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to assign qualified operator.");
    } finally {
      setAssigningLoading(false);
    }
  };

  // Create new certified guide
  const handleCreateGuide = async (e) => {
    e.preventDefault();
    if (!newGuide.name.trim() || !newGuide.licenseNumber.trim()) {
      setError("Please provide guide name and marine license number.");
      return;
    }

    setCreatingGuide(true);
    try {
      await axios.post("http://localhost:8080/api/guides", newGuide);
      setMessage(`✅ New certified guide "${newGuide.name}" (${newGuide.licenseNumber}) registered successfully!`);
      setNewGuide({
        name: "",
        licenseNumber: "",
        qualification: "",
        certifiedBoatTypes: "Standard, Luxury, Speed Boat",
        experienceYears: 5,
        contactPhone: "",
        rating: 5.0,
      });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError("Failed to register new guide. License number may already exist.");
    } finally {
      setCreatingGuide(false);
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
        {/* Header Bar */}
        <div className="schedule-header">
          <div className="schedule-badge">🧭 OPERATIONS & FLEET OPERATORS</div>
          <h2>Safari Schedule & Operator Assignment Manager</h2>
          <p>
            Assign qualified certified guides to boats for every scheduled trip, ensuring every voyage has a confirmed licensed operator. Real-time conflict checks and qualification audits are enforced.
          </p>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-open-guide-registry"
              onClick={() => setShowGuideModal(true)}
            >
              👨‍✈️ View Certified Operators Registry ({guides.length})
            </button>
          </div>
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
                      {t.name} ({t.type || "Safari"} • 2h) - LKR {t.adultPrice}
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
                <label htmlFor="boatId">Assign Boat & Vessel Type *</label>
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
                <label htmlFor="guideName">Assign Qualified Guide / Operator *</label>
                <select
                  id="guideSelect"
                  value={formData.guideId || ""}
                  onChange={handleGuideSelect}
                >
                  <option value="">-- Select Certified Safari Guide --</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Lic: {g.licenseNumber} • {g.experienceYears}y exp • {g.certifiedBoatTypes})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  id="guideName"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  placeholder="Or enter custom / ad-hoc operator name..."
                  required
                />
              </div>
            </div>

            {/* Live Qualification Match Alert */}
            {formQualificationAlert && (
              <div className={`qualification-match-box ${formQualificationAlert.isCertified ? "certified" : "advisory"}`}>
                <div className="qualification-icon">
                  {formQualificationAlert.isCertified ? "🎖️" : "⚠️"}
                </div>
                <div className="qualification-details">
                  <strong>
                    {formQualificationAlert.isCertified
                      ? "Certified Operator Match Confirmed:"
                      : "Operator Certification Advisory:"}
                  </strong>{" "}
                  {formQualificationAlert.guideName} (License: {formQualificationAlert.licenseNumber}, {formQualificationAlert.experienceYears}y exp).
                  <div className="qualification-subtext">
                    {formQualificationAlert.isCertified
                      ? `Guide is certified to pilot ${formQualificationAlert.boatType} vessels.`
                      : `Guide certified for [${formQualificationAlert.certifiedTypes}]. Selected boat is [${formQualificationAlert.boatType}]. Confirmation override permitted.`}
                  </div>
                </div>
              </div>
            )}

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
                  ? "💾 Update Schedule & Operator"
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

        {/* Master Schedule Table */}
        <div className="schedule-card table-section">
          <div className="table-header-bar">
            <div className="table-title-group">
              <h3>📋 Master Safari Schedule & Operator Registry</h3>
              <span className="table-subtitle">
                Centralized registry of scheduled expeditions, vessel allocations, and confirmed operators
              </span>
            </div>
            <div className="table-controls-group">
              {/* Operator Confirmation Filter Pills */}
              <div className="operator-filter-pills">
                <button
                  type="button"
                  className={`operator-pill ${operatorFilter === "all" ? "active" : ""}`}
                  onClick={() => setOperatorFilter("all")}
                >
                  All Expeditions
                </button>
                <button
                  type="button"
                  className={`operator-pill ${operatorFilter === "confirmed" ? "active" : ""}`}
                  onClick={() => setOperatorFilter("confirmed")}
                >
                  🎖️ Confirmed Operator
                </button>
                <button
                  type="button"
                  className={`operator-pill ${operatorFilter === "missing" ? "active" : ""}`}
                  onClick={() => setOperatorFilter("missing")}
                >
                  ⚠️ Unassigned Operator
                </button>
              </div>

              <div className="search-filter-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter by trip, boat, operator, license..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="table-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-clear-search"
                    onClick={() => setSearchQuery("")}
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Date Sort Order Toggle */}
              <button
                type="button"
                className="btn-sort-toggle"
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                title="Click to toggle sorting order by date"
              >
                <span className="sort-label">📅 Date:</span>
                <span className="sort-val">
                  {sortOrder === "asc" ? "Earliest First ⬆️" : "Latest First ⬇️"}
                </span>
              </button>

              {/* Records Per Page Dropdown */}
              <div className="page-size-selector">
                <label htmlFor="recordsPerPage">Show:</label>
                <select
                  id="recordsPerPage"
                  value={recordsPerPage}
                  onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                  className="page-size-dropdown"
                >
                  <option value={10}>10 records</option>
                  <option value={20}>20 records</option>
                  <option value={50}>50 records</option>
                </select>
              </div>

              <span className="records-count-badge">
                {totalRecords} {totalRecords === 1 ? "Record" : "Records"}
              </span>
            </div>
          </div>

          {fetchingData ? (
            <div className="empty-state-box">
              <div className="loading-spinner-container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{
                  border: '4px solid rgba(0, 0, 0, 0.1)',
                  borderTop: '4px solid var(--primary-color)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{marginTop: '15px'}}>Loading schedule & operator data...</p>
                <style>
                  {`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}
                </style>
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="empty-state-box">
              <span className="empty-icon">⛵</span>
              <p>No safari schedules registered. Use the form above to schedule your first expedition.</p>
            </div>
          ) : (
            <>
              <div className="schedule-table-container table-responsive-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th className="col-id">ID</th>
                    <th className="col-trip">Trip Name</th>
                    <th
                      className="col-date sortable"
                      onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                      title="Click to toggle date sort order"
                    >
                      <div className="th-sort-wrapper">
                        <span>Date</span>
                        <span className="sort-arrow">{sortOrder === "asc" ? "▲" : "▼"}</span>
                      </div>
                    </th>
                    <th className="col-time">Time Slot</th>
                    <th className="col-boat">Assigned Boat</th>
                    <th className="col-guide">Confirmed Guide Operator</th>
                    <th className="col-status">Status & Notes</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="no-matches-cell">
                        🔍 No safari schedules match the current criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedSchedules.map((s) => {
                      const hasConfirmedOperator = Boolean(s.guideName && s.guideName.trim());
                      return (
                        <tr key={s.id} className={`schedule-row ${s.status?.toLowerCase()}`}>
                          <td className="col-id">
                            <span className="id-tag">#{s.id}</span>
                          </td>
                          <td className="col-trip">
                            <div className="trip-name-cell">
                              <span className="trip-title-text">{s.tripName}</span>
                            </div>
                          </td>
                          <td className="col-date">
                            <span className="date-badge">
                              <span className="cell-icon">📅</span>
                              <span>{s.scheduleDate}</span>
                            </span>
                          </td>
                          <td className="col-time">
                            <span className="time-pill">
                              <span className="pill-icon">⏰</span>
                              <span>{s.timeSlot}</span>
                            </span>
                          </td>
                          <td className="col-boat">
                            <div className="boat-cell">
                              <span className="boat-icon">⛵</span>
                              <div>
                                <span className="boat-name-text">{s.boatName || `Boat #${s.boatId}`}</span>
                              </div>
                            </div>
                          </td>
                          <td className="col-guide">
                            <div className="guide-cell">
                              {hasConfirmedOperator ? (
                                <>
                                  <div className="operator-name-row">
                                    <span className="guide-icon">👨‍✈️</span>
                                    <span className="guide-name-text">{s.guideName}</span>
                                  </div>
                                  <div className="operator-subline">
                                    <span className="operator-license-tag">
                                      {s.guideLicense ? `Lic: ${s.guideLicense}` : "Verified Operator"}
                                    </span>
                                    <span className="operator-status-badge confirmed">
                                      ✅ Confirmed
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="operator-subline">
                                  <span className="operator-status-badge unassigned">
                                    ⚠️ Unconfirmed Operator
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="col-status">
                            <span className={`schedule-status ${s.status?.toLowerCase()}`}>
                              <span className="status-dot">●</span>
                              <span>{s.status}</span>
                            </span>
                            {s.status === "CANCELLED" && s.cancelReason && (
                              <div className="cancel-reason-tag" title={s.cancelReason}>
                                Reason: {s.cancelReason}
                              </div>
                            )}
                          </td>
                          <td className="col-actions">
                            <div className="action-button-group">
                              {s.status !== "CANCELLED" && (
                                <>
                                  <button
                                    className="btn-assign-operator"
                                    onClick={() => openAssignModal(s)}
                                    title="Assign or reassign qualified operator"
                                  >
                                    🎖️ Operator
                                  </button>
                                  <button
                                    className="btn-edit-schedule"
                                    onClick={() => handleEdit(s)}
                                    title="Edit schedule details"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    className="btn-cancel-schedule"
                                    onClick={() => setCancellingItem(s)}
                                    title="Cancel and release boat & guide slots"
                                  >
                                    🚫 Cancel
                                  </button>
                                </>
                              )}
                              <button
                                className="btn-delete-schedule"
                                onClick={() => handleDelete(s.id)}
                                title="Delete record"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalRecords > 0 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing{" "}
                  <strong>{(currentPage - 1) * recordsPerPage + 1}</strong>{" "}
                  to{" "}
                  <strong>{Math.min(currentPage * recordsPerPage, totalRecords)}</strong>{" "}
                  of <strong>{totalRecords}</strong> records
                  <span className="pagination-page-tag">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                  >
                    ⏮ First
                  </button>
                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    ◀ Prev
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`page-num-btn ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  >
                    Next ▶
                  </button>
                  <button
                    type="button"
                    className="page-nav-btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                  >
                    Last ⏭
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>

        {/* Quick Assign Operator Modal */}
        {assigningSchedule && (() => {
          const assignedBoat = boats.find(
            (b) =>
              String(b.id) === String(assigningSchedule.boatId) ||
              b.name?.toLowerCase().trim() === assigningSchedule.boatName?.toLowerCase().trim()
          );
          const selectedGuide = guides.find((g) => String(g.id) === String(assignGuideId));

          // Check certification match
          let certMatch = null;
          if (selectedGuide && assignedBoat) {
            const types = (selectedGuide.certifiedBoatTypes || "").toLowerCase();
            const targetType = (assignedBoat.boatType || "").toLowerCase();
            const isMatch = types.includes(targetType) || types.includes("all") || !assignedBoat.boatType;
            certMatch = {
              isMatch,
              guideTypes: selectedGuide.certifiedBoatTypes,
              boatType: assignedBoat.boatType,
            };
          }

          return (
            <div
              className="modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) setAssigningSchedule(null);
              }}
            >
              <div className="assign-operator-modal">
                {/* Header */}
                <div className="assign-modal-header">
                  <div className="assign-modal-header-top">
                    <span className="assign-badge">
                      <span className="badge-dot">●</span> TRIP OPERATOR DISPATCH
                    </span>
                    <button
                      type="button"
                      className="btn-modal-close"
                      onClick={() => setAssigningSchedule(null)}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <h3>
                    Assign Qualified Guide to <span className="assign-sched-tag">Schedule #{assigningSchedule.id}</span>
                  </h3>
                  <p>
                    Every scheduled voyage requires a confirmed, certified operator. Review vessel parameters and assign from certified marina crew below.
                  </p>
                </div>

                {/* Schedule & Vessel Meta Summary Card */}
                <div className="assign-schedule-meta-grid">
                  <div className="assign-meta-item">
                    <span className="meta-icon">🗺️</span>
                    <div className="meta-text">
                      <span className="meta-label">Safari Package</span>
                      <span className="meta-value">{assigningSchedule.tripName}</span>
                    </div>
                  </div>

                  <div className="assign-meta-item">
                    <span className="meta-icon">📅</span>
                    <div className="meta-text">
                      <span className="meta-label">Date & Time Slot</span>
                      <span className="meta-value">
                        {assigningSchedule.scheduleDate} • <span className="meta-slot-highlight">{assigningSchedule.timeSlot}</span>
                      </span>
                    </div>
                  </div>

                  <div className="assign-meta-item">
                    <span className="meta-icon">🚤</span>
                    <div className="meta-text">
                      <span className="meta-label">Assigned Vessel</span>
                      <div className="meta-value-vessel">
                        <span>{assigningSchedule.boatName || `Boat #${assigningSchedule.boatId}`}</span>
                        {assignedBoat && (
                          <span className="vessel-type-badge">
                            {assignedBoat.boatType || "Standard"} • {assignedBoat.capacity} Seats
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Form */}
                <form onSubmit={handleConfirmQuickAssign} className="assign-form">
                  <div className="assign-form-group">
                    <label htmlFor="modalAssignGuide">
                      <span>Select Certified Guide Operator *</span>
                      <span className="label-subtext">Active Marine Pilots ({guides.length} available)</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="modalAssignGuide"
                        value={assignGuideId}
                        onChange={(e) => setAssignGuideId(e.target.value)}
                        required
                        className="custom-operator-select"
                      >
                        <option value="">-- Choose Qualified Guide / Captain --</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} (License: {g.licenseNumber} • {g.experienceYears}y exp • {g.certifiedBoatTypes})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Guide Credential Preview Card */}
                  {selectedGuide && (
                    <div className="operator-preview-card">
                      <div className="operator-preview-header">
                        <div className="operator-avatar-circle">👨‍✈️</div>
                        <div className="operator-preview-title-block">
                          <div className="operator-name-row">
                            <h4>{selectedGuide.name}</h4>
                            <span className="operator-license-chip">Lic: {selectedGuide.licenseNumber}</span>
                          </div>
                          <div className="operator-meta-subline">
                            <span>🎓 {selectedGuide.qualification}</span>
                            <span>•</span>
                            <span>⏳ {selectedGuide.experienceYears} Years Exp</span>
                            <span>•</span>
                            <span className="operator-rating-star">⭐ {selectedGuide.rating} / 5.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Certification Match Badge */}
                      {certMatch && (
                        <div className={`certification-match-pill ${certMatch.isMatch ? "match-verified" : "match-advisory"}`}>
                          <span className="cert-pill-icon">{certMatch.isMatch ? "🎖️" : "⚠️"}</span>
                          <div className="cert-pill-text">
                            <strong>{certMatch.isMatch ? "Certified Vessel Match:" : "Operator Vessel Advisory:"}</strong>{" "}
                            {certMatch.isMatch
                              ? `Pilot is certified to operate [${certMatch.boatType || "all"}] vessels.`
                              : `Pilot certified for [${certMatch.guideTypes}]. Assigned vessel is [${certMatch.boatType}]. Operational sign-off required.`}
                          </div>
                        </div>
                      )}

                      {/* Contact / Radio */}
                      <div className="operator-preview-footer">
                        <span>📻 <strong>Dispatch Contact:</strong> {selectedGuide.contactPhone || "VHF Marine Channel 16 / Operations Desk"}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="modal-actions-row">
                    <button
                      type="button"
                      className="btn-cancel-modal"
                      onClick={() => setAssigningSchedule(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-confirm-operator-assign"
                      disabled={assigningLoading || !assignGuideId}
                    >
                      {assigningLoading ? (
                        <>
                          <span className="spinner-sm"></span> Assigning...
                        </>
                      ) : (
                        "🎖️ Confirm Operator Assignment"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Qualified Operators Registry Modal */}
        {showGuideModal && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGuideModal(false);
            }}
          >
            <div className="guide-registry-modal">
              <div className="guide-registry-header">
                <div>
                  <div className="assign-badge">CERTIFIED CREW MANAGEMENT</div>
                  <h3>👨‍✈️ Qualified Safari Guides & Operators Directory</h3>
                  <p>Certified marine pilots and safari naturalists authorized to operate safari vessels.</p>
                </div>
                <button
                  type="button"
                  className="btn-close-registry"
                  onClick={() => setShowGuideModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* Guide Cards Grid */}
              <div className="guide-cards-grid">
                {guides.map((g) => (
                  <div key={g.id} className="guide-profile-card">
                    <div className="guide-card-top">
                      <div className="guide-avatar-badge">👨‍✈️</div>
                      <div className="guide-card-info">
                        <h4>{g.name}</h4>
                        <span className="guide-license-pill">Lic: {g.licenseNumber}</span>
                      </div>
                    </div>
                    <div className="guide-card-body">
                      <div className="guide-data-line">
                        <span className="guide-data-lbl">Qualification:</span>
                        <span className="guide-data-val">{g.qualification}</span>
                      </div>
                      <div className="guide-data-line">
                        <span className="guide-data-lbl">Certified Vessels:</span>
                        <span className="guide-data-val cert-types">{g.certifiedBoatTypes}</span>
                      </div>
                      <div className="guide-data-row">
                        <span>⏳ {g.experienceYears} Years Exp</span>
                        <span>⭐ {g.rating} Rating</span>
                        <span className="guide-status-active">● {g.status || "ACTIVE"}</span>
                      </div>
                      {g.contactPhone && (
                        <div className="guide-data-line">
                          <span className="guide-data-lbl">Phone:</span>
                          <span className="guide-data-val">{g.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Register New Qualified Guide Section */}
              <div className="add-guide-section">
                <div className="add-guide-header">
                  <div className="add-guide-title-row">
                    <span className="add-guide-icon-badge">➕</span>
                    <div>
                      <h4>Register New Qualified Safari Operator</h4>
                      <p className="add-guide-subtitle">
                        Add a verified marine captain or safari guide to the official operations dispatch registry.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateGuide} className="new-guide-form">
                  <div className="new-guide-grid">
                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">👤</span> Guide Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Captain Anura Jayasuriya"
                        value={newGuide.name}
                        onChange={(e) => setNewGuide({ ...newGuide, name: e.target.value })}
                        required
                        className="custom-guide-input"
                      />
                    </div>

                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">📜</span> Marine License Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SL-NAV-7104"
                        value={newGuide.licenseNumber}
                        onChange={(e) => setNewGuide({ ...newGuide, licenseNumber: e.target.value })}
                        required
                        className="custom-guide-input"
                      />
                    </div>

                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">🎓</span> Certifications & Qualifications *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Master Mariner & First Aid"
                        value={newGuide.qualification}
                        onChange={(e) => setNewGuide({ ...newGuide, qualification: e.target.value })}
                        required
                        className="custom-guide-input"
                      />
                    </div>

                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">🚤</span> Certified Vessel Types *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Standard, Luxury, Speed Boat, Catamaran"
                        value={newGuide.certifiedBoatTypes}
                        onChange={(e) => setNewGuide({ ...newGuide, certifiedBoatTypes: e.target.value })}
                        required
                        className="custom-guide-input"
                      />
                      <div className="vessel-tag-hints">
                        <span
                          type="button"
                          onClick={() =>
                            setNewGuide((prev) => ({
                              ...prev,
                              certifiedBoatTypes: prev.certifiedBoatTypes
                                ? `${prev.certifiedBoatTypes}, Luxury`
                                : "Luxury",
                            }))
                          }
                        >
                          + Luxury
                        </span>
                        <span
                          type="button"
                          onClick={() =>
                            setNewGuide((prev) => ({
                              ...prev,
                              certifiedBoatTypes: prev.certifiedBoatTypes
                                ? `${prev.certifiedBoatTypes}, Speed Boat`
                                : "Speed Boat",
                            }))
                          }
                        >
                          + Speed Boat
                        </span>
                        <span
                          type="button"
                          onClick={() =>
                            setNewGuide((prev) => ({
                              ...prev,
                              certifiedBoatTypes: prev.certifiedBoatTypes
                                ? `${prev.certifiedBoatTypes}, Standard`
                                : "Standard",
                            }))
                          }
                        >
                          + Standard
                        </span>
                        <span
                          type="button"
                          onClick={() =>
                            setNewGuide((prev) => ({
                              ...prev,
                              certifiedBoatTypes: prev.certifiedBoatTypes
                                ? `${prev.certifiedBoatTypes}, Catamaran`
                                : "Catamaran",
                            }))
                          }
                        >
                          + Catamaran
                        </span>
                      </div>
                    </div>

                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">⏳</span> Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newGuide.experienceYears}
                        onChange={(e) => setNewGuide({ ...newGuide, experienceYears: Number(e.target.value) })}
                        className="custom-guide-input"
                      />
                    </div>

                    <div className="guide-field-group">
                      <label>
                        <span className="field-icon">📞</span> Contact Phone / Dispatch Radio
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +94 77 000 0000"
                        value={newGuide.contactPhone}
                        onChange={(e) => setNewGuide({ ...newGuide, contactPhone: e.target.value })}
                        className="custom-guide-input"
                      />
                    </div>
                  </div>

                  <div className="register-guide-action-bar">
                    <button type="submit" className="btn-register-guide" disabled={creatingGuide}>
                      {creatingGuide ? (
                        <>
                          <span className="spinner-sm"></span> Registering Operator...
                        </>
                      ) : (
                        <>
                          <span>🎖️</span> Register Certified Operator
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modern Cancel Reason Modal */}
        {cancellingItem && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setCancellingItem(null);
                setCustomCancelReason("");
              }
            }}
          >
            <div className="cancel-modal">
              <div className="cancel-modal-header">
                <div className="cancel-badge-row">
                  <span className="cancel-modal-badge">EXPEDITION CANCELLATION</span>
                  <span className="cancel-slot-id">Schedule #{cancellingItem.id}</span>
                </div>
                <h3>Cancel Safari Departure</h3>
                <p className="cancel-modal-desc">
                  Select an operational reason. Cancelling immediately unlocks both the boat and the confirmed operator for alternative bookings.
                </p>
              </div>

              {/* Modern Selectable Reason Cards */}
              <div className="cancel-reasons-group">
                <div className="reasons-group-label">
                  <span>Select Reason for Cancellation</span>
                  <span className="required-star">* Required for tourist alerts</span>
                </div>

                <div className="reasons-card-list">
                  {cancelReasons.map((r) => {
                    const isSelected = selectedCancelReason === r.value;
                    return (
                      <div
                        key={r.value}
                        className={`reason-card-tile ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedCancelReason(r.value)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedCancelReason(r.value);
                          }
                        }}
                      >
                        <div className="reason-card-left">
                          <span className="reason-tile-icon">{r.icon}</span>
                          <div className="reason-tile-text">
                            <div className="reason-tile-head">
                              <span className="reason-tile-title">{r.label}</span>
                              <span className="reason-tile-badge">{r.badge}</span>
                            </div>
                            <span className="reason-tile-desc">{r.desc}</span>
                          </div>
                        </div>

                        <div className="reason-tile-radio">
                          <div className={`custom-radio-circle ${isSelected ? "checked" : ""}`}>
                            {isSelected && <span className="radio-inner-dot"></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Reason Textarea */}
              {selectedCancelReason === "✏️ Custom Reason" && (
                <div className="custom-reason-input-box">
                  <label htmlFor="customCancelReason">Specify Custom Operational Reason *</label>
                  <textarea
                    id="customCancelReason"
                    rows={2}
                    placeholder="Enter specific cancellation reason that will be sent to all booked tourists..."
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    className="custom-reason-textarea"
                    autoFocus
                  />
                </div>
              )}

              {/* Live Tourist Notification Alert Preview */}
              <div className="notification-preview-card">
                <div className="preview-card-header">
                  <span className="preview-icon">🔔</span>
                  <span className="preview-title">Tourist Alert Preview</span>
                  <span className="preview-badge">Auto-Sent</span>
                </div>
                <p className="preview-text">
                  "Dear Guest, your safari <strong>'{cancellingItem.tripName}'</strong> on{" "}
                  <strong>{cancellingItem.scheduleDate} ({cancellingItem.timeSlot})</strong> has been cancelled due to:{" "}
                  <span className="preview-reason-highlight">
                    {selectedCancelReason === "✏️ Custom Reason"
                      ? (customCancelReason.trim() || "[Custom reason will appear here]")
                      : selectedCancelReason}
                  </span>
                  . Please contact support or reschedule."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="modal-button-row">
                <button
                  type="button"
                  className="btn-confirm-cancel"
                  onClick={confirmCancelSchedule}
                  disabled={selectedCancelReason === "✏️ Custom Reason" && !customCancelReason.trim()}
                >
                  Confirm Cancellation & Release Resources ➔
                </button>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => {
                    setCancellingItem(null);
                    setCustomCancelReason("");
                  }}
                >
                  Nevermind, Keep Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SafariScheduleManager;

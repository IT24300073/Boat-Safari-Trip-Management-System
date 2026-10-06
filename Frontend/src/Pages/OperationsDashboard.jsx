import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/OperationsDashboard.css";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Ship,
  User,
  X,
  ExternalLink,
  Compass,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const OperationsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [loading, setLoading] = useState(true);
  const [selectedDayData, setSelectedDayData] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/schedules");
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date(2026, 9, 8)); // Focus on active schedules
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (d, dateString, daySchedules) => {
    const dayOfWeek = new Date(year, month, d).toLocaleDateString("en-US", { weekday: "long" });
    setSelectedDayData({
      dayNumber: d,
      dateString,
      dayOfWeek,
      formattedDate: `${dayOfWeek}, ${monthNames[month]} ${d}, ${year}`,
      schedules: daySchedules,
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const daySchedules = schedules.filter((s) => s.scheduleDate === dateString);
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      const hasExpeditions = daySchedules.length > 0;

      days.push(
        <div
          key={`day-${d}`}
          className={`calendar-day ${isToday ? "today" : ""} ${hasExpeditions ? "has-schedules" : ""}`}
          onClick={() => handleDayClick(d, dateString, daySchedules)}
          title={hasExpeditions ? `Click to view ${daySchedules.length} expeditions on ${monthNames[month]} ${d}` : `No expeditions on ${monthNames[month]} ${d}`}
        >
          <div className="day-header">
            <span className="day-number">{d}</span>
            {hasExpeditions && (
              <span className="day-status-dot" title={`${daySchedules.length} Expeditions active`}></span>
            )}
          </div>

          <div className="day-body">
            {hasExpeditions ? (
              <div className="day-expeditions-pill">
                <span className="pill-icon">⛵</span>
                <span className="pill-count">{daySchedules.length}</span>
                <span className="pill-label">{daySchedules.length === 1 ? "Expedition" : "Expeditions"}</span>
              </div>
            ) : (
              <span className="no-expeditions-text">-</span>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="operations-dashboard-container">
      {/* Dashboard Top Banner */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-badge">🧭 OPERATIONS & FLEET MANAGEMENT</div>
          <h1>Operations Manager Calendar</h1>
          <p>
            Welcome, {user?.name || "Operations Manager"}. Monitor and coordinate scheduled boat voyages across all registered vessels and licensed operators. Click any calendar day to inspect full voyage manifests.
          </p>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="calendar-card">
        <div className="calendar-header">
          <div className="calendar-title">
            <CalendarIcon className="title-icon" />
            <h2>{monthNames[month]} {year}</h2>
          </div>
          <div className="calendar-controls">
            <button className="btn-today" onClick={today}>Active Week</button>
            <button className="btn-nav" onClick={prevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <button className="btn-nav" onClick={nextMonth} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading safari expeditions...</div>
        ) : (
          <div className="calendar-grid">
            {dayNames.map((day, idx) => (
              <div key={`weekday-${idx}`} className="calendar-weekday">
                {day}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        )}
      </div>

      {/* Separated Day Details Popup Modal */}
      {selectedDayData && (
        <div className="day-modal-overlay" onClick={() => setSelectedDayData(null)}>
          <div className="day-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="day-modal-header">
              <div className="modal-title-group">
                <div className="modal-calendar-icon">
                  <CalendarIcon size={22} />
                </div>
                <div>
                  <h3>{selectedDayData.formattedDate}</h3>
                  <span className="modal-subtitle">
                    {selectedDayData.schedules.length === 0
                      ? "No safari voyages scheduled on this date"
                      : `${selectedDayData.schedules.length} Scheduled Safari Expeditions`}
                  </span>
                </div>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setSelectedDayData(null)}
                title="Close modal (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="day-modal-body">
              {selectedDayData.schedules.length === 0 ? (
                <div className="modal-empty-state">
                  <div className="empty-icon">⛵</div>
                  <h4>No Expeditions Scheduled</h4>
                  <p>
                    There are no safari trips or vessel assignments recorded for{" "}
                    <strong>{selectedDayData.formattedDate}</strong>.
                  </p>
                  <button
                    className="btn-modal-schedule"
                    onClick={() => {
                      setSelectedDayData(null);
                      navigate("/schedule");
                    }}
                  >
                    Schedule Expedition for this Date ➔
                  </button>
                </div>
              ) : (
                <div className="modal-schedule-list">
                  {selectedDayData.schedules.map((sched, idx) => {
                    const isCancelled = sched.status === "CANCELLED";
                    return (
                      <div
                        key={sched.id || idx}
                        className={`modal-schedule-card ${isCancelled ? "cancelled" : ""}`}
                      >
                        <div className="schedule-card-top">
                          <span className="modal-time-slot">
                            <Clock size={14} />
                            <strong>{sched.timeSlot}</strong>
                          </span>
                          <span className={`modal-status-badge ${isCancelled ? "cancelled" : "confirmed"}`}>
                            {isCancelled ? (
                              <>
                                <AlertCircle size={12} /> CANCELLED
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} /> {sched.status || "SCHEDULED"}
                              </>
                            )}
                          </span>
                        </div>

                        <div className="modal-trip-name">
                          <Compass size={16} className="trip-icon" />
                          <span>{sched.tripName}</span>
                          <span className="modal-sched-id">#{sched.id}</span>
                        </div>

                        <div className="modal-schedule-meta-grid">
                          <div className="meta-item">
                            <Ship size={14} className="meta-icon" />
                            <div>
                              <span className="meta-label">Assigned Vessel</span>
                              <strong className="meta-value">{sched.boatName || `Boat #${sched.boatId}`}</strong>
                            </div>
                          </div>

                          <div className="meta-item">
                            <User size={14} className="meta-icon" />
                            <div>
                              <span className="meta-label">Certified Operator / Guide</span>
                              <strong className="meta-value">
                                {sched.guideName || "Pending Assignment"}
                              </strong>
                              {sched.guideLicense && (
                                <span className="meta-license">Lic: {sched.guideLicense}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {sched.cancelReason && (
                          <div className="modal-cancel-reason">
                            ⚠️ <strong>Reason:</strong> {sched.cancelReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="day-modal-footer">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setSelectedDayData(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => {
                  setSelectedDayData(null);
                  navigate("/schedule");
                }}
              >
                Open Safari Schedule Manager <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;

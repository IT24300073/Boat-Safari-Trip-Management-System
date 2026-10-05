import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/OperationsDashboard.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Ship, User } from "lucide-react";

const OperationsDashboard = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/schedules");
      setSchedules(response.data);
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
    setCurrentDate(new Date());
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

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const daySchedules = schedules.filter(s => s.scheduleDate === dateString);
      
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div key={`day-${d}`} className={`calendar-day ${isToday ? 'today' : ''}`}>
          <div className="day-header">
            <span className="day-number">{d}</span>
            {daySchedules.length > 0 && <span className="day-badge">{daySchedules.length}</span>}
          </div>
          <div className="day-schedules">
            {daySchedules.map((sched, idx) => (
              <div key={idx} className="schedule-item">
                <div className="schedule-time"><Clock size={12}/> {sched.timeSlot.split('-')[0].trim()}</div>
                <div className="schedule-title">{sched.tripName}</div>
                <div className="schedule-details">
                  <span><Ship size={10}/> {sched.boatName || 'Unassigned'}</span>
                  <span><User size={10}/> {sched.guideName || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="operations-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Operations Manager Dashboard</h1>
          <p>Welcome, {user?.name || "Manager"}. Plan resources easily without phoning around.</p>
        </div>
      </div>

      <div className="calendar-card">
        <div className="calendar-header">
          <div className="calendar-title">
            <CalendarIcon className="title-icon" />
            <h2>{monthNames[month]} {year}</h2>
          </div>
          <div className="calendar-controls">
            <button className="btn-today" onClick={today}>Today</button>
            <button className="btn-nav" onClick={prevMonth}><ChevronLeft /></button>
            <button className="btn-nav" onClick={nextMonth}><ChevronRight /></button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading schedules...</div>
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
    </div>
  );
};

export default OperationsDashboard;

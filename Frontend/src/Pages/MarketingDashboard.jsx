import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, Clock, Map, Users } from 'lucide-react';
import '../Styles/MarketingDashboard.css';

const MarketingDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data for trend analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data
  const { routeDemand, timeSlotDemand, combinedTrends } = useMemo(() => {
    const routeMap = {};
    const slotMap = {};
    const combinedMap = {};
    let maxCombined = 0;
    
    // Process only confirmed bookings
    const validBookings = bookings.filter(b => b.status !== 'CANCELLED' && b.bookingStatus !== 'CANCELLED');
    
    validBookings.forEach(b => {
      const route = b.trip?.name || 'Custom Safari';
      const slot = b.timeSlot || '08:00 AM - 10:00 AM';
      const passengers = b.passengers || (parseInt(b.adults || 0) + parseInt(b.children || 0)) || 1;

      // Aggregate by route
      if (!routeMap[route]) routeMap[route] = { route, bookings: 0, passengers: 0 };
      routeMap[route].bookings += 1;
      routeMap[route].passengers += passengers;

      // Aggregate by slot
      if (!slotMap[slot]) slotMap[slot] = { slot, bookings: 0, passengers: 0 };
      slotMap[slot].bookings += 1;
      slotMap[slot].passengers += passengers;
      
      // Combined Route + Slot
      const key = `${route} | ${slot}`;
      if (!combinedMap[key]) combinedMap[key] = { route, slot, bookings: 0, passengers: 0 };
      combinedMap[key].bookings += 1;
      combinedMap[key].passengers += passengers;
      
      if (combinedMap[key].bookings > maxCombined) {
        maxCombined = combinedMap[key].bookings;
      }
    });

    const routeDemand = Object.values(routeMap).sort((a, b) => b.bookings - a.bookings);
    const timeSlotDemand = Object.values(slotMap).sort((a, b) => b.bookings - a.bookings);
    
    const combinedTrends = Object.values(combinedMap)
      .sort((a, b) => b.bookings - a.bookings)
      .map(item => ({
        ...item,
        percentage: maxCombined > 0 ? (item.bookings / maxCombined) * 100 : 0
      }));

    return { routeDemand, timeSlotDemand, combinedTrends };
  }, [bookings]);

  return (
    <div className="marketing-dashboard">
      <div className="md-header">
        <div className="md-header-content">
          <div className="md-badge">Marketing & Promotions</div>
          <h1>Demand Trend Analysis</h1>
          <p>Welcome, {user?.name || 'Coordinator'}. View live demand trends by route and time slot to plan your promotional campaigns.</p>
        </div>
      </div>

      {loading ? (
        <div className="md-loading">Loading trend data...</div>
      ) : error ? (
        <div className="md-error">{error}</div>
      ) : (
        <div className="md-content">
          
          <div className="md-overview-cards">
            <div className="md-card primary-stat">
              <div className="md-card-icon"><TrendingUp size={24} /></div>
              <div className="md-card-info">
                <h3>Total Confirmed Bookings</h3>
                <div className="md-stat-value">{bookings.filter(b => b.status !== 'CANCELLED' && b.bookingStatus !== 'CANCELLED').length}</div>
              </div>
            </div>
            <div className="md-card primary-stat">
              <div className="md-card-icon route-icon"><Map size={24} /></div>
              <div className="md-card-info">
                <h3>Most Popular Route</h3>
                <div className="md-stat-value text-stat">{routeDemand[0]?.route || 'N/A'}</div>
              </div>
            </div>
            <div className="md-card primary-stat">
              <div className="md-card-icon slot-icon"><Clock size={24} /></div>
              <div className="md-card-info">
                <h3>Peak Time Slot</h3>
                <div className="md-stat-value text-stat">{timeSlotDemand[0]?.slot || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="md-trends-section">
            <div className="md-section-header">
              <BarChart3 className="section-icon" />
              <h2>Popularity Matrix (Route × Time Slot)</h2>
            </div>
            <p className="md-section-desc">Identify the highest demand combinations to target promotions efficiently.</p>
            
            <div className="md-matrix-list">
              {combinedTrends.length === 0 ? (
                <div className="md-empty">No booking data available yet.</div>
              ) : (
                combinedTrends.map((trend, idx) => (
                  <div key={idx} className="md-trend-item">
                    <div className="md-trend-details">
                      <div className="md-trend-titles">
                        <span className="md-trend-route">{trend.route}</span>
                        <span className="md-trend-slot">{trend.slot}</span>
                      </div>
                      <div className="md-trend-stats">
                        <span className="stat-pill bookings-pill">{trend.bookings} Bookings</span>
                        <span className="stat-pill passengers-pill"><Users size={12}/> {trend.passengers} Guests</span>
                      </div>
                    </div>
                    <div className="md-progress-track">
                      <div 
                        className="md-progress-fill" 
                        style={{ 
                          width: `${trend.percentage}%`,
                          backgroundColor: trend.percentage > 80 ? '#f59e0b' : (trend.percentage > 40 ? '#3182ce' : '#94a3b8')
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;

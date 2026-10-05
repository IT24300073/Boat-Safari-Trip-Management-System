import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Star, User, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import '../Styles/OperationsFeedback.css';

const OperationsFeedback = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, flagged, positive

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/feedbacks');
      setFeedbacks(response.data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError('Failed to fetch customer feedback data.');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/feedbacks/${id}/review`);
      // Update local state
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, flagged: false } : f));
    } catch (err) {
      console.error("Error marking feedback as reviewed:", err);
    }
  };

  // Stats calculation
  const totalFeedback = feedbacks.length;
  const avgRating = totalFeedback > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1) 
    : 0;
  const flaggedCount = feedbacks.filter(f => f.flagged).length;

  // Filtering
  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'flagged') return f.flagged;
    if (filter === 'positive') return f.rating >= 4;
    return true;
  }).sort((a, b) => b.id - a.id); // Assuming higher ID is newer if no date field

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index} 
        size={16} 
        fill={index < rating ? "#f59e0b" : "none"} 
        color={index < rating ? "#f59e0b" : "#cbd5e1"} 
      />
    ));
  };

  return (
    <div className="operations-feedback-container">
      <div className="feedback-header">
        <div className="feedback-header-content">
          <div className="fb-badge">Service Quality</div>
          <h1>Customer Feedback</h1>
          <p>Welcome, {user?.name || "Manager"}. Review customer feedback to monitor and improve service quality.</p>
        </div>
      </div>

      {loading ? (
        <div className="fb-loading">Loading feedback data...</div>
      ) : error ? (
        <div className="fb-error">{error}</div>
      ) : (
        <div className="fb-content">
          
          <div className="fb-stats-grid">
            <div className="fb-stat-card">
              <div className="fb-stat-icon-wrapper total"><MessageSquare size={24} /></div>
              <div className="fb-stat-info">
                <h3>Total Reviews</h3>
                <div className="fb-stat-value">{totalFeedback}</div>
              </div>
            </div>
            
            <div className="fb-stat-card">
              <div className="fb-stat-icon-wrapper rating"><Star size={24} fill="currentColor" /></div>
              <div className="fb-stat-info">
                <h3>Average Rating</h3>
                <div className="fb-stat-value">{avgRating} <span className="text-sm">/ 5.0</span></div>
              </div>
            </div>

            <div className="fb-stat-card">
              <div className="fb-stat-icon-wrapper flagged"><AlertTriangle size={24} /></div>
              <div className="fb-stat-info">
                <h3>Needs Attention</h3>
                <div className="fb-stat-value text-red">{flaggedCount}</div>
              </div>
            </div>
          </div>

          <div className="fb-controls">
            <h2>Recent Feedback</h2>
            <div className="fb-filters">
              <button className={`btn-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`btn-filter ${filter === 'positive' ? 'active' : ''}`} onClick={() => setFilter('positive')}>Positive (4+)</button>
              <button className={`btn-filter ${filter === 'flagged' ? 'active' : ''}`} onClick={() => setFilter('flagged')}>Flagged</button>
            </div>
          </div>

          <div className="fb-list">
            {filteredFeedbacks.length === 0 ? (
              <div className="fb-empty">No feedback found matching the selected criteria.</div>
            ) : (
              filteredFeedbacks.map((fb) => (
                <div key={fb.id} className={`fb-card ${fb.flagged ? 'flagged-card' : ''}`}>
                  <div className="fb-card-header">
                    <div className="fb-user">
                      <div className="fb-avatar">
                        <User size={20} />
                      </div>
                      <div className="fb-user-info">
                        <h4>{fb.name || "Anonymous Guest"}</h4>
                        <span className="fb-email">{fb.email || "No email provided"}</span>
                      </div>
                    </div>
                    <div className="fb-rating-badge">
                      {renderStars(fb.rating)}
                    </div>
                  </div>
                  
                  <div className="fb-body">
                    <p>"{fb.message || "No comments provided."}"</p>
                  </div>

                  <div className="fb-card-footer">
                    <div className="fb-meta">
                      <span className="fb-meta-item">
                        <Calendar size={14} /> ID: #{fb.id}
                      </span>
                    </div>
                    
                    {fb.flagged && (
                      <button 
                        className="btn-mark-reviewed" 
                        onClick={() => markAsReviewed(fb.id)}
                      >
                        <CheckCircle size={16} /> Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default OperationsFeedback;

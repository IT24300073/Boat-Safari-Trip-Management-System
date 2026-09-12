import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../Styles/Feedback.css";

function Feedback() {
  const { user, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    rating: 5,
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

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

  // Fetch reviews list
  const fetchReviews = () => {
    axios
      .get("http://localhost:8080/api/feedbacks")
      .then((res) => setReviews(res.data || []))
      .catch((err) => console.error("Error fetching reviews:", err));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!/^[A-Za-z\s]{3,50}$/.test(formData.name.trim())) {
      return "Name must be 3–50 characters (letters only).";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (formData.message.trim().length < 10) {
      return "Feedback must be at least 10 characters long.";
    }

    if (formData.message.length > 500) {
      return "Feedback cannot exceed 500 characters.";
    }

    if (formData.rating < 1 || formData.rating > 5) {
      return "Please select a rating between 1 and 5 stars.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/feedbacks", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        rating: Number(formData.rating),
      });

      setSuccess("🎉 Thank you for sharing your experience with ALOKA Safari!");
      setError("");
      setFormData({
        name: isLoggedIn && user?.name ? user.name : "",
        email: isLoggedIn && user?.email ? user.email : "",
        message: "",
        rating: 5,
      });

      fetchReviews();
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to submit feedback. Please check your connection and try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page-outer">
      <div className="feedback-page-container">
        <div className="feedback-card-wrapper">
          <div className="feedback-header">
            <span className="feedback-badge">TESTIMONIAL</span>
            <h2>We Value Your Feedback 📝</h2>
            <p>Tell us about your safari adventure! Your review helps us continuously improve our service.</p>
          </div>

          {success && (
            <div className="alert-box success">
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="alert-box error">
              <span>{error}</span>
            </div>
          )}

          <form className="feedback-form-layout" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Sarah Jenkins"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Your Email</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Overall Trip Rating</label>
              <div className="star-rating-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoverRating || formData.rating) ? "active" : ""}`}
                    onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    title={`${star} Star${star > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-label-text">
                  {formData.rating === 5 && "⭐ 5/5 - Outstanding!"}
                  {formData.rating === 4 && "⭐ 4/5 - Very Good"}
                  {formData.rating === 3 && "⭐ 3/5 - Good"}
                  {formData.rating === 2 && "⭐ 2/5 - Fair"}
                  {formData.rating === 1 && "⭐ 1/5 - Poor"}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Your Safari Experience / Feedback</label>
              <textarea
                name="message"
                placeholder="What did you enjoy most about your safari trip? Mention boat comfort, guide expertise, wildlife sightings..."
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
              <span className="char-count">{formData.message.length}/500 characters</span>
            </div>

            <button type="submit" className="btn-submit-feedback" disabled={loading}>
              {loading ? "Submitting Review..." : "Publish Review"}
            </button>
          </form>
        </div>
      </div>

      {/* Community Guest Reviews List */}
      <div className="community-reviews-container">
        <div className="community-reviews-header">
          <h3>💬 Guest Reviews & Safari Stories</h3>
          <p>Read experiences shared by recent ALOKA Safari travelers.</p>
        </div>

        {reviews.length === 0 ? (
          <p className="no-reviews-text">No guest reviews yet. Be the first to share your experience!</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((r, i) => (
              <div key={r.id || i} className="review-card">
                <div className="review-card-top">
                  <div className="review-avatar-circle">
                    {r.name ? r.name.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div className="review-user-details">
                    <span className="review-user-name">{r.name}</span>
                    <span className="review-verified-tag">✓ Verified Traveler</span>
                  </div>
                  <div className="review-stars-display">
                    {"★".repeat(Math.min(5, Math.max(1, r.rating || 5)))}
                  </div>
                </div>
                <p className="review-body-text">"{r.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Feedback;

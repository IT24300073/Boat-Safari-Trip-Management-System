

import { useState } from "react";
import axios from "axios";
import "../Styles/Feedback.css";

function Feedback() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    rating: 5,
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      return "Rating must be between 1 and 5 stars.";
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
        ...formData,
        name: formData.name.trim(),
        message: formData.message.trim(),
        rating: Number(formData.rating),
      });

      setSuccess("🎉 Thank you for sharing your experience with ALOKA Safari!");
      setError("");
      setFormData({ name: "", email: "", message: "", rating: 5 });
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to submit feedback. Please check your connection and try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <label>Overall Experience Rating</label>
            <div className="rating-select-box">
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5 - Outstanding)</option>
                <option value={4}>⭐⭐⭐⭐ (4/5 - Very Good)</option>
                <option value={3}>⭐⭐⭐ (3/5 - Good)</option>
                <option value={2}>⭐⭐ (2/5 - Fair)</option>
                <option value={1}>⭐ (1/5 - Poor)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Your Safari Story / Feedback</label>
            <textarea
              name="message"
              placeholder="What did you enjoy most about your safari trip? Mention boat comfort, guide, sights..."
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <span className="char-count">{formData.message.length}/500 characters</span>
          </div>

          <button type="submit" className="btn-submit-feedback" disabled={loading}>
            {loading ? "Submitting Review..." : "Publish Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Feedback;


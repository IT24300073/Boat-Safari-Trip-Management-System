import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");

    axios
      .get("http://localhost:8080/api/feedbacks")
      .then((res) => setFeedbacks(res.data))
      .catch((err) => console.error("Error fetching feedbacks:", err));
  }, []);

  return (
    <div className="home-container">
      {/* Profile button in top right */}
      {isLoggedIn && (
        <div className="profile-button" onClick={() => navigate("/usermanagement")}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="User"
            className="profile-icon"
          />
        </div>
      )}

      {/* Hero Section */}
      <header className="hero">
        <h1 className="hero-title">Welcome to ALOKA AKA DEKU Safari 🚤</h1>
        <p className="hero-subtitle">Explore the beauty of nature on water</p>
        <div className="hero-buttons">
        <button
  className="book-btn"
  onClick={() => {
    if (isLoggedIn) {
      navigate("/booktrip");
    } else {
      navigate("/login"); // Redirect to login if not logged in
    }
  }}
>
  Book Now
</button>


          {!isLoggedIn && (
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* About Section */}
      <section className="about">
        <h2>Why Choose Us?</h2>
        <p>
          Experience breathtaking boat safaris with professional guides, safe boats, 
          and unforgettable views. Perfect for families, friends, and adventurers!
        </p>
      </section>

      {/* Feedback Section */}
      <section className="feedbacks">
        <h2>What Our Guests Say</h2>
        {feedbacks.length === 0 ? (
          <p>No feedbacks yet. Be the first to share your experience!</p>
        ) : (
          <div className="feedback-list">
            {feedbacks.map((f, index) => (
              <div key={index} className="feedback-card">
                <h4>
                  {f.name} <span className="email">({f.email})</span>
                </h4>
                <p className="message">"{f.message}"</p>
                <small className="rating">⭐ {f.rating}/5</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;

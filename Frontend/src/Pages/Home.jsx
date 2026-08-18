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

  const handleBookNow = () => {
    if (isLoggedIn) {
      navigate("/booktrip");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="home-container">
      {/* Top Floating User Profile Pill (when logged in) */}
      {isLoggedIn && (
        <div 
          className="profile-pill-container" 
          onClick={() => navigate("/usermanagement")}
          title="Go to User Profile"
        >
          <div className="profile-pill-badge">
            <span className="online-indicator"></span>
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="User Profile"
              className="profile-avatar"
            />
            <span className="profile-text">My Account</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚤</span>
            <span>Premier Water Adventures in Sri Lanka</span>
          </div>
          <h1 className="hero-title">
            Explore The Beauty Of Nature On Water With <span className="highlight-text">ALOKA Safari</span>
          </h1>
          <p className="hero-subtitle">
            Unforgettable boat tours through pristine mangroves, scenic rivers, and rich wildlife habitats. Professional captains, eco-friendly luxury boats, and memories for a lifetime.
          </p>
          
          <div className="hero-actions">
            <button className="btn-primary-hero" onClick={handleBookNow}>
              Book Safari Now
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            
            {!isLoggedIn ? (
              <button className="btn-secondary-hero" onClick={() => navigate("/login")}>
                Sign In to Account
              </button>
            ) : (
              <a href="#packages" className="btn-secondary-hero">
                Explore Packages
              </a>
            )}
          </div>

          {/* Quick Metrics / Stats Bar */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">5,000+</span>
              <span className="stat-label">Happy Guests</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">4.9 ⭐</span>
              <span className="stat-label">Average Rating</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Safety Record</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">15+</span>
              <span className="stat-label">Safari Boats</span>
            </div>
          </div>
        </div>
      </header>

      {/* Why Choose Us / Features Section */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-subtitle">THE ALOKA ADVANTAGE</span>
          <h2 className="section-title">Why Adventurers Choose Our Safari</h2>
          <p className="section-description">
            We provide top-notch boat safari management with safety, luxury, and authentic nature encounters at heart.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Certified Safety First</h3>
            <p>Life jackets for all ages, GPS navigation, and fully licensed captains trained in emergency response.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </div>
            <h3>Eco-Friendly Tours</h3>
            <p>Low-emission silent motors designed to respect mangrove ecosystems and natural wildlife habitats.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>Expert Local Guides</h3>
            <p>Knowledgeable guides pointing out rare bird species, crocs, monitor lizards, and exotic flora.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>Instant Easy Booking</h3>
            <p>Seamless online trip booking system with real-time seat availability and instant confirmation.</p>
          </div>
        </div>
      </section>

      {/* Featured Safari Packages Showcase */}
      <section className="packages-section" id="packages">
        <div className="section-header">
          <span className="section-subtitle">POPULAR ADVENTURES</span>
          <h2 className="section-title">Explore Featured Safari Trips</h2>
          <p className="section-description">
            Choose from our curated safari itineraries crafted for families, couples, and thrill-seekers.
          </p>
        </div>

        <div className="packages-grid">
          <div className="package-card">
            <div className="package-badge">Most Popular</div>
            <div className="package-header sunset">
              <span className="package-icon">🌅</span>
              <h3>Sunset Mangrove Safari</h3>
            </div>
            <div className="package-body">
              <div className="package-meta">
                <span>⏱️ 2 Hours</span>
                <span>👨‍👩‍👧‍👦 Up to 8 Guests</span>
              </div>
              <p className="package-desc">
                Glide through calm river mangroves during golden hour. Spot roosting birds and enjoy breathtaking sunset colors.
              </p>
              <ul className="package-features">
                <li>✓ Complimentary bottled water</li>
                <li>✓ Experienced wildlife guide</li>
                <li>✓ Sun canopy & comfortable seats</li>
              </ul>
              <button className="package-btn" onClick={handleBookNow}>
                Book Sunset Tour
              </button>
            </div>
          </div>

          <div className="package-card featured">
            <div className="package-badge highlight">Best Value</div>
            <div className="package-header river">
              <span className="package-icon">🐊</span>
              <h3>Deep River Wildlife Expedition</h3>
            </div>
            <div className="package-body">
              <div className="package-meta">
                <span>⏱️ 3.5 Hours</span>
                <span>👨‍👩‍👧‍👦 Up to 10 Guests</span>
              </div>
              <p className="package-desc">
                Deep inland safari journey exploring secret lagoons, crocodile watching spots, and lush tropical flora.
              </p>
              <ul className="package-features">
                <li>✓ Fresh tropical fruit snack</li>
                <li>✓ Binoculars provided</li>
                <li>✓ Complete safety gear included</li>
              </ul>
              <button className="package-btn primary" onClick={handleBookNow}>
                Book Expedition
              </button>
            </div>
          </div>

          <div className="package-card">
            <div className="package-badge">Exclusive</div>
            <div className="package-header vip">
              <span className="package-icon">👑</span>
              <h3>VIP Private Charter Safari</h3>
            </div>
            <div className="package-body">
              <div className="package-meta">
                <span>⏱️ Custom Duration</span>
                <span>⛵ Private Boat</span>
              </div>
              <p className="package-desc">
                Tailored private boat rental for special occasions, photography sessions, or private family gatherings.
              </p>
              <ul className="package-features">
                <li>✓ Personalized trip schedule</li>
                <li>✓ Premium seating & audio</li>
                <li>✓ Dedicated private captain</li>
              </ul>
              <button className="package-btn" onClick={handleBookNow}>
                Reserve Private Boat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Reviews & Testimonials Section */}
      <section className="feedbacks-section">
        <div className="section-header">
          <span className="section-subtitle">TESTIMONIALS</span>
          <h2 className="section-title">What Our Guests Say</h2>
          <p className="section-description">
            Real stories and experiences shared by adventurers who toured with ALOKA Safari.
          </p>
        </div>

        {feedbacks.length === 0 ? (
          <div className="empty-feedback-card">
            <div className="empty-icon">💬</div>
            <h3>No Reviews Yet</h3>
            <p>Be the first guest to share your safari adventure experience with us!</p>
            <button 
              className="btn-feedback-cta"
              onClick={() => navigate(isLoggedIn ? "/feedback" : "/login")}
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="feedback-grid">
            {feedbacks.map((f, index) => (
              <div key={index} className="feedback-card">
                <div className="feedback-card-header">
                  <div className="feedback-avatar">
                    {f.name ? f.name.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div className="feedback-user-info">
                    <h4>{f.name}</h4>
                    {f.email && <span className="feedback-email">{f.email}</span>}
                  </div>
                  <div className="feedback-rating">
                    {"⭐".repeat(Math.min(5, Math.max(1, f.rating || 5)))}
                  </div>
                </div>
                <p className="feedback-message">"{f.message}"</p>
                <div className="feedback-card-footer">
                  <span className="verified-badge">✓ Verified Guest</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="feedback-action-bar">
          <button
            className="btn-secondary-outline"
            onClick={() => navigate(isLoggedIn ? "/feedback" : "/login")}
          >
            {isLoggedIn ? "✍️ Share Your Feedback" : "Sign In to Leave Feedback"}
          </button>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner-content">
          <h2>Ready For An Unforgettable Safari Adventure?</h2>
          <p>Book your boat seats today and create everlasting memories with family and friends on Sri Lanka's beautiful waters.</p>
          <button className="btn-cta-large" onClick={handleBookNow}>
            Reserve Your Trip Now 🚀
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;

